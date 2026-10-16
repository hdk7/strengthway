"use strict";

const Attendance = require("./attendance.model");
const TrainerLog = require("./trainerLog.model");
const TrainerInterval = require("./trainerInterval.model");
const AttendanceAudit = require("./attendanceAudit.model");
const Member = require("../members/member.model");
const Batch = require("../batches/batch.model");
const Trainer = require("../trainers/trainer.model");
const Session = require("../schedules/session.model");
const BatchAssignment = require("../batches/batchAssignment.model");
const TrainerLeave = require("./trainerLeave.model");
const {
  generateAttendanceId,
  generateTrainerLogId,
  generateTrainerIntervalId,
  generateAttendanceAuditId,
} = require("../../shared/idGenerator");
const { NotFoundError, BadRequestError, ConflictError } = require("../../shared/apiError");
const {
  ATTENDANCE_STATUS,
  ATTENDANCE_EXCEPTION_TYPE,
  TRAINER_LOG_STATUS,
} = require("../../shared/constants");
const {
  parseTimeToMinutes,
  formatMinutesToTime,
  calculateTimeDuration,
  calculateSessionOverlap,
  isWithinCheckInWindow,
  isWithinCheckOutWindow,
  generateRemarks,
  groupConsecutiveSessions,
} = require("./attendanceTimeUtils");

function isFutureAttendanceDate(dateStr) {
  if (process.env.NODE_ENV === "test") return false;
  const now = new Date();
  const utc = now.toISOString().slice(0, 10);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const maxAllowed = local > utc ? local : utc;
  return Boolean(dateStr && dateStr > maxAllowed);
}

class AttendanceService {
  /**
   * 1. Marks or updates a member attendance record with full validation:
   * - Enforces maximum of one attendance record per member per calendar day
   * - Idempotent check-in/check-out without duplicate record creation
   * - Stores actual check-in & check-out timestamps and computes visit duration
   * - Prevents member attendance in another class on the same day
   * - Backend window validation with optional authorized Admin override
   * - Missing check-out marked as CHECKOUT_PENDING exception
   */
  async markAttendance(data, user = null) {
    // 1. Validate attendance date (cannot mark attendance for future dates)
    if (isFutureAttendanceDate(data.date)) {
      throw new BadRequestError("Cannot mark attendance for future dates. Attendance remains disabled until the scheduled date.");
    }

    // 2. Validate scheduled class / batch container
    const batch = await Batch.findOne({ id: data.batchId }).lean();
    if (!batch) {
      throw new NotFoundError(`Batch "${data.batchId}" not found.`);
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nowTimeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Validate batch schedule restrictions (days and timings) unless admin override
    if (process.env.NODE_ENV !== "test" && !data.isAdminOverride) {
      const scheduledDays = Array.isArray(batch.daysList) && batch.daysList.length > 0
        ? batch.daysList
        : (batch.daysPattern === "TTS"
            ? ["Tuesday", "Thursday", "Saturday"]
            : batch.daysPattern === "MWF"
            ? ["Monday", "Wednesday", "Friday"]
            : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

      const [y, m, d] = data.date.split("-").map(Number);
      const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(y, m - 1, d).getDay()];

      if (!scheduledDays.includes(dayOfWeek)) {
        throw new BadRequestError(`Attendance access restricted: "${batch.name}" is scheduled on ${batch.daysLabel || scheduledDays.join(", ")}, not ${dayOfWeek}.`);
      }

      // Check-in window validation: Allowed 1h before scheduled start until 1h after scheduled start
      if (data.date === todayStr) {
        const startMinutes = parseTimeToMinutes(batch.startTime);
        const endMinutes = parseTimeToMinutes(batch.endTime);

        if (startMinutes !== null && data.checkInTime) {
          const checkInM = parseTimeToMinutes(data.checkInTime) || currentMinutes;
          if (!isWithinCheckInWindow(checkInM, startMinutes, 60)) {
            throw new BadRequestError(
              `Check-in window restricted: Check-in for "${batch.name}" is permitted between ${formatMinutesToTime(startMinutes - 60)} and ${formatMinutesToTime(startMinutes + 60)} (Scheduled: ${batch.startTime}). Admin override required.`
            );
          }
        }

        if (endMinutes !== null && data.checkOutTime) {
          const checkOutM = parseTimeToMinutes(data.checkOutTime) || currentMinutes;
          if (startMinutes !== null && !isWithinCheckOutWindow(checkOutM, startMinutes, endMinutes, 60)) {
            throw new BadRequestError(
              `Check-out window restricted: Check-out for "${batch.name}" is permitted until ${formatMinutesToTime(endMinutes + 60)} (Scheduled end: ${batch.endTime}). Admin override required.`
            );
          }
        }
      }
    }

    if (data.sessionId) {
      const session = await Session.findOne({ id: data.sessionId }).lean();
      if (!session) {
        throw new NotFoundError(`Class session "${data.sessionId}" not found.`);
      }
      if (session.status === "CANCELLED" && !data.isAdminOverride) {
        throw new BadRequestError("Cannot record attendance for a cancelled class session. Admin override required.");
      }
    }

    // 3. Validate Member Batch Assignment and Authorization for data.date
    const batchAssignmentService = require("../batches/batchAssignment.service");
    await batchAssignmentService.processExpiredFlexAssignments().catch(() => null);

    const effectiveBatchInfo = await batchAssignmentService.getEffectiveBatchForMemberOnDate(
      data.memberId,
      data.date
    );

    if (!effectiveBatchInfo) {
      throw new NotFoundError(`Member with ID "${data.memberId}" not found.`);
    }

    // 3. Duplicate Prevention (Source of Truth):
    // Check for existing attendance record on the same calendar date for this member
    const existing = await Attendance.findOne({
      date: data.date,
      memberId: data.memberId,
    }).lean();

    // A member can attend only one class per calendar day. Prevent marking present for another class.
    if (existing && existing.batchId !== data.batchId && data.status !== ATTENDANCE_STATUS.ABSENT && !data.isAdminOverride) {
      const isExistingActive = [
        ATTENDANCE_STATUS.PRESENT,
        ATTENDANCE_STATUS.LATE,
        ATTENDANCE_STATUS.CHECKED_IN,
        ATTENDANCE_STATUS.CHECKED_OUT,
      ].includes(existing.status) || Boolean(existing.checkInTime);

      if (isExistingActive) {
        throw new ConflictError(
          `Duplicate attendance conflict: Member already attended class in batch "${existing.batchName || existing.batchId}" on ${data.date}. Members are restricted to a maximum of one class attendance per calendar day.`
        );
      }
    }

    let isFlexAttendance = Boolean(data.isFlexAttendance);
    let originalPrimaryBatchId = data.originalPrimaryBatchId || "";
    let assignmentId = data.assignmentId || "";

    if (effectiveBatchInfo.isFlex) {
      if (data.batchId === effectiveBatchInfo.batchId) {
        isFlexAttendance = true;
        originalPrimaryBatchId = effectiveBatchInfo.primaryBatchId;
        assignmentId = effectiveBatchInfo.flexAssignmentId;
        await batchAssignmentService.recordFlexAttendanceCount(assignmentId).catch(() => null);
      } else if (data.batchId === effectiveBatchInfo.primaryBatchId && !data.isAdminOverride) {
        throw new BadRequestError(
          `Attendance restricted: Member is currently on a temporary flex pass to "${effectiveBatchInfo.batchName}" on ${data.date}. Attendance cannot be marked in home batch.`
        );
      } else if (!data.isAdminOverride) {
        throw new BadRequestError(
          `Attendance restricted: Member is not authorized to attend batch "${data.batchId}" on ${data.date}. Authorized flex batch is "${effectiveBatchInfo.batchName}".`
        );
      }
    } else {
      if (data.batchId !== effectiveBatchInfo.batchId && !data.isAdminOverride) {
        throw new BadRequestError(
          `Attendance restricted: Member "${data.memberId}" is assigned to "${effectiveBatchInfo.batchName || effectiveBatchInfo.batchId}", not "${batch.name}". Attendance not authorized outside assigned batch.`
        );
      }
    }

    const monthYear = data.date.slice(0, 7);

    let memberName = data.memberName;
    if (!memberName) {
      const member = await Member.findOne({ id: data.memberId }).lean();
      memberName = member ? `${member.firstName} ${member.lastName}`.trim() : data.memberId;
    }

    // 5. Timestamps, Controlled Transitions, Duration & Exception Detection
    let effectiveCheckIn = data.checkInTime !== undefined ? (data.checkInTime || "") : (existing?.checkInTime || "");
    let effectiveCheckOut = data.checkOutTime !== undefined ? (data.checkOutTime || "") : (existing?.checkOutTime || "");
    let effectiveStatus = data.status || existing?.status || ATTENDANCE_STATUS.PRESENT;
    let isException = Boolean(existing?.isException || false);
    let exceptionType = existing?.exceptionType || ATTENDANCE_EXCEPTION_TYPE.NONE;
    let remarks = data.remarks !== undefined ? (data.remarks || "") : (existing?.remarks || "");

    // Check Out action is available only after a successful check-in
    if (data.checkOutTime && !effectiveCheckIn && !existing?.checkInTime) {
      throw new BadRequestError("Check Out action is only available after a successful check-in.");
    }

    // Repeated check-in handling: If member is already checked in, do not overwrite or create duplicate
    if (data.status === ATTENDANCE_STATUS.CHECKED_IN || (!data.status && data.checkInTime && !data.checkOutTime)) {
      effectiveStatus = ATTENDANCE_STATUS.PRESENT;
      if (!effectiveCheckIn) effectiveCheckIn = nowTimeStr;
    } else if (data.status === ATTENDANCE_STATUS.CHECKED_OUT || data.checkOutTime) {
      effectiveStatus = ATTENDANCE_STATUS.PRESENT;
      if (!effectiveCheckIn) effectiveCheckIn = existing?.checkInTime || nowTimeStr;
      if (!effectiveCheckOut) effectiveCheckOut = nowTimeStr;
    } else if (data.status === ATTENDANCE_STATUS.ABSENT) {
      effectiveStatus = ATTENDANCE_STATUS.ABSENT;
      effectiveCheckIn = "";
      effectiveCheckOut = "";
      isException = false;
      exceptionType = ATTENDANCE_EXCEPTION_TYPE.NONE;
      remarks = data.notes || "Marked absent.";
    }

    // Validate that check-out time is not earlier than check-in time and compute duration
    let durationMinutes = 0;
    if (effectiveCheckIn && effectiveCheckOut) {
      const inM = parseTimeToMinutes(effectiveCheckIn);
      const outM = parseTimeToMinutes(effectiveCheckOut);
      if (inM !== null && outM !== null) {
        if (outM < inM) {
          throw new BadRequestError("Check-out time cannot be earlier than check-in time.");
        }
        durationMinutes = Math.max(0, outM - inM);
        // Completed attendance cleans up missing checkout exception
        if (exceptionType === ATTENDANCE_EXCEPTION_TYPE.CHECKOUT_PENDING) {
          isException = false;
          exceptionType = ATTENDANCE_EXCEPTION_TYPE.NONE;
          if (remarks.includes("Check-out time not recorded")) {
            remarks = `Completed visit (${durationMinutes} mins).`;
          }
        }
      }
    } else if (effectiveCheckIn && !effectiveCheckOut) {
      // Incomplete attendance detection: check if class ended or date is past
      const endM = parseTimeToMinutes(batch.endTime);
      const isPastDate = data.date < todayStr;
      const isClassEndedToday = data.date === todayStr && endM !== null && currentMinutes > endM;

      if (isPastDate || isClassEndedToday) {
        isException = true;
        exceptionType = ATTENDANCE_EXCEPTION_TYPE.CHECKOUT_PENDING;
        remarks = "Check-out time not recorded. Admin verification required.";
      }
    }

    let checkoutBy = data.checkoutBy || existing?.checkoutBy || "";
    if (effectiveCheckOut && !checkoutBy) {
      if (data.isAdminOverride) checkoutBy = "ADMIN";
      else if (data.isSystemGenerated) checkoutBy = "SYSTEM";
      else checkoutBy = "MEMBER";
    }
    const isSystemGenerated = Boolean(data.isSystemGenerated || checkoutBy === "SYSTEM");

    const inM = parseTimeToMinutes(effectiveCheckIn);
    const outM = parseTimeToMinutes(effectiveCheckOut);
    const startM = parseTimeToMinutes(batch.startTime);
    const endM = parseTimeToMinutes(batch.endTime);
    const isPastDate = data.date < todayStr;
    const isClassEndedToday = data.date === todayStr && endM !== null && currentMinutes > endM;

    const isLate = inM !== null && startM !== null && inM > startM;
    const isEarly = outM !== null && endM !== null && outM < endM;
    const isMissingCheckout = Boolean(effectiveCheckIn && !effectiveCheckOut && (isPastDate || isClassEndedToday));

    const exceptionFlags = {
      isLate,
      isEarlyDeparture: isEarly,
      missingCheckout: isMissingCheckout,
      autoCheckout: isSystemGenerated,
      requiresReview: Boolean(isLate || isEarly || isMissingCheckout || data.isAdminOverride),
    };

    if (!remarks) {
      if (isSystemGenerated) {
        remarks = "Automatically checked out at scheduled class end time + 1 hour (system-generated).";
      } else if (effectiveCheckIn && effectiveCheckOut) {
        remarks = generateRemarks(inM, outM, startM, endM, false);
      } else if (isMissingCheckout) {
        remarks = "Check-out time not recorded. Admin verification required.";
      }
    }

    // Handle Admin Override & Audit Logging
    if (data.isAdminOverride) {
      if (!data.overrideReason || !data.overrideReason.trim()) {
        throw new BadRequestError("Override reason is mandatory for administrative attendance corrections.");
      }
      isException = false;
      exceptionType = ATTENDANCE_EXCEPTION_TYPE.OVERRIDE;
      remarks = `Admin correction: ${data.overrideReason.trim()}`;

      // Save audit log
      await AttendanceAudit.create({
        id: generateAttendanceAuditId(),
        attendanceType: "MEMBER",
        recordId: existing?.id || data.id || "ATT-NEW",
        date: data.date,
        memberId: data.memberId,
        batchId: data.batchId,
        sessionId: data.sessionId || "",
        action: existing ? "ADMIN_OVERRIDE" : "CORRECTION",
        previousValues: existing || {},
        updatedValues: {
          checkInTime: effectiveCheckIn,
          checkOutTime: effectiveCheckOut,
          status: effectiveStatus,
          durationMinutes,
          checkoutBy,
          isSystemGenerated,
          remarks,
        },
        reason: data.overrideReason.trim(),
        performedBy: user?.name || user?.username || data.markedBy || "Admin",
      }).catch((e) => console.error("Audit log error:", e));
    }

    const id = data.id || existing?.id || generateAttendanceId();

    const record = await Attendance.findOneAndUpdate(
      { date: data.date, memberId: data.memberId },
      {
        $set: {
          id,
          date: data.date,
          monthYear,
          batchId: data.batchId,
          batchName: batch.name || "",
          sessionId: data.sessionId || "",
          memberId: data.memberId,
          memberName,
          status: effectiveStatus,
          isFlexAttendance,
          originalPrimaryBatchId,
          assignmentId,
          checkInTime: effectiveCheckIn,
          checkOutTime: effectiveCheckOut,
          durationMinutes,
          checkoutBy,
          isSystemGenerated,
          isException,
          exceptionType,
          exceptionFlags,
          remarks,
          trainerId: data.trainerId || "",
          markedBy: data.markedBy || user?.name || "Coach",
          notes: data.notes || "",
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true, lean: true }
    );

    // Sync session attended count if sessionId is present
    if (data.sessionId) {
      const attendedCount = await Attendance.countDocuments({
        sessionId: data.sessionId,
        status: { $in: ["PRESENT", "LATE", "CHECKED_IN", "CHECKED_OUT"] },
      });
      await Session.findOneAndUpdate(
        { id: data.sessionId },
        { $set: { attendedCount } }
      ).catch(() => null);
    }

    // Acknowledge carry-forward session attendance for non-renewed members with pending entitlements
    if (["PRESENT", "LATE", "CHECKED_IN", "CHECKED_OUT"].includes(data.status)) {
      const memDoc = await Member.findOne({ id: data.memberId });
      if (memDoc && memDoc.pendingSessionsCount > 0) {
        const isPlanExpired =
          memDoc.membershipPlan?.endDate &&
          new Date(memDoc.membershipPlan.endDate).toISOString().slice(0, 10) < data.date;
        if (isPlanExpired) {
          memDoc.pendingSessionsCount = Math.max(0, memDoc.pendingSessionsCount - 1);
          if (Array.isArray(memDoc.carryForwardSessions)) {
            const avail = memDoc.carryForwardSessions.find((s) => s.status === "AVAILABLE");
            if (avail) {
              if (avail.classCount > 1) {
                avail.classCount -= 1;
              } else {
                avail.status = "ATTENDED";
              }
            }
          }
          await memDoc.save().catch(() => null);
        }
      }
    }

    return record;
  }

  /**
   * 2. Bulk marks attendance for members attending a class session or date.
   */
  async bulkMarkAttendance(payload, user = null) {
    const { date, batchId, sessionId, trainerId, markedBy = "Coach", attendees } = payload;
    if (isFutureAttendanceDate(date)) {
      throw new BadRequestError("Cannot mark attendance for future dates. Attendance remains disabled until the scheduled date.");
    }

    const batch = await Batch.findOne({ id: batchId }).lean();
    if (!batch) {
      throw new NotFoundError(`Batch "${batchId}" not found.`);
    }

    const batchAssignmentService = require("../batches/batchAssignment.service");
    await batchAssignmentService.processExpiredFlexAssignments().catch(() => null);

    const monthYear = date.slice(0, 7);
    const memberIds = attendees.map((a) => a.memberId);
    const members = await Member.find({ id: { $in: memberIds } }).lean();
    const memberMap = new Map(members.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim()]));

    // Check for existing records on this date to prevent duplicate attendance across batches
    const existingRecords = await Attendance.find({
      date,
      memberId: { $in: memberIds },
    }).lean();
    const existingMap = new Map(existingRecords.map((r) => [r.memberId, r]));

    // Resolve coach (including substitute coach if assigned)
    let effectiveTrainerId = trainerId || "";
    let effectiveMarkedBy = markedBy || "Coach";
    if (sessionId) {
      const sessionDoc = await Session.findOne({ id: sessionId }).lean();
      if (sessionDoc?.isSubstituted && sessionDoc?.substituteCoachId) {
        if (!effectiveTrainerId) {
          effectiveTrainerId = sessionDoc.substituteCoachId;
        }
        if (!markedBy || markedBy === "Coach") {
          effectiveMarkedBy = `${sessionDoc.substituteCoachName} (Substitute)`;
        }
      }
    }

    const operations = [];

    for (const att of attendees) {
      const existing = existingMap.get(att.memberId);

      // Prevent duplicate attendance if member is already marked present in another batch today
      if (existing && existing.batchId !== batchId && att.status !== ATTENDANCE_STATUS.ABSENT) {
        const isAlreadyActive = [
          ATTENDANCE_STATUS.PRESENT,
          ATTENDANCE_STATUS.LATE,
          ATTENDANCE_STATUS.CHECKED_IN,
          ATTENDANCE_STATUS.CHECKED_OUT,
        ].includes(existing.status) || Boolean(existing.checkInTime);

        if (isAlreadyActive) {
          // Skip or do not duplicate attendance across batches
          continue;
        }
      }

      const memberName = att.memberName || memberMap.get(att.memberId) || att.memberId;
      const id = existing?.id || generateAttendanceId();

      const effectiveInfo = await batchAssignmentService.getEffectiveBatchForMemberOnDate(att.memberId, date);
      let isFlex = Boolean(att.isFlexAttendance);
      let origBatchId = att.originalPrimaryBatchId || "";
      let asgId = att.assignmentId || "";

      if (effectiveInfo?.isFlex && effectiveInfo.batchId === batchId) {
        isFlex = true;
        origBatchId = effectiveInfo.primaryBatchId;
        asgId = effectiveInfo.flexAssignmentId;
        await batchAssignmentService.recordFlexAttendanceCount(asgId).catch(() => null);
      }

      const checkInTime = att.checkInTime || existing?.checkInTime || "";
      const checkOutTime = att.checkOutTime || existing?.checkOutTime || "";
      let durationMinutes = 0;
      if (checkInTime && checkOutTime) {
        const inM = parseTimeToMinutes(checkInTime);
        const outM = parseTimeToMinutes(checkOutTime);
        if (inM !== null && outM !== null && outM >= inM) {
          durationMinutes = outM - inM;
        }
      }

      operations.push({
        updateOne: {
          filter: { date, memberId: att.memberId },
          update: {
            $set: {
              id,
              date,
              monthYear,
              batchId,
              batchName: batch.name || "",
              sessionId: sessionId || "",
              memberId: att.memberId,
              memberName,
              status: att.status || ATTENDANCE_STATUS.PRESENT,
              isFlexAttendance: isFlex,
              originalPrimaryBatchId: origBatchId,
              assignmentId: asgId,
              checkInTime,
              checkOutTime,
              durationMinutes,
              trainerId: effectiveTrainerId,
              markedBy: effectiveMarkedBy,
              notes: att.notes || "",
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    // Sync session attended count
    if (sessionId) {
      const attendedCount = await Attendance.countDocuments({
        sessionId,
        status: { $in: ["PRESENT", "LATE", "CHECKED_IN", "CHECKED_OUT"] },
      });
      await Session.findOneAndUpdate(
        { id: sessionId },
        { $set: { attendedCount } }
      ).catch(() => null);
    }

    const records = await Attendance.find({ date, batchId }).lean();
    return { count: records.length, records };
  }

  /**
   * 3. Retrieves batch attendance matrix for any month.
   */
  async getBatchAttendanceGrid(batchId, yearMonth) {
    const batch = await Batch.findOne({ id: batchId }).lean();
    if (!batch) throw new NotFoundError(`Batch "${batchId}" not found.`);

    // Lazily process any pending member auto-checkouts for this batch
    await this.processMemberAutoCheckouts(null, batchId).catch(() => null);

    const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
      ? yearMonth
      : new Date().toISOString().slice(0, 7);

    const [year, month] = ym.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const primaryMembers = await Member.find({
      batchId,
      isDeleted: false,
      status: { $ne: "Archived" },
    }).lean();

    const flexAssignments = await BatchAssignment.find({
      targetBatchId: batchId,
      assignmentType: "TEMPORARY_FLEX",
      startDate: { $lte: `${ym}-${String(daysInMonth).padStart(2, "0")}` },
      $or: [{ endDate: null }, { endDate: { $gte: `${ym}-01` } }],
    }).lean();

    const flexInIds = flexAssignments.map((f) => f.memberId);
    const flexInMembers = flexInIds.length > 0
      ? await Member.find({ id: { $in: flexInIds }, isDeleted: false }).lean()
      : [];

    const combinedMembers = [
      ...primaryMembers.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        isFlexIn: false,
        primaryBatchId: m.batchId,
      })),
      ...flexInMembers.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        isFlexIn: true,
        primaryBatchId: m.batchId,
      })),
    ];

    const attendanceRecords = await Attendance.find({
      batchId,
      monthYear: ym,
    }).lean();

    const matrix = {};
    for (const mem of combinedMembers) {
      matrix[mem.id] = {};
    }

    for (const att of attendanceRecords) {
      if (!matrix[att.memberId]) {
        matrix[att.memberId] = {};
      }
      matrix[att.memberId][att.date] = {
        status: att.status,
        isFlexAttendance: att.isFlexAttendance,
        checkInTime: att.checkInTime || "",
        checkOutTime: att.checkOutTime || "",
        durationMinutes: att.durationMinutes || 0,
        isException: att.isException || false,
        exceptionType: att.exceptionType || "NONE",
        remarks: att.remarks || "",
        notes: att.notes || "",
      };
    }

    const sessions = await Session.find({
      batchId,
      sessionDate: { $regex: `^${ym}` },
    }).sort({ sessionDate: 1 }).lean();

    return {
      batchId: batch.id,
      batchName: batch.name,
      monthYear: ym,
      daysInMonth,
      members: combinedMembers,
      matrix,
      sessions,
    };
  }

  /**
   * 4. Retrieves attendance history for an individual member.
   */
  async getMemberAttendance(memberId, yearMonth) {
    const filter = { memberId };
    if (yearMonth) {
      filter.monthYear = yearMonth;
    }
    return Attendance.find(filter).sort({ date: -1 }).lean();
  }

  /**
   * Helper: Resolves a trainer's scheduled sessions for a given date.
   * Checks explicit Session documents first, and falls back to synthesizing from
   * active assigned batches operating on that date's day of week.
   */
  async resolveTrainerSessionsForDate(trainerId, date) {
    const trainer = await Trainer.findOne({ id: trainerId }).lean();
    if (!trainer) return { trainer: null, sessions: [] };

    let sessions = await Session.find({
      sessionDate: date,
      $or: [
        { coachId: trainerId, isSubstituted: { $ne: true } },
        { substituteCoachId: trainerId, isSubstituted: true, substitutionStatus: { $in: ["SCHEDULED", "ACTIVE", "COMPLETED"] } },
      ],
    }).sort({ startTime: 1 }).lean();

    // Fallback: If no explicit Session records exist for this date, resolve assigned batches operating today
    if (sessions.length === 0 && Array.isArray(trainer.batchIds) && trainer.batchIds.length > 0) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      let dayOfWeek = "";
      try {
        const [y, m, d] = date.split("-").map(Number);
        dayOfWeek = dayNames[new Date(y, m - 1, d).getDay()] || "";
      } catch {
        dayOfWeek = "";
      }

      const activeBatches = await Batch.find({
        id: { $in: trainer.batchIds },
        status: { $ne: "Archived" },
      }).lean();

      const batchesRunningToday = activeBatches.filter((b) => {
        if (Array.isArray(b.daysList) && b.daysList.length > 0) {
          return b.daysList.includes(dayOfWeek);
        }
        if (b.daysPattern === "TTS") {
          return ["Tuesday", "Thursday", "Saturday"].includes(dayOfWeek);
        }
        if (b.daysPattern === "MWF") {
          return ["Monday", "Wednesday", "Friday"].includes(dayOfWeek);
        }
        return dayOfWeek !== "Sunday";
      });

      sessions = batchesRunningToday.map((b) => ({
        id: `${b.id}-${date}`,
        batchId: b.id,
        batchName: b.name,
        className: `${b.name} Session`,
        coachId: trainerId,
        coachName: trainer.name,
        sessionDate: date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: "SCHEDULED",
        isSubstituted: false,
        isSynthesized: true,
      }));
    }

    return { trainer, sessions };
  }

  /**
   * 5. Trainer Daily Schedule & Consecutive Session Resolution:
   * Finds all scheduled sessions for a trainer on a date, including substitute assignments,
   * groups consecutive sessions (break <= 15 min), and links existing attendance intervals.
   */
  async getTrainerDailySchedule(trainerId, date) {
    const { trainer, sessions } = await this.resolveTrainerSessionsForDate(trainerId, date);
    if (!trainer) throw new NotFoundError(`Faculty coach with ID "${trainerId}" not found.`);

    // Check if trainer is on approved leave on this date
    const leaveDoc = await TrainerLeave.findOne({
      trainerId,
      startDate: { $lte: date },
      endDate: { $gte: date },
      status: "APPROVED",
    }).lean();

    // Group into consecutive blocks (meaningful break <= 15 min)
    const blocks = groupConsecutiveSessions(sessions, 15);

    // Fetch existing intervals and logs for this trainer and date
    const [existingIntervals, existingLogs] = await Promise.all([
      TrainerInterval.find({ date, trainerId }).lean(),
      TrainerLog.find({ date, trainerId }).lean(),
    ]);

    const logMap = new Map();
    existingLogs.forEach((l) => {
      if (l.sessionId) logMap.set(l.sessionId, l);
      if (l.batchId) logMap.set(l.batchId, l);
    });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = date === todayStr;

    const enrichSession = (s, nextSession = null) => {
      const log = logMap.get(s.id) || logMap.get(s.batchId) || null;
      const sStart = parseTimeToMinutes(s.startTime);
      const sEnd = parseTimeToMinutes(s.endTime);

      const hasCheckedIn = Boolean(log?.checkInTime);
      const hasCheckedOut = Boolean(log?.checkOutTime);

      const isCheckInWindowOpen = isToday && sStart !== null && currentMinutes >= (sStart - 60) && currentMinutes <= (sStart + 60);
      const isCheckOutWindowOpen = isToday && sEnd !== null && currentMinutes <= (sEnd + 60);

      let isEligibleForAddAnotherSession = false;
      if (nextSession) {
        const nextStart = parseTimeToMinutes(nextSession.startTime);
        const breakMinutes = (sEnd !== null && nextStart !== null) ? nextStart - sEnd : 999;
        const isNextNotCancelled = nextSession.status !== "CANCELLED";
        const nextLog = logMap.get(nextSession.id) || null;
        const isNextNotCheckedIn = !nextLog?.checkInTime;

        if (
          breakMinutes <= 15 &&
          breakMinutes >= -15 &&
          isNextNotCancelled &&
          hasCheckedIn &&
          isNextNotCheckedIn
        ) {
          isEligibleForAddAnotherSession = true;
        }
      }

      return {
        ...s,
        attendanceLog: log,
        hasCheckedIn,
        hasCheckedOut,
        isCheckInWindowOpen,
        isCheckOutWindowOpen,
        isEligibleForAddAnotherSession,
        consecutiveNextSession: isEligibleForAddAnotherSession ? nextSession : null,
      };
    };

    const flatEnrichedSessions = sessions.map((s, idx) => {
      const nextSession = sessions[idx + 1] || null;
      return enrichSession(s, nextSession);
    });

    const enrichedBlocks = blocks.map((block) => {
      const interval = existingIntervals.find((inv) =>
        inv.sessionIds.some((sId) => block.sessions.some((s) => s.id === sId))
      ) || null;

      const sessionsWithAttendance = block.sessions.map((s, idx) => {
        const nextSession = block.sessions[idx + 1] || null;
        return enrichSession(s, nextSession);
      });

      return {
        ...block,
        interval,
        sessions: sessionsWithAttendance,
      };
    });

    return {
      trainerId,
      trainerName: trainer.name,
      date,
      isOnLeave: Boolean(leaveDoc),
      leaveDetails: leaveDoc || null,
      totalSessionsCount: sessions.length,
      sessions: flatEnrichedSessions,
      blocks: enrichedBlocks,
      intervals: existingIntervals,
      logs: existingLogs,
    };
  }

  /**
   * 6. Trainer Check-In (Supports individual sessions and continuous consecutive sessions):
   * When handling consecutive sessions, a single check-in initiates the continuous interval.
   */
  async trainerCheckIn(payload, user = null) {
    const {
      trainerId,
      date,
      sessionId,
      batchId,
      checkInTime,
      isAdminOverride = false,
      overrideReason = "",
    } = payload;

    if (isFutureAttendanceDate(date)) {
      throw new BadRequestError("Cannot check in for future dates.");
    }

    const { trainer, sessions } = await this.resolveTrainerSessionsForDate(trainerId, date);
    if (!trainer) throw new NotFoundError(`Faculty coach "${trainerId}" not found.`);

    // Check approved leave
    const leaveDoc = await TrainerLeave.findOne({
      trainerId,
      startDate: { $lte: date },
      endDate: { $gte: date },
      status: "APPROVED",
    }).lean();

    if (leaveDoc && !isAdminOverride) {
      throw new BadRequestError(
        `Attendance restricted: Faculty coach "${trainer.name}" is on approved leave from ${leaveDoc.startDate} to ${leaveDoc.endDate}. Admin override required.`
      );
    }

    if (sessions.length === 0 && !isAdminOverride) {
      throw new BadRequestError(`No scheduled classes found for faculty coach "${trainer.name}" on ${date}.`);
    }

    // Resolve target session and block
    let targetSession = null;
    if (sessionId) {
      targetSession = sessions.find((s) => s.id === sessionId);
      if (!targetSession && !isAdminOverride) {
        throw new BadRequestError(`Selected session "${sessionId}" is not scheduled for or assigned to faculty coach "${trainer.name}" on ${date}.`);
      }
    } else if (batchId) {
      targetSession = sessions.find((s) => s.batchId === batchId);
    }

    // Group into consecutive blocks
    const blocks = groupConsecutiveSessions(sessions, 15);
    let targetBlock = null;
    if (targetSession) {
      targetBlock = blocks.find((b) => b.sessions.some((s) => s.id === targetSession.id)) || null;
    } else if (batchId) {
      targetBlock = blocks.find((b) => b.sessions.some((s) => s.batchId === batchId)) || null;
    }
    if (!targetBlock && blocks.length > 0) {
      targetBlock = blocks[0];
      if (!targetSession && targetBlock.sessions.length > 0) {
        targetSession = targetBlock.sessions[0];
      }
    }
    if (!targetBlock && !targetSession && !isAdminOverride) {
      throw new BadRequestError("Could not resolve scheduled class session block for this check-in.");
    }

    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const effectiveCheckIn = checkInTime || nowTimeStr;
    const inM = parseTimeToMinutes(effectiveCheckIn);

    // Permitted check-in window validation (1 hour before scheduled start until 1 hour after scheduled start)
    const sessionToCheck = targetSession || (targetBlock ? targetBlock.sessions[0] : null);
    if (!isAdminOverride && sessionToCheck && inM !== null) {
      const sessionStartMin = parseTimeToMinutes(sessionToCheck.startTime);
      if (sessionStartMin !== null && !isWithinCheckInWindow(inM, sessionStartMin, 60)) {
        throw new BadRequestError(
          `Check-in restricted: Permitted window is ${formatMinutesToTime(sessionStartMin - 60)} to ${formatMinutesToTime(sessionStartMin + 60)} (Scheduled start: ${sessionToCheck.startTime}). Admin override required.`
        );
      }
    }

    // Duplicate check-in prevention for specific session
    if (targetSession) {
      const existingLog = await TrainerLog.findOne({
        date,
        trainerId,
        sessionId: targetSession.id,
      }).lean();

      if (existingLog && existingLog.checkInTime) {
        const existingInterval = await TrainerInterval.findOne({
          date,
          trainerId,
          sessionIds: targetSession.id,
        }).lean();

        return {
          interval: existingInterval || null,
          logs: [existingLog],
          log: existingLog,
          isAlreadyCheckedIn: true,
        };
      }
    }

    const monthYear = date.slice(0, 7);
    const sessionsToProcess = targetBlock && targetBlock.sessions?.length > 1
      ? targetBlock.sessions
      : (targetSession ? [targetSession] : (targetBlock ? targetBlock.sessions : (sessionId ? [{ id: sessionId, batchId }] : [])));
    const sessionIds = sessionsToProcess.map((s) => s.id);
    const batchIds = Array.from(new Set(sessionsToProcess.map((s) => s.batchId))).filter(Boolean);
    const isContinuous = sessionsToProcess.length > 1;

    // Check if an interval already exists for this block/session on this date
    let interval = await TrainerInterval.findOne({
      date,
      trainerId,
      sessionIds: { $in: sessionIds },
    });

    if (interval) {
      // Idempotent: If already checked in, return without creating duplicate
      return {
        interval: interval.toObject(),
        isAlreadyCheckedIn: true,
      };
    }

    // Initial session overlaps calculation (open check-in)
    const sessionOverlaps = sessionsToProcess.map((s) => {
      const sStartMin = parseTimeToMinutes(s.startTime);
      const sEndMin = parseTimeToMinutes(s.endTime);
      const schedDur = sStartMin !== null && sEndMin !== null ? sEndMin - sStartMin : 60;
      const isLate = inM !== null && sStartMin !== null && inM > sStartMin;
      const remarks = isLate
        ? `Checked in ${inM - sStartMin} minutes after the scheduled start time.`
        : "Checked in on schedule.";

      return {
        sessionId: s.id,
        batchId: s.batchId,
        batchName: s.batchName || "",
        className: s.className || `Class #${s.classNumber || 1}`,
        startTime: s.startTime,
        endTime: s.endTime,
        scheduledDurationMinutes: schedDur,
        overlapMinutes: 0, // Calculated on check-out
        status: "PRESENT",
        remarks,
        isSubstituted: Boolean(s.isSubstituted && s.substituteCoachId === trainerId),
        substituteTrainerId: s.isSubstituted ? s.substituteCoachId : null,
      };
    });

    const intervalId = generateTrainerIntervalId();
    interval = await TrainerInterval.create({
      id: intervalId,
      date,
      monthYear,
      trainerId,
      trainerName: trainer.name,
      checkInTime: effectiveCheckIn,
      checkOutTime: "",
      actualDurationMinutes: 0,
      totalTeachingDurationMinutes: 0,
      status: ATTENDANCE_STATUS.PRESENT,
      isContinuous,
      sessionIds,
      batchIds,
      sessionOverlaps,
      isException: false,
      exceptionType: ATTENDANCE_EXCEPTION_TYPE.NONE,
      remarks: isContinuous
        ? `Continuous attendance started for ${sessionsToProcess.length} consecutive sessions (${targetBlock.blockStartTime} - ${targetBlock.blockEndTime}).`
        : `Check-in recorded for session ${sessionToCheck?.className || sessionToCheck?.batchName || sessionToCheck?.id || "class"}.`,
      markedBy: user?.name || user?.username || (isAdminOverride ? "Admin" : "Coach"),
    });

    // Create or update TrainerLog records for each session in this check-in
    const createdLogs = [];
    for (const s of sessionsToProcess) {
      const sStartMin = parseTimeToMinutes(s.startTime);
      const sEndMin = parseTimeToMinutes(s.endTime);
      const schedDur = sStartMin !== null && sEndMin !== null ? sEndMin - sStartMin : 60;
      const isLate = inM !== null && sStartMin !== null && inM > sStartMin;
      const remarks = isLate
        ? `Checked in ${inM - sStartMin} minutes after the scheduled start time.`
        : "Checked in on schedule.";

      const logId = generateTrainerLogId();
      const log = await TrainerLog.findOneAndUpdate(
        { date, trainerId, sessionId: s.id },
        {
          $set: {
            id: logId,
            date,
            monthYear,
            trainerId,
            trainerName: trainer.name,
            batchId: s.batchId,
            batchName: s.batchName || "",
            sessionId: s.id,
            intervalId,
            isContinuous,
            status: TRAINER_LOG_STATUS.PRESENT,
            substituteTrainerId: s.isSubstituted ? s.substituteCoachId : null,
            originalTrainerId: s.isSubstituted ? s.originalCoachId || s.coachId : "",
            checkInTime: effectiveCheckIn,
            checkOutTime: "",
            scheduledStartTime: s.startTime,
            scheduledEndTime: s.endTime,
            scheduledDurationMinutes: schedDur,
            actualPresenceMinutes: 0,
            durationMinutes: 0,
            isException: isLate,
            exceptionType: isLate ? ATTENDANCE_EXCEPTION_TYPE.LATE : ATTENDANCE_EXCEPTION_TYPE.NONE,
            remarks,
            markedBy: user?.name || user?.username || (isAdminOverride ? "Admin" : "Coach"),
          },
        },
        { returnDocument: "after", upsert: true, runValidators: true, lean: true }
      );
      createdLogs.push(log);
    }

    if (isAdminOverride) {
      await AttendanceAudit.create({
        id: generateAttendanceAuditId(),
        attendanceType: "TRAINER",
        recordId: intervalId,
        date,
        trainerId,
        sessionId: targetSession?.id || (sessionIds.length === 1 ? sessionIds[0] : null),
        batchId: targetSession?.batchId || (batchIds.length === 1 ? batchIds[0] : null),
        intervalId,
        action: "ADMIN_OVERRIDE",
        previousValues: {},
        updatedValues: {
          checkInTime: effectiveCheckIn,
          status: "PRESENT",
          intervalId,
          sessionId: targetSession?.id || null,
        },
        reason: overrideReason || "Admin check-in override",
        performedBy: user?.name || user?.username || "Admin",
      }).catch((e) => console.error("Audit log error:", e));
    }

    return {
      interval: interval.toObject(),
      logs: createdLogs,
      log: createdLogs[0] || null,
    };
  }

  /**
   * 7. Trainer Check-Out:
   * Completes the continuous attendance interval, calculates actual presence duration
   * and scheduled session overlap separately for every class, excluding off-schedule time.
   */
  async trainerCheckOut(payload, user = null) {
    const {
      trainerId,
      date,
      intervalId,
      sessionId,
      batchId,
      checkOutTime,
      isAdminOverride = false,
      overrideReason = "",
    } = payload;

    const { trainer, sessions } = await this.resolveTrainerSessionsForDate(trainerId, date);
    if (!trainer) throw new NotFoundError(`Faculty coach "${trainerId}" not found.`);

    let targetSession = null;
    if (sessionId) {
      targetSession = sessions.find((s) => s.id === sessionId);
    } else if (batchId) {
      targetSession = sessions.find((s) => s.batchId === batchId);
    }

    // Find active log or interval
    const logFilter = { date, trainerId };
    if (targetSession) {
      logFilter.sessionId = targetSession.id;
    } else if (sessionId) {
      logFilter.sessionId = sessionId;
    } else if (batchId) {
      logFilter.batchId = batchId;
    }

    let existingSessionLog = await TrainerLog.findOne(logFilter).lean();
    if (!existingSessionLog && !sessionId) {
      existingSessionLog = await TrainerLog.findOne({ date, trainerId, checkOutTime: "" }).sort({ createdAt: -1 }).lean();
    }

    // Find active interval
    const filter = { date, trainerId };
    if (intervalId) {
      filter.id = intervalId;
    } else if (targetSession) {
      filter.sessionIds = targetSession.id;
    } else if (sessionId) {
      filter.sessionIds = sessionId;
    }

    let interval = await TrainerInterval.findOne(filter);
    if (!interval) {
      // Check if there is an open interval without checkout
      interval = await TrainerInterval.findOne({ date, trainerId, checkOutTime: "" }).sort({ createdAt: -1 });
    }

    const checkInTime = existingSessionLog?.checkInTime || interval?.checkInTime;
    if (!checkInTime) {
      throw new BadRequestError("Check Out action is only available after a successful check-in.");
    }

    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const effectiveCheckOut = checkOutTime || nowTimeStr;

    const inMin = parseTimeToMinutes(checkInTime);
    const outMin = parseTimeToMinutes(effectiveCheckOut);

    if (inMin === null || outMin === null) {
      throw new BadRequestError("Invalid check-in or check-out time format.");
    }

    if (outMin < inMin) {
      throw new BadRequestError("Check-out time cannot be earlier than check-in time.");
    }

    // Check-out window validation: Allow check-out until one hour after the scheduled end time
    if (!isAdminOverride && targetSession && outMin !== null) {
      const schedEndMin = parseTimeToMinutes(targetSession.endTime);
      if (schedEndMin !== null && outMin > schedEndMin + 60) {
        throw new BadRequestError(
          `Check-out restricted: Permitted check-out window is until ${formatMinutesToTime(schedEndMin + 60)} (1 hour after scheduled end: ${targetSession.endTime}). Admin override required.`
        );
      }
    }

    const actualDurationMinutes = Math.max(0, outMin - inMin);

    // Fetch the sessions linked to this interval or session
    let sessionsToProcess = [];
    if (interval?.sessionIds?.length > 1) {
      const dbSessions = await Session.find({ id: { $in: interval.sessionIds } }).sort({ startTime: 1 }).lean();
      if (dbSessions.length > 0) {
        sessionsToProcess = dbSessions;
      } else {
        sessionsToProcess = sessions.filter((s) => interval.sessionIds.includes(s.id));
      }
    } else if (targetSession) {
      sessionsToProcess = [targetSession];
    } else if (interval?.sessionIds?.length) {
      const dbSessions = await Session.find({ id: { $in: interval.sessionIds } }).sort({ startTime: 1 }).lean();
      if (dbSessions.length > 0) {
        sessionsToProcess = dbSessions;
      } else {
        sessionsToProcess = sessions.filter((s) => interval.sessionIds.includes(s.id));
      }
    }
    if (sessionsToProcess.length === 0 && sessions.length > 0) {
      sessionsToProcess = [sessions[0]];
    }

    // Calculate overlap separately for every class
    let totalTeachingDurationMinutes = 0;
    const updatedSessionOverlaps = [];
    const updatedLogs = [];

    for (const s of sessionsToProcess) {
      const schedStartMin = parseTimeToMinutes(s.startTime);
      const schedEndMin = parseTimeToMinutes(s.endTime);
      const schedDuration = schedStartMin !== null && schedEndMin !== null ? schedEndMin - schedStartMin : 60;

      // Overlap with scheduled period (excludes time before start and after end)
      const overlapMinutes = calculateSessionOverlap(inMin, outMin, schedStartMin, schedEndMin);
      totalTeachingDurationMinutes += overlapMinutes;

      // Generate accurate remarks
      const remarks = generateRemarks(inMin, outMin, schedStartMin, schedEndMin, false);
      const isLate = inMin > schedStartMin;
      const isEarly = outMin < schedEndMin;
      const isException = isLate || isEarly;
      const exceptionType = isLate && isEarly
        ? ATTENDANCE_EXCEPTION_TYPE.LATE
        : isLate
        ? ATTENDANCE_EXCEPTION_TYPE.LATE
        : isEarly
        ? ATTENDANCE_EXCEPTION_TYPE.EARLY_DEPARTURE
        : ATTENDANCE_EXCEPTION_TYPE.NONE;

      const sessionStatus = overlapMinutes > 0 ? TRAINER_LOG_STATUS.CONDUCTED : TRAINER_LOG_STATUS.ABSENT;

      updatedSessionOverlaps.push({
        sessionId: s.id,
        batchId: s.batchId,
        batchName: s.batchName || "",
        className: s.className || `Class #${s.classNumber || 1}`,
        startTime: s.startTime,
        endTime: s.endTime,
        scheduledDurationMinutes: schedDuration,
        overlapMinutes,
        status: sessionStatus,
        remarks,
        isSubstituted: Boolean(s.isSubstituted && s.substituteCoachId === trainerId),
        substituteTrainerId: s.isSubstituted ? s.substituteCoachId : null,
      });

      const checkoutBy = isAdminOverride ? "ADMIN" : "TRAINER";
      const exceptionFlags = {
        isLate,
        isEarlyDeparture: isEarly,
        missingCheckout: false,
        autoCheckout: false,
        requiresReview: Boolean(isLate || isEarly || isAdminOverride),
      };

      // Update TrainerLog for this session
      const log = await TrainerLog.findOneAndUpdate(
        { date, trainerId, sessionId: s.id },
        {
          $set: {
            checkOutTime: effectiveCheckOut,
            durationMinutes: overlapMinutes, // teaching duration for this class!
            actualPresenceMinutes: actualDurationMinutes,
            status: sessionStatus,
            checkoutBy,
            isException,
            exceptionType,
            exceptionFlags,
            remarks,
          },
        },
        { returnDocument: "after", runValidators: true, lean: true }
      );
      if (log) updatedLogs.push(log);
    }

    if (interval) {
      interval.checkOutTime = effectiveCheckOut;
      interval.actualDurationMinutes = actualDurationMinutes;
      interval.totalTeachingDurationMinutes = totalTeachingDurationMinutes;
      interval.sessionOverlaps = updatedSessionOverlaps;
      interval.status = ATTENDANCE_STATUS.PRESENT;
      interval.checkoutBy = isAdminOverride ? "ADMIN" : "TRAINER";
      interval.isException = updatedSessionOverlaps.some((o) => o.remarks && !o.remarks.includes("Attended on schedule"));
      interval.exceptionType = interval.isException ? ATTENDANCE_EXCEPTION_TYPE.LATE : ATTENDANCE_EXCEPTION_TYPE.NONE;
      interval.remarks = interval.isContinuous
        ? `Continuous shift complete: ${actualDurationMinutes}m presence, ${totalTeachingDurationMinutes}m teaching duration across ${sessionsToProcess.length} sessions.`
        : `Session complete: ${actualDurationMinutes}m presence, ${totalTeachingDurationMinutes}m teaching duration.`;

      await interval.save();
    }

    if (isAdminOverride) {
      await AttendanceAudit.create({
        id: generateAttendanceAuditId(),
        attendanceType: "TRAINER",
        recordId: interval?.id || (updatedLogs[0]?.id),
        date,
        trainerId,
        sessionId: targetSession?.id || (sessionsToProcess.length === 1 ? sessionsToProcess[0].id : null),
        batchId: targetSession?.batchId || (sessionsToProcess.length === 1 ? sessionsToProcess[0].batchId : null),
        intervalId: interval?.id,
        action: "ADMIN_OVERRIDE",
        previousValues: { checkInTime, checkOutTime: existingSessionLog?.checkOutTime || "" },
        updatedValues: {
          checkOutTime: effectiveCheckOut,
          actualDurationMinutes,
          totalTeachingDurationMinutes,
        },
        reason: overrideReason || "Admin check-out override",
        performedBy: user?.name || user?.username || "Admin",
      }).catch((e) => console.error("Audit log error:", e));
    }

    return {
      interval: interval ? interval.toObject() : null,
      logs: updatedLogs,
      log: updatedLogs[0] || null,
    };
  }

  /**
   * 8. Records or updates a trainer log (Backward compatibility + manual log modal).
   */
  async recordTrainerLog(data, user = null) {
    const monthYear = data.date.slice(0, 7);
    const id = data.id || generateTrainerLogId();

    const existing = await TrainerLog.findOne({
      date: data.date,
      trainerId: data.trainerId,
      batchId: data.batchId,
    }).lean();

    const nowTimeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let effectiveCheckIn = data.checkInTime !== undefined ? (data.checkInTime || "") : (existing?.checkInTime || "");
    let effectiveCheckOut = data.checkOutTime !== undefined ? (data.checkOutTime || "") : (existing?.checkOutTime || "");
    let effectiveStatus = data.status || existing?.status || "PRESENT";

    if (data.checkOutTime && !effectiveCheckIn && !existing?.checkInTime) {
      throw new BadRequestError("Check Out action is only available after a successful check-in.");
    }

    if (data.status === "PRESENT" || (!data.status && effectiveCheckIn)) {
      effectiveStatus = "PRESENT";
      if (!effectiveCheckIn) effectiveCheckIn = nowTimeStr;
    } else if (data.checkOutTime) {
      if (effectiveStatus !== "CONDUCTED" && effectiveStatus !== "SUBSTITUTE") {
        effectiveStatus = "PRESENT";
      }
      if (!effectiveCheckIn) effectiveCheckIn = existing?.checkInTime || nowTimeStr;
      if (!effectiveCheckOut) effectiveCheckOut = nowTimeStr;
    } else if (data.status === "ABSENT") {
      effectiveStatus = "ABSENT";
      effectiveCheckIn = "";
      effectiveCheckOut = "";
    }

    let durationMinutes = data.durationMinutes !== undefined ? Number(data.durationMinutes) : (existing?.durationMinutes || 60);
    let actualPresenceMinutes = durationMinutes;

    if (effectiveCheckIn && effectiveCheckOut) {
      const inM = parseTimeToMinutes(effectiveCheckIn);
      const outM = parseTimeToMinutes(effectiveCheckOut);
      if (inM !== null && outM !== null) {
        if (outM < inM) {
          throw new BadRequestError("Check-out time cannot be earlier than check-in time.");
        }
        actualPresenceMinutes = Math.max(1, outM - inM);
        if (data.durationMinutes === undefined || !data.durationMinutes) {
          durationMinutes = actualPresenceMinutes;
        }
      }
    }

    let effectiveNotes = data.notes !== undefined ? (data.notes || "") : (existing?.notes || "");
    let effectiveSubId = data.substituteTrainerId || existing?.substituteTrainerId || null;

    if (data.sessionId) {
      const sessionDoc = await Session.findOne({ id: data.sessionId }).lean();
      if (sessionDoc?.isSubstituted && sessionDoc?.substituteCoachId === data.trainerId) {
        effectiveSubId = data.trainerId;
        if (effectiveStatus === "CONDUCTED" || effectiveStatus === "PRESENT") {
          effectiveStatus = "SUBSTITUTE";
        }
        if (!effectiveNotes) {
          effectiveNotes = `Substitute coaching session for ${sessionDoc.originalCoachName || sessionDoc.coachName || "Primary Coach"} (${sessionDoc.substitutionReason || "Substitution"})`;
        }
      }
    }

    // Admin override audit logging
    if (data.isAdminOverride) {
      if (!data.overrideReason || !data.overrideReason.trim()) {
        throw new BadRequestError("Override reason is mandatory for administrative corrections.");
      }
      await AttendanceAudit.create({
        id: generateAttendanceAuditId(),
        attendanceType: "TRAINER",
        recordId: id,
        date: data.date,
        trainerId: data.trainerId,
        batchId: data.batchId,
        sessionId: data.sessionId || "",
        action: existing ? "ADMIN_OVERRIDE" : "CORRECTION",
        previousValues: existing || {},
        updatedValues: {
          checkInTime: effectiveCheckIn,
          checkOutTime: effectiveCheckOut,
          status: effectiveStatus,
          durationMinutes,
        },
        reason: data.overrideReason.trim(),
        performedBy: user?.name || user?.username || "Admin",
      }).catch((e) => console.error("Audit log error:", e));
    }

    return TrainerLog.findOneAndUpdate(
      { date: data.date, trainerId: data.trainerId, batchId: data.batchId },
      {
        $set: {
          id,
          date: data.date,
          monthYear,
          trainerId: data.trainerId,
          trainerName: data.trainerName || data.trainerId,
          batchId: data.batchId,
          sessionId: data.sessionId || "",
          status: effectiveStatus,
          substituteTrainerId: effectiveSubId,
          checkInTime: effectiveCheckIn,
          checkOutTime: effectiveCheckOut,
          durationMinutes,
          actualPresenceMinutes,
          attendeesCount: data.attendeesCount !== undefined ? Number(data.attendeesCount) : (existing?.attendeesCount || 0),
          notes: effectiveNotes,
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true, lean: true }
    );
  }

  /**
   * 9. Admin Attendance Override for Member:
   * Mandatory reason, status & duration update, and audit log generation.
   */
  async adminOverrideMemberAttendance(payload, user = null) {
    const { date, memberId, batchId, checkInTime, checkOutTime, status, reason, notes } = payload;
    if (!reason || !reason.trim()) {
      throw new BadRequestError("Override reason is mandatory for administrative corrections.");
    }

    return this.markAttendance(
      {
        date,
        memberId,
        batchId,
        checkInTime,
        checkOutTime,
        status: status || ATTENDANCE_STATUS.PRESENT,
        notes,
        isAdminOverride: true,
        overrideReason: reason.trim(),
        markedBy: user?.name || user?.username || "Admin",
      },
      user
    );
  }

  /**
   * 10. Admin Attendance Override for Trainer:
   * Mandatory reason, recalculates actual duration and session overlap, and audit log generation.
   */
  async adminOverrideTrainerAttendance(payload, user = null) {
    const {
      date,
      trainerId,
      batchId,
      sessionId,
      intervalId,
      checkInTime,
      checkOutTime,
      status,
      reason,
      notes,
    } = payload;

    if (!reason || !reason.trim()) {
      throw new BadRequestError("Override reason is mandatory for administrative corrections.");
    }

    const { trainer, sessions } = await this.resolveTrainerSessionsForDate(trainerId, date);
    if (!trainer) throw new NotFoundError(`Faculty coach "${trainerId}" not found.`);

    let targetSession = null;
    if (sessionId) {
      targetSession = sessions.find((s) => s.id === sessionId);
    } else if (batchId) {
      targetSession = sessions.find((s) => s.batchId === batchId);
    }
    if (!targetSession && sessions.length > 0) {
      targetSession = sessions[0];
    }

    // If both check-in and check-out are provided
    if (checkInTime && checkOutTime && targetSession) {
      const inMin = parseTimeToMinutes(checkInTime);
      const outMin = parseTimeToMinutes(checkOutTime);
      if (inMin === null || outMin === null) {
        throw new BadRequestError("Invalid check-in or check-out time format.");
      }
      if (outMin < inMin) {
        throw new BadRequestError("Check-out time cannot be earlier than check-in time.");
      }

      const schedStartMin = parseTimeToMinutes(targetSession.startTime);
      const schedEndMin = parseTimeToMinutes(targetSession.endTime);
      const schedDuration = (schedStartMin !== null && schedEndMin !== null) ? schedEndMin - schedStartMin : 60;
      const actualPresenceMinutes = outMin - inMin;
      const actualDurationMinutes = actualPresenceMinutes;
      const overlapMinutes = calculateSessionOverlap(inMin, outMin, schedStartMin, schedEndMin);

      const isLate = inMin > schedStartMin;
      const isEarly = outMin < schedEndMin;
      const baseRemarks = generateRemarks(inMin, outMin, schedStartMin, schedEndMin, false);
      const remarks = `${baseRemarks} (Admin correction: ${reason.trim()})`;

      const existingLog = await TrainerLog.findOne({
        date,
        trainerId,
        sessionId: targetSession.id,
      }).lean();

      const logId = existingLog?.id || generateTrainerLogId();
      const sessionStatus = status || (overlapMinutes > 0 ? TRAINER_LOG_STATUS.CONDUCTED : TRAINER_LOG_STATUS.PRESENT);

      const log = await TrainerLog.findOneAndUpdate(
        { date, trainerId, sessionId: targetSession.id },
        {
          $set: {
            id: logId,
            date,
            monthYear: date.slice(0, 7),
            trainerId,
            trainerName: trainer.name,
            batchId: targetSession.batchId,
            batchName: targetSession.batchName || "",
            sessionId: targetSession.id,
            status: sessionStatus,
            checkInTime,
            checkOutTime,
            scheduledStartTime: targetSession.startTime,
            scheduledEndTime: targetSession.endTime,
            scheduledDurationMinutes: schedDuration,
            actualPresenceMinutes,
            durationMinutes: overlapMinutes,
            checkoutBy: "ADMIN",
            isException: isLate || isEarly,
            exceptionType: ATTENDANCE_EXCEPTION_TYPE.OVERRIDE,
            exceptionFlags: {
              isLate,
              isEarlyDeparture: isEarly,
              missingCheckout: false,
              autoCheckout: false,
              requiresReview: true,
            },
            notes: notes || reason.trim(),
            remarks,
            markedBy: user?.name || user?.username || "Admin",
          },
        },
        { returnDocument: "after", upsert: true, runValidators: true, lean: true }
      );

      // Upsert TrainerInterval so intervals query stays accurate
      let interval = await TrainerInterval.findOne({
        date,
        trainerId,
        sessionIds: targetSession.id,
      });

      if (!interval) {
        interval = await TrainerInterval.create({
          id: generateTrainerIntervalId(),
          date,
          monthYear: date.slice(0, 7),
          trainerId,
          trainerName: trainer.name,
          checkInTime,
          checkOutTime,
          actualDurationMinutes,
          totalTeachingDurationMinutes: overlapMinutes,
          status: ATTENDANCE_STATUS.PRESENT,
          isContinuous: false,
          sessionIds: [targetSession.id],
          batchIds: [targetSession.batchId],
          sessionOverlaps: [
            {
              sessionId: targetSession.id,
              batchId: targetSession.batchId,
              batchName: targetSession.batchName || "",
              className: targetSession.className || `Class #${targetSession.classNumber || 1}`,
              startTime: targetSession.startTime,
              endTime: targetSession.endTime,
              scheduledDurationMinutes: schedDuration,
              overlapMinutes,
              status: sessionStatus,
              remarks,
              isSubstituted: Boolean(targetSession.isSubstituted && targetSession.substituteCoachId === trainerId),
              substituteTrainerId: targetSession.isSubstituted ? targetSession.substituteCoachId : null,
            },
          ],
          isException: isLate || isEarly,
          exceptionType: ATTENDANCE_EXCEPTION_TYPE.OVERRIDE,
          remarks: `Admin corrected session attendance: ${actualPresenceMinutes}m presence, ${overlapMinutes}m teaching duration.`,
          checkoutBy: "ADMIN",
          markedBy: user?.name || user?.username || "Admin",
        });
      } else {
        interval.checkInTime = checkInTime;
        interval.checkOutTime = checkOutTime;
        interval.actualDurationMinutes = actualDurationMinutes;
        interval.totalTeachingDurationMinutes = overlapMinutes;
        interval.checkoutBy = "ADMIN";
        interval.remarks = `Admin corrected session attendance: ${actualPresenceMinutes}m presence, ${overlapMinutes}m teaching duration.`;
        await interval.save();
      }

      // Record Audit Log with original values, updated values, Admin details, and timestamp
      await AttendanceAudit.create({
        id: generateAttendanceAuditId(),
        attendanceType: "TRAINER",
        recordId: log.id,
        date,
        trainerId,
        sessionId: targetSession.id,
        batchId: targetSession.batchId,
        intervalId: interval?.id,
        action: "ADMIN_OVERRIDE",
        previousValues: existingLog
          ? {
              checkInTime: existingLog.checkInTime || "",
              checkOutTime: existingLog.checkOutTime || "",
              status: existingLog.status || "",
              durationMinutes: existingLog.durationMinutes || 0,
              actualPresenceMinutes: existingLog.actualPresenceMinutes || 0,
            }
          : {},
        updatedValues: {
          checkInTime,
          checkOutTime,
          status: sessionStatus,
          durationMinutes: overlapMinutes,
          actualPresenceMinutes,
        },
        reason: reason.trim(),
        performedBy: user?.name || user?.username || "Admin",
      }).catch((e) => console.error("Audit log error:", e));

      return {
        log,
        logs: [log],
        interval: interval ? (interval.toObject ? interval.toObject() : interval) : null,
      };
    }

    // If only check-out is provided, invoke full checkout recalculation
    if (checkOutTime) {
      return this.trainerCheckOut(
        {
          trainerId,
          date,
          intervalId,
          sessionId: targetSession?.id || sessionId,
          batchId: targetSession?.batchId || batchId,
          checkOutTime,
          isAdminOverride: true,
          overrideReason: reason.trim(),
        },
        user
      );
    }

    // Otherwise, perform check-in override
    return this.trainerCheckIn(
      {
        trainerId,
        date,
        sessionId: targetSession?.id || sessionId,
        batchId: targetSession?.batchId || batchId,
        checkInTime,
        isAdminOverride: true,
        overrideReason: reason.trim(),
      },
      user
    );
  }

  /**
   * 11. Retrieves audit logs for attendance changes and administrative corrections.
   */
  async getAttendanceAuditLogs(query = {}) {
    const filter = {};
    if (query.attendanceType) filter.attendanceType = query.attendanceType;
    if (query.date) filter.date = query.date;
    if (query.recordId) filter.recordId = query.recordId;
    if (query.memberId) filter.memberId = query.memberId;
    if (query.trainerId) filter.trainerId = query.trainerId;

    const limit = Math.min(Number(query.limit) || 100, 500);
    return AttendanceAudit.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  }

  /**
   * 12. Retrieves trainer logs for an individual trainer or all trainers.
   */
  async getTrainerLogs(trainerId, yearMonth, date) {
    const filter = {};
    if (trainerId && trainerId !== "all") {
      filter.trainerId = trainerId;
    }
    if (date) {
      filter.date = date;
    } else if (yearMonth) {
      filter.monthYear = yearMonth;
    }
    return TrainerLog.find(filter).sort({ date: -1, checkInTime: -1 }).lean();
  }

  /**
   * 13. Retrieves trainer intervals for continuous and single-session tracking.
   */
  async getTrainerIntervals(trainerId, yearMonth, date) {
    const filter = {};
    if (trainerId && trainerId !== "all") {
      filter.trainerId = trainerId;
    }
    if (date) {
      filter.date = date;
    } else if (yearMonth) {
      filter.monthYear = yearMonth;
    }
    return TrainerInterval.find(filter).sort({ date: -1, checkInTime: -1 }).lean();
  }

  /**
   * 14. Retrieves attendance records matching query filters.
   * Lazily triggers automatic checkout processing for expired sessions before returning.
   */
  async getAttendanceRecords(query = {}) {
    // Lazily evaluate any pending member auto-checkouts
    await this.processMemberAutoCheckouts(query.date || null, query.batchId || null).catch(() => null);

    const filter = {};
    if (query.date) filter.date = query.date;
    if (query.batchId && query.batchId !== "all") filter.batchId = query.batchId;
    if (query.month) filter.monthYear = query.month;
    if (query.memberId) filter.memberId = query.memberId;
    return Attendance.find(filter).sort({ date: -1, checkInTime: -1 }).lean();
  }

  /**
   * 15. Processes automatic member check-out:
   * If a member forgets to check out, automatically checks them out at the scheduled class
   * end time plus one hour. Marks checkout timestamp as system-generated and generates
   * an audit log entry.
   *
   * Idempotent and safe to retry without creating duplicate records or double counts.
   */
  async processMemberAutoCheckouts(date = null, batchId = null) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const targetDate = date || todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const query = {
      date: { $lte: targetDate },
      checkInTime: { $ne: "" },
      $or: [{ checkOutTime: "" }, { checkOutTime: null }, { checkOutTime: { $exists: false } }],
      status: { $in: [ATTENDANCE_STATUS.PRESENT, "PRESENT", "CHECKED_IN"] },
      isSystemGenerated: { $ne: true },
    };
    if (batchId && batchId !== "all") query.batchId = batchId;

    const pendingRecords = await Attendance.find(query).lean();
    if (pendingRecords.length === 0) {
      return { count: 0, records: [] };
    }

    const batchIds = Array.from(new Set(pendingRecords.map((r) => r.batchId)));
    const batches = await Batch.find({ id: { $in: batchIds } }).lean();
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    const autoCheckedOutRecords = [];

    for (const record of pendingRecords) {
      const batch = batchMap.get(record.batchId);
      if (!batch || !batch.endTime) continue;

      const endMinutes = parseTimeToMinutes(batch.endTime);
      if (endMinutes === null) continue;

      // Class end time + 1 hour window
      const autoCheckoutBoundaryMinutes = endMinutes + 60;
      const isPastDate = record.date < todayStr;
      const isWindowExpired = (record.date === todayStr && currentMinutes >= autoCheckoutBoundaryMinutes);

      if (isPastDate || isWindowExpired) {
        const autoCheckOutTime = formatMinutesToTime(autoCheckoutBoundaryMinutes);
        const inMinutes = parseTimeToMinutes(record.checkInTime);
        const durationMinutes = inMinutes !== null ? Math.max(0, autoCheckoutBoundaryMinutes - inMinutes) : 60;
        const startMinutes = parseTimeToMinutes(batch.startTime);

        const updated = await Attendance.findOneAndUpdate(
          { id: record.id, $or: [{ checkOutTime: "" }, { checkOutTime: null }] },
          {
            $set: {
              checkOutTime: autoCheckOutTime,
              durationMinutes,
              checkoutBy: "SYSTEM",
              isSystemGenerated: true,
              status: ATTENDANCE_STATUS.PRESENT,
              isException: false,
              exceptionType: ATTENDANCE_EXCEPTION_TYPE.NONE,
              exceptionFlags: {
                isLate: inMinutes !== null && startMinutes !== null && inMinutes > startMinutes,
                isEarlyDeparture: false,
                missingCheckout: false,
                autoCheckout: true,
                requiresReview: false,
              },
              remarks: "Automatically checked out at scheduled class end time + 1 hour (system-generated).",
            },
          },
          { returnDocument: "after", lean: true }
        );

        if (updated) {
          // Record audit log
          await AttendanceAudit.create({
            id: generateAttendanceAuditId(),
            attendanceType: "MEMBER",
            recordId: record.id,
            date: record.date,
            memberId: record.memberId,
            batchId: record.batchId,
            sessionId: record.sessionId || "",
            action: "AUTO_CHECKOUT",
            previousValues: {
              checkInTime: record.checkInTime,
              checkOutTime: "",
              isSystemGenerated: false,
            },
            updatedValues: {
              checkOutTime: autoCheckOutTime,
              durationMinutes,
              checkoutBy: "SYSTEM",
              isSystemGenerated: true,
              remarks: "Automatically checked out at scheduled class end time + 1 hour (system-generated).",
            },
            reason: "Automatic system checkout at scheduled class end time + 1 hour",
            performedBy: "SYSTEM",
          }).catch((e) => console.error("Auto checkout audit log error:", e));

          autoCheckedOutRecords.push(updated);
        }
      }
    }

    return { count: autoCheckedOutRecords.length, records: autoCheckedOutRecords };
  }

  /**
   * 16. Consecutive Trainer Session Transition ("Add Another Session"):
   * Closes attendance for current session, completes current interval/duration,
   * starts a new interval for the next eligible consecutive session, and links to next class.
   *
   * Validates:
   * - Next session belongs to same trainer (or assigned substitute)
   * - Next session is scheduled consecutively (break <= 15 min)
   * - Next session is not cancelled
   * - Prevents duplicate session transitions and overlapping attendance intervals
   */
  async trainerAddAnotherSession(payload, user = null) {
    const {
      trainerId,
      date,
      currentSessionId,
      nextSessionId,
      transitionTime,
      isAdminOverride = false,
      overrideReason = "",
    } = payload;

    const trainer = await Trainer.findOne({ id: trainerId }).lean();
    if (!trainer) throw new NotFoundError(`Faculty coach "${trainerId}" not found.`);

    // 1. Fetch current and next session
    const [currentSession, nextSession] = await Promise.all([
      Session.findOne({ id: currentSessionId }).lean(),
      Session.findOne({ id: nextSessionId }).lean(),
    ]);

    if (!currentSession) throw new NotFoundError(`Current session "${currentSessionId}" not found.`);
    if (!nextSession) throw new NotFoundError(`Next session "${nextSessionId}" not found.`);

    // 2. Validate session date
    if (nextSession.sessionDate !== date) {
      throw new BadRequestError(`Next session date (${nextSession.sessionDate}) does not match current date (${date}).`);
    }

    // 3. Validate next session is not cancelled
    if (nextSession.status === "CANCELLED" && !isAdminOverride) {
      throw new BadRequestError("Cannot transition to a cancelled session.");
    }

    // 4. Validate next session belongs to same trainer (or trainer is assigned substitute)
    const isNextAssigned =
      (!nextSession.isSubstituted && nextSession.coachId === trainerId) ||
      (nextSession.isSubstituted && nextSession.substituteCoachId === trainerId);

    if (!isNextAssigned && !isAdminOverride) {
      throw new BadRequestError(
        `Next session "${nextSession.id}" is assigned to another coach (${nextSession.coachName || "Coach"}). Cannot transition.`
      );
    }

    // 5. Validate consecutive schedule without a meaningful break (threshold: <= 15 minutes)
    const currentEndMin = parseTimeToMinutes(currentSession.endTime);
    const nextStartMin = parseTimeToMinutes(nextSession.startTime);
    if (currentEndMin === null || nextStartMin === null) {
      throw new BadRequestError("Invalid session timing format.");
    }

    const breakMinutes = nextStartMin - currentEndMin;
    if (!isAdminOverride && (breakMinutes > 15 || breakMinutes < -15)) {
      throw new BadRequestError(
        `Sessions are not consecutive: Break between sessions is ${breakMinutes} minutes (exceeds 15 min threshold). A separate check-in is required for the later session.`
      );
    }

    // 6. Transition timestamp
    const now = new Date();
    const nowTimeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const effectiveTransitionTime = transitionTime || currentSession.endTime || nowTimeStr;
    const transMin = parseTimeToMinutes(effectiveTransitionTime);

    // 7. Find existing log for current session
    let currentLog = await TrainerLog.findOne({ date, trainerId, sessionId: currentSessionId });
    let currentCheckIn = currentLog?.checkInTime;
    if (!currentCheckIn) {
      const openInterval = await TrainerInterval.findOne({
        date,
        trainerId,
        sessionIds: currentSessionId,
      }).lean();
      currentCheckIn = openInterval?.checkInTime || currentSession.startTime;
    }

    const curInMin = parseTimeToMinutes(currentCheckIn);
    if (curInMin !== null && transMin !== null && transMin < curInMin) {
      throw new BadRequestError("Transition time cannot be earlier than current session check-in time.");
    }

    // Calculate current session duration and overlap
    const curSchedStart = parseTimeToMinutes(currentSession.startTime);
    const curSchedEnd = parseTimeToMinutes(currentSession.endTime);
    const curSchedDuration = (curSchedStart !== null && curSchedEnd !== null) ? curSchedEnd - curSchedStart : 60;
    const currentPresence = (curInMin !== null && transMin !== null) ? Math.max(0, transMin - curInMin) : curSchedDuration;
    const currentTeaching = calculateSessionOverlap(curInMin, transMin, curSchedStart, curSchedEnd);

    // Complete current session log
    const curRemarks = generateRemarks(curInMin, transMin, curSchedStart, curSchedEnd, false);
    const updatedCurrentLog = await TrainerLog.findOneAndUpdate(
      { date, trainerId, sessionId: currentSessionId },
      {
        $set: {
          checkOutTime: effectiveTransitionTime,
          actualPresenceMinutes: currentPresence,
          durationMinutes: currentTeaching,
          status: currentTeaching > 0 ? TRAINER_LOG_STATUS.CONDUCTED : TRAINER_LOG_STATUS.PRESENT,
          transitionedToSessionId: nextSessionId,
          checkoutBy: user?.role === "admin" ? "ADMIN" : "TRAINER",
          remarks: `${curRemarks} (Transitioned to consecutive session #${nextSession.classNumber || nextSession.id}).`,
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true, lean: true }
    );

    // Close any active interval covering current session
    await TrainerInterval.findOneAndUpdate(
      { date, trainerId, sessionIds: currentSessionId, checkOutTime: "" },
      {
        $set: {
          checkOutTime: effectiveTransitionTime,
          actualDurationMinutes: currentPresence,
          totalTeachingDurationMinutes: currentTeaching,
          consecutiveSessionId: nextSessionId,
          checkoutBy: user?.role === "admin" ? "ADMIN" : "TRAINER",
          remarks: `Session completed at ${effectiveTransitionTime}. Transitioned to consecutive session.`,
        },
      }
    );

    // 8. Start NEW attendance interval and log for next eligible consecutive session
    const nextSchedStart = parseTimeToMinutes(nextSession.startTime);
    const nextSchedEnd = parseTimeToMinutes(nextSession.endTime);
    const nextSchedDur = (nextSchedStart !== null && nextSchedEnd !== null) ? nextSchedEnd - nextSchedStart : 60;
    const isNextLate = transMin !== null && nextSchedStart !== null && transMin > nextSchedStart;
    const nextRemarks = isNextLate
      ? `Started session at ${effectiveTransitionTime} (${transMin - nextSchedStart} mins into session window).`
      : `Consecutive session started on schedule at ${effectiveTransitionTime}.`;

    const nextIntervalId = generateTrainerIntervalId();
    const nextLogId = generateTrainerLogId();

    const newInterval = await TrainerInterval.create({
      id: nextIntervalId,
      date,
      monthYear: date.slice(0, 7),
      trainerId,
      trainerName: trainer.name,
      checkInTime: effectiveTransitionTime,
      checkOutTime: "",
      actualDurationMinutes: 0,
      totalTeachingDurationMinutes: 0,
      status: ATTENDANCE_STATUS.PRESENT,
      isContinuous: false,
      sessionIds: [nextSession.id],
      batchIds: [nextSession.batchId],
      sessionOverlaps: [
        {
          sessionId: nextSession.id,
          batchId: nextSession.batchId,
          batchName: nextSession.batchName || "",
          className: nextSession.className || `Class #${nextSession.classNumber}`,
          startTime: nextSession.startTime,
          endTime: nextSession.endTime,
          scheduledDurationMinutes: nextSchedDur,
          overlapMinutes: 0,
          status: "PRESENT",
          remarks: nextRemarks,
          isSubstituted: Boolean(nextSession.isSubstituted && nextSession.substituteCoachId === trainerId),
          substituteTrainerId: nextSession.isSubstituted ? nextSession.substituteCoachId : null,
        },
      ],
      remarks: nextRemarks,
      markedBy: user?.name || "Trainer",
    });

    const nextLog = await TrainerLog.findOneAndUpdate(
      { date, trainerId, sessionId: nextSession.id },
      {
        $set: {
          id: nextLogId,
          date,
          monthYear: date.slice(0, 7),
          trainerId,
          trainerName: trainer.name,
          batchId: nextSession.batchId,
          batchName: nextSession.batchName || "",
          sessionId: nextSession.id,
          intervalId: nextIntervalId,
          isContinuous: false,
          status: TRAINER_LOG_STATUS.PRESENT,
          substituteTrainerId: nextSession.isSubstituted ? nextSession.substituteCoachId : null,
          originalTrainerId: nextSession.isSubstituted ? (nextSession.originalCoachId || nextSession.coachId) : "",
          checkInTime: effectiveTransitionTime,
          checkOutTime: "",
          scheduledStartTime: nextSession.startTime,
          scheduledEndTime: nextSession.endTime,
          scheduledDurationMinutes: nextSchedDur,
          actualPresenceMinutes: 0,
          durationMinutes: 0,
          transitionedFromSessionId: currentSessionId,
          isException: isNextLate,
          exceptionType: isNextLate ? ATTENDANCE_EXCEPTION_TYPE.LATE : ATTENDANCE_EXCEPTION_TYPE.NONE,
          exceptionFlags: {
            isLate: isNextLate,
            isEarlyDeparture: false,
            missingCheckout: false,
            autoCheckout: false,
            requiresReview: isNextLate,
          },
          remarks: nextRemarks,
          markedBy: user?.name || "Trainer",
        },
      },
      { returnDocument: "after", upsert: true, runValidators: true, lean: true }
    );

    // 9. Record Audit Log
    await AttendanceAudit.create({
      id: generateAttendanceAuditId(),
      attendanceType: "TRAINER",
      recordId: nextLogId,
      date,
      trainerId,
      sessionId: nextSession.id,
      intervalId: nextIntervalId,
      action: "SESSION_TRANSITION",
      previousValues: {
        currentSessionId,
        currentCheckOutTime: effectiveTransitionTime,
      },
      updatedValues: {
        nextSessionId,
        nextCheckInTime: effectiveTransitionTime,
        transitionTime: effectiveTransitionTime,
      },
      reason: overrideReason || `Trainer transitioned to consecutive session (${currentSession.batchName || currentSessionId} -> ${nextSession.batchName || nextSessionId})`,
      performedBy: user?.name || user?.username || "Trainer",
    }).catch((e) => console.error("Session transition audit log error:", e));

    return {
      previousSession: updatedCurrentLog,
      nextSession: nextLog,
      interval: newInterval.toObject(),
    };
  }

  /**
   * 17. Admin Correction for Missed Session Transitions / Continuous Intervals:
   * When a trainer forgot to click "Add Another Session", an administrator reviews
   * and corrects each session's attendance with mandatory reason and audit log.
   */
  async adminCorrectContinuousSession(payload, user = null) {
    const {
      trainerId,
      date,
      intervalId,
      reason,
      sessionCorrections = [],
    } = payload;

    if (!reason || !reason.trim()) {
      throw new BadRequestError("Reason for administrative attendance correction is mandatory.");
    }
    if (!Array.isArray(sessionCorrections) || sessionCorrections.length === 0) {
      throw new BadRequestError("Session corrections array is required.");
    }

    const trainer = await Trainer.findOne({ id: trainerId }).lean();
    if (!trainer) throw new NotFoundError(`Faculty coach "${trainerId}" not found.`);

    const updatedLogs = [];

    for (const correction of sessionCorrections) {
      const { sessionId, checkInTime, checkOutTime, remarks: userRemarks } = correction;
      const session = await Session.findOne({ id: sessionId }).lean();
      if (!session) continue;

      const existingLog = await TrainerLog.findOne({ date, trainerId, sessionId }).lean();

      const inMin = parseTimeToMinutes(checkInTime);
      const outMin = parseTimeToMinutes(checkOutTime);
      if (inMin === null || outMin === null) {
        throw new BadRequestError(`Invalid time format for session "${sessionId}".`);
      }
      if (outMin < inMin) {
        throw new BadRequestError(`Check-out time cannot be earlier than check-in time for session "${sessionId}".`);
      }

      const schedStartMin = parseTimeToMinutes(session.startTime);
      const schedEndMin = parseTimeToMinutes(session.endTime);
      const schedDuration = (schedStartMin !== null && schedEndMin !== null) ? schedEndMin - schedStartMin : 60;
      const overlapMinutes = calculateSessionOverlap(inMin, outMin, schedStartMin, schedEndMin);
      const actualPresence = outMin - inMin;

      const baseRemarks = generateRemarks(inMin, outMin, schedStartMin, schedEndMin, false);
      const finalRemarks = userRemarks
        ? `${userRemarks} (Admin correction: ${reason.trim()})`
        : `${baseRemarks} (Admin correction: ${reason.trim()})`;

      const logId = existingLog?.id || generateTrainerLogId();
      const status = overlapMinutes > 0 ? TRAINER_LOG_STATUS.CONDUCTED : TRAINER_LOG_STATUS.ABSENT;

      const updatedLog = await TrainerLog.findOneAndUpdate(
        { date, trainerId, sessionId },
        {
          $set: {
            id: logId,
            date,
            monthYear: date.slice(0, 7),
            trainerId,
            trainerName: trainer.name,
            batchId: session.batchId,
            batchName: session.batchName || "",
            sessionId,
            checkInTime,
            checkOutTime,
            scheduledStartTime: session.startTime,
            scheduledEndTime: session.endTime,
            scheduledDurationMinutes: schedDuration,
            actualPresenceMinutes: actualPresence,
            durationMinutes: overlapMinutes,
            status,
            checkoutBy: "ADMIN",
            isException: false,
            exceptionType: ATTENDANCE_EXCEPTION_TYPE.OVERRIDE,
            exceptionFlags: {
              isLate: inMin > schedStartMin,
              isEarlyDeparture: outMin < schedEndMin,
              missingCheckout: false,
              autoCheckout: false,
              requiresReview: false,
            },
            remarks: finalRemarks,
            markedBy: user?.name || user?.username || "Admin",
          },
        },
        { returnDocument: "after", upsert: true, runValidators: true, lean: true }
      );

      // Audit trail
      await AttendanceAudit.create({
        id: generateAttendanceAuditId(),
        attendanceType: "TRAINER",
        recordId: logId,
        date,
        trainerId,
        sessionId,
        batchId: session.batchId,
        action: "CORRECTION",
        previousValues: existingLog || {},
        updatedValues: {
          checkInTime,
          checkOutTime,
          durationMinutes: overlapMinutes,
          actualPresenceMinutes: actualPresence,
          status,
          remarks: finalRemarks,
        },
        reason: reason.trim(),
        performedBy: user?.name || user?.username || "Admin",
      }).catch((e) => console.error("Admin correction audit log error:", e));

      updatedLogs.push(updatedLog);
    }

    // If intervalId is given, recalculate interval totals
    if (intervalId) {
      const totalTeaching = updatedLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
      const totalPresence = updatedLogs.reduce((sum, l) => sum + (l.actualPresenceMinutes || 0), 0);
      await TrainerInterval.findOneAndUpdate(
        { id: intervalId },
        {
          $set: {
            totalTeachingDurationMinutes: totalTeaching,
            actualDurationMinutes: totalPresence,
            remarks: `Admin corrected attendance across ${updatedLogs.length} sessions: ${reason.trim()}`,
            isException: false,
            exceptionType: ATTENDANCE_EXCEPTION_TYPE.OVERRIDE,
          },
        }
      );
    }

    return { count: updatedLogs.length, logs: updatedLogs };
  }
}

module.exports = new AttendanceService();
