"use strict";

const TrainerLeave = require("./trainerLeave.model");
const TrainerLog = require("./trainerLog.model");
const Trainer = require("../trainers/trainer.model");
const Batch = require("../batches/batch.model");
const Session = require("../schedules/session.model");
const trainerLeavePolicyService = require("./trainerLeavePolicy.service");
const notificationService = require("../notifications/notification.service");
const { generateTrainerLeaveId, generateTrainerLogId } = require("../../shared/idGenerator");
const { TRAINER_LEAVE_STATUS, TRAINER_LOG_STATUS } = require("../../shared/constants");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../../shared/apiError");

/**
 * Calculates total leave days between two dates inclusive (YYYY-MM-DD).
 */
function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const d1 = new Date(startDate + "T00:00:00Z");
  const d2 = new Date(endDate + "T00:00:00Z");
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    throw new BadRequestError("Invalid date format. Expected YYYY-MM-DD.");
  }
  if (d2 < d1) {
    throw new BadRequestError("Leave end date cannot be earlier than start date.");
  }
  const diffMs = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

class TrainerLeaveService {
  /**
   * 1. Submit / create a new trainer leave request with policy validation.
   * Supports Regular Leave and Emergency Leave.
   */
  async createLeaveRequest(data, user) {
    // RBAC: Trainers can only submit requests for themselves
    let targetTrainerId = data.trainerId;
    if (user?.role === "trainer") {
      targetTrainerId = user.trainerId || data.trainerId;
    }

    if (!targetTrainerId) {
      throw new BadRequestError("Trainer ID is required.");
    }
    if (!data.leaveStartDate || !data.leaveEndDate) {
      throw new BadRequestError("Both leave start date and end date are required.");
    }
    if (data.leaveEndDate < data.leaveStartDate) {
      throw new BadRequestError("Leave end date cannot be earlier than start date.");
    }

    const leaveType = data.leaveType === "EMERGENCY" ? "EMERGENCY" : "REGULAR";

    // Emergency leave requires a mandatory reason
    if (leaveType === "EMERGENCY" && (!data.reason || !String(data.reason).trim())) {
      throw new BadRequestError("A reason is mandatory for emergency leave applications.");
    }

    // 1. Resolve trainer name
    let trainerName = data.trainerName || "";
    if (!trainerName) {
      const trainer = await Trainer.findOne({ id: targetTrainerId }).lean();
      if (trainer) {
        trainerName = `${trainer.firstName || ""} ${trainer.lastName || ""}`.trim() || trainer.name || targetTrainerId;
      } else {
        trainerName = targetTrainerId;
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const submittedOn = data.submittedOn || todayStr;

    // 2. Check for overlapping pending or approved leave requests for the same trainer
    const overlap = await TrainerLeave.findOne({
      trainerId: targetTrainerId,
      status: { $in: [TRAINER_LEAVE_STATUS.PENDING, TRAINER_LEAVE_STATUS.APPROVED] },
      leaveStartDate: { $lte: data.leaveEndDate },
      leaveEndDate: { $gte: data.leaveStartDate },
    }).lean();

    if (overlap) {
      throw new BadRequestError(
        `Trainer already has an existing ${overlap.status} leave (${overlap.id}) from ${overlap.leaveStartDate} to ${overlap.leaveEndDate}.`
      );
    }

    // 3. Validate against active Trainer Leave Policy
    const policyResult = await trainerLeavePolicyService.validateLeaveNotice(
      data.leaveStartDate,
      data.leaveEndDate,
      submittedOn,
      leaveType
    );

    const allowOverride = Boolean(data.allowPolicyOverride);

    if (!policyResult.isValid && !allowOverride) {
      throw new BadRequestError(policyResult.message);
    }

    // 4. Resolve affected batches
    const batches = await Batch.find({ trainerIds: targetTrainerId, status: "Active" }).lean();
    const affectedBatchIds = batches.map((b) => b.id);

    // 5. Evaluate Annual Leave Allowance & LOP Impact
    const lopImpact = await this.evaluateLeaveLopImpact(targetTrainerId, data.leaveStartDate, data.leaveEndDate);

    // 6. Create leave request
    const leaveId = generateTrainerLeaveId();
    const newLeave = await TrainerLeave.create({
      id: leaveId,
      trainerId: targetTrainerId,
      trainerName,
      leaveType,
      requestedStartDate: data.leaveStartDate,
      requestedEndDate: data.leaveEndDate,
      totalRequestedDays: policyResult.totalDays,
      approvedStartDate: null,
      approvedEndDate: null,
      totalApprovedDays: 0,
      leaveStartDate: data.leaveStartDate,
      leaveEndDate: data.leaveEndDate,
      totalDays: policyResult.totalDays,
      submittedOn,
      submittedAt: new Date(),
      actualNoticeDays: policyResult.actualNoticeDays,
      requiredNoticeDays: policyResult.requiredNoticeDays,
      tierLabel: policyResult.tier?.label || (leaveType === "EMERGENCY" ? "Emergency Leave (Notice Bypassed)" : ""),
      isNoticeCompliant: policyResult.isValid,
      allowPolicyOverride: allowOverride,
      overrideReason: allowOverride ? data.overrideReason || "Admin authorized notice override" : "",
      reason: data.reason ? String(data.reason).trim() : "",
      status: TRAINER_LEAVE_STATUS.PENDING,
      adminDecision: "PENDING",
      reviewedBy: null,
      reviewNote: "",
      reviewedAt: null,
      policyComplianceResult: policyResult,
      annualLeaveCalculation: lopImpact,
      affectedBatchIds,
      auditLogs: [
        {
          action: "SUBMISSION",
          actor: user?.name || trainerName,
          timestamp: new Date(),
          remarks: data.reason ? String(data.reason).trim() : "",
          details: {
            leaveType,
            requestedStartDate: data.leaveStartDate,
            requestedEndDate: data.leaveEndDate,
            totalDays: policyResult.totalDays,
            compliance: policyResult,
          },
        },
      ],
    });

    // 6. Notify Administrators about new leave request
    try {
      await notificationService.createNotification({
        recipientRole: "admin",
        title: `New ${leaveType === "EMERGENCY" ? "Emergency " : ""}Leave Request`,
        message: `${trainerName} (${targetTrainerId}) submitted a ${leaveType.toLowerCase()} leave request for ${data.leaveStartDate} to ${data.leaveEndDate} (${policyResult.totalDays} day${policyResult.totalDays > 1 ? "s" : ""}).`,
        type: "LEAVE_REQUESTED",
        data: {
          leaveId,
          trainerId: targetTrainerId,
          leaveType,
          startDate: data.leaveStartDate,
          endDate: data.leaveEndDate,
          reason: data.reason || "",
        },
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed on leave submission:", notifErr.message);
    }

    return newLeave.toObject ? newLeave.toObject() : newLeave;
  }

  /**
   * 2. Query leave requests with filters (trainerId, status, leaveType, month, search).
   * Trainers are strictly scoped to their own requests.
   */
  async getLeaveRequests(query = {}, user) {
    const filter = {};

    // RBAC: Trainers can only query their own leaves
    if (user?.role === "trainer") {
      filter.trainerId = user.trainerId || "TRN-NONEXISTENT";
    } else if (query.trainerId && query.trainerId !== "all") {
      filter.trainerId = query.trainerId;
    }

    if (query.leaveType && query.leaveType !== "all" && query.leaveType !== "ALL") {
      filter.leaveType = query.leaveType.toUpperCase();
    }

    if (query.status && query.status !== "all" && query.status !== "ALL") {
      if (query.status.includes(",")) {
        const statuses = query.status.split(",").map((s) => s.trim().toUpperCase());
        // Expand DENIED/REJECTED aliases
        if (statuses.includes("DENIED") && !statuses.includes("REJECTED")) {
          statuses.push("REJECTED");
        }
        filter.status = { $in: statuses };
      } else {
        const upper = query.status.toUpperCase();
        if (upper === "DENIED" || upper === "REJECTED") {
          filter.status = { $in: ["DENIED", "REJECTED"] };
        } else {
          filter.status = upper;
        }
      }
    }

    if (query.month) {
      // Month format: YYYY-MM
      filter.$or = [
        { leaveStartDate: { $regex: `^${query.month}` } },
        { leaveEndDate: { $regex: `^${query.month}` } },
      ];
    }

    if (query.startDate && query.endDate) {
      filter.leaveStartDate = { $lte: query.endDate };
      filter.leaveEndDate = { $gte: query.startDate };
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), "i");
      const searchConditions = [
        { trainerName: regex },
        { trainerId: regex },
        { reason: regex },
        { id: regex },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    return TrainerLeave.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * 3. Get single leave request by id.
   */
  async getLeaveRequestById(id, user) {
    const leave = await TrainerLeave.findOne({ id }).lean();
    if (!leave) {
      throw new NotFoundError(`Trainer leave request "${id}" not found.`);
    }

    // RBAC: Trainers cannot view requests belonging to other trainers
    if (user?.role === "trainer" && user.trainerId && leave.trainerId !== user.trainerId) {
      throw new ForbiddenError("You are not authorized to view another trainer's leave request.");
    }

    return leave;
  }

  /**
   * 4. Update status: APPROVED, DENIED, REJECTED, or CANCELLED.
   * Supports approving full requested duration or shorter period.
   * Records approvedStartDate and approvedEndDate separately.
   * Does NOT auto-assign substitutes; returns affected batch sessions to Admin.
   */
  async updateLeaveStatus(id, updateData, user) {
    const leave = await TrainerLeave.findOne({ id });
    if (!leave) {
      throw new NotFoundError(`Trainer leave request "${id}" not found.`);
    }

    let nextStatus = updateData.status ? String(updateData.status).toUpperCase() : "";
    if (nextStatus === "REJECTED") nextStatus = "DENIED";

    const validStatuses = ["APPROVED", "DENIED", "CANCELLED", "REJECTED", "PENDING"];
    if (!validStatuses.includes(nextStatus)) {
      throw new BadRequestError(`Invalid status "${updateData.status}". Allowed values: APPROVED, DENIED, CANCELLED`);
    }

    const previousStatus = leave.status;
    const reviewNote = updateData.reviewNote !== undefined ? String(updateData.reviewNote).trim() : leave.reviewNote;
    const reviewedBy = user?.name || updateData.reviewedBy || "Admin";

    let affectedSessions = [];

    if (nextStatus === "APPROVED") {
      // Allow Admin to approve full requested duration or a shorter duration within requested window
      const reqStart = leave.requestedStartDate || leave.leaveStartDate;
      const reqEnd = leave.requestedEndDate || leave.leaveEndDate;

      const appStart = updateData.approvedStartDate || reqStart;
      const appEnd = updateData.approvedEndDate || reqEnd;

      if (appStart < reqStart || appEnd > reqEnd) {
        throw new BadRequestError(
          `Approved dates (${appStart} to ${appEnd}) must fall within originally requested window (${reqStart} to ${reqEnd}).`
        );
      }
      if (appEnd < appStart) {
        throw new BadRequestError("Approved end date cannot be earlier than start date.");
      }

      const totalApprovedDays = calculateDays(appStart, appEnd);

      leave.approvedStartDate = appStart;
      leave.approvedEndDate = appEnd;
      leave.totalApprovedDays = totalApprovedDays;

      // Effective dates for attendance tracking
      leave.leaveStartDate = appStart;
      leave.leaveEndDate = appEnd;
      leave.totalDays = totalApprovedDays;

      leave.status = "APPROVED";
      leave.adminDecision = "APPROVED";
      leave.reviewNote = reviewNote;
      leave.reviewedBy = reviewedBy;
      leave.reviewedAt = new Date();

      // Evaluate Annual Leave Allowance & LOP Impact for approved dates
      const lopImpact = await this.evaluateLeaveLopImpact(leave.trainerId, appStart, appEnd, { excludeLeaveId: leave.id });
      leave.annualLeaveCalculation = lopImpact;

      // Seed TrainerLog entries with status LEAVE for all affected days
      await this._seedLeaveLogsForTrainer(leave);

      // Find affected batch sessions during this approved leave window
      affectedSessions = await Session.find({
        coachId: leave.trainerId,
        sessionDate: { $gte: appStart, $lte: appEnd },
      }).sort({ sessionDate: 1, startTime: 1 }).lean();

      leave.auditLogs.push({
        action: "APPROVAL",
        actor: reviewedBy,
        timestamp: new Date(),
        remarks: reviewNote,
        details: {
          approvedStartDate: appStart,
          approvedEndDate: appEnd,
          totalApprovedDays,
          requestedStartDate: reqStart,
          requestedEndDate: reqEnd,
          affectedSessionsCount: affectedSessions.length,
        },
      });

      // Notify trainer of approval
      try {
        await notificationService.createNotification({
          recipientId: leave.trainerId,
          recipientRole: "trainer",
          title: "Leave Request Approved",
          message: `Your ${leave.leaveType.toLowerCase()} leave request for ${appStart} to ${appEnd} has been approved.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
          type: "LEAVE_APPROVED",
          data: {
            leaveId: leave.id,
            status: "APPROVED",
            approvedStartDate: appStart,
            approvedEndDate: appEnd,
            totalApprovedDays,
            reviewNote,
          },
        });
      } catch (notifErr) {
        console.warn("Notification dispatch failed on leave approval:", notifErr.message);
      }
    } else if (nextStatus === "DENIED") {
      leave.status = "DENIED";
      leave.adminDecision = "DENIED";
      leave.approvedStartDate = null;
      leave.approvedEndDate = null;
      leave.totalApprovedDays = 0;
      leave.reviewNote = reviewNote;
      leave.reviewedBy = reviewedBy;
      leave.reviewedAt = new Date();

      // If was previously approved but now denied, clean up any seeded LEAVE logs
      if (previousStatus === "APPROVED") {
        await this._revertLeaveLogsForTrainer(leave);
      }

      leave.auditLogs.push({
        action: "DENIAL",
        actor: reviewedBy,
        timestamp: new Date(),
        remarks: reviewNote,
        details: {
          requestedStartDate: leave.requestedStartDate,
          requestedEndDate: leave.requestedEndDate,
        },
      });

      // Notify trainer of denial
      try {
        await notificationService.createNotification({
          recipientId: leave.trainerId,
          recipientRole: "trainer",
          title: "Leave Request Denied",
          message: `Your ${leave.leaveType.toLowerCase()} leave request (${leave.requestedStartDate} to ${leave.requestedEndDate}) was denied.${reviewNote ? ` Remarks: ${reviewNote}` : ""}`,
          type: "LEAVE_DENIED",
          data: {
            leaveId: leave.id,
            status: "DENIED",
            reviewNote,
          },
        });
      } catch (notifErr) {
        console.warn("Notification dispatch failed on leave denial:", notifErr.message);
      }
    } else if (nextStatus === "CANCELLED") {
      leave.status = "CANCELLED";
      leave.adminDecision = "CANCELLED";
      leave.reviewNote = reviewNote || "Cancelled";
      leave.reviewedBy = reviewedBy;
      leave.reviewedAt = new Date();

      if (previousStatus === "APPROVED") {
        await this._revertLeaveLogsForTrainer(leave);
      }

      leave.auditLogs.push({
        action: "CANCELLATION",
        actor: reviewedBy,
        timestamp: new Date(),
        remarks: reviewNote,
        details: {},
      });
    }

    await leave.save();

    const leaveObj = leave.toObject();
    return {
      ...leaveObj,
      affectedSessions,
    };
  }

  /**
   * 5. Helper to seed TrainerLog entries for each day of an approved leave.
   */
  async _seedLeaveLogsForTrainer(leave) {
    const startDate = leave.approvedStartDate || leave.leaveStartDate;
    const endDate = leave.approvedEndDate || leave.leaveEndDate;

    const dStart = new Date(startDate + "T00:00:00Z");
    const dEnd = new Date(endDate + "T00:00:00Z");

    const batches = await Batch.find({ trainerIds: leave.trainerId, status: "Active" }).lean();
    const batchList = batches.length > 0 ? batches : [{ id: "GENERAL", name: "General Duty" }];

    for (let cur = new Date(dStart); cur <= dEnd; cur.setUTCDate(cur.getUTCDate() + 1)) {
      const dateStr = cur.toISOString().slice(0, 10);
      const monthYear = dateStr.slice(0, 7);

      for (const batch of batchList) {
        await TrainerLog.findOneAndUpdate(
          { date: dateStr, trainerId: leave.trainerId, batchId: batch.id },
          {
            $set: {
              date: dateStr,
              monthYear,
              trainerId: leave.trainerId,
              trainerName: leave.trainerName,
              batchId: batch.id,
              status: TRAINER_LOG_STATUS.LEAVE,
              notes: `Approved Leave [${leave.id}]${leave.leaveType === "EMERGENCY" ? " (Emergency)" : ""}${leave.reason ? `: ${leave.reason}` : ""}`.trim(),
            },
            $setOnInsert: {
              id: generateTrainerLogId(),
            },
          },
          { upsert: true, returnDocument: "after" }
        );
      }
    }
  }

  /**
   * 6. Helper to clean up any seeded TrainerLog entries when leave is cancelled/revoked.
   */
  async _revertLeaveLogsForTrainer(leave) {
    await TrainerLog.deleteMany({
      trainerId: leave.trainerId,
      status: TRAINER_LOG_STATUS.LEAVE,
      notes: { $regex: leave.id },
    });
  }

  /**
   * 7. Cancel leave request.
   */
  async cancelLeaveRequest(id, user) {
    const leave = await TrainerLeave.findOne({ id });
    if (!leave) {
      throw new NotFoundError(`Trainer leave request "${id}" not found.`);
    }

    // RBAC: Trainers can only cancel their own requests
    if (user?.role === "trainer" && user.trainerId && leave.trainerId !== user.trainerId) {
      throw new ForbiddenError("You are not authorized to cancel another trainer's leave request.");
    }

    return this.updateLeaveStatus(
      id,
      {
        status: "CANCELLED",
        reviewNote: "Cancelled by applicant.",
        reviewedBy: user?.name || user?.username || "Trainer",
      },
      user
    );
  }

  /**
   * 8. Fetch affected batch sessions for a leave request.
   */
  async getLeaveAffectedSessions(id, user) {
    const leave = await TrainerLeave.findOne({ id }).lean();
    if (!leave) {
      throw new NotFoundError(`Trainer leave request "${id}" not found.`);
    }

    const start = leave.approvedStartDate || leave.leaveStartDate;
    const end = leave.approvedEndDate || leave.leaveEndDate;

    const sessions = await Session.find({
      coachId: leave.trainerId,
      sessionDate: { $gte: start, $lte: end },
    }).sort({ sessionDate: 1, startTime: 1 }).lean();

    return {
      leave,
      sessions,
      totalSessionsCount: sessions.length,
    };
  }

  /**
   * Calculates a trainer's annual leave balance and LOP days for a given calendar year.
   * Deduplicates overlapping dates and combines:
   * 1. Informed leave: Approved TrainerLeave requests and TrainerLog records with status LEAVE.
   * 2. Uninformed leave: TrainerLog records with status ABSENT (unexcused absences).
   *
   * @param {string} trainerId
   * @param {number|string} [year] - e.g. 2026 (defaults to current year)
   * @param {object} [options]
   * @param {string} [options.excludeLeaveId] - leave request ID to exclude
   * @returns {Promise<object>} Balance breakdown
   */
  async calculateTrainerAnnualLeaveBalance(trainerId, year, options = {}) {
    const yearStr = String(year || new Date().getFullYear());
    const policy = await trainerLeavePolicyService.getPolicy();
    const annualAllowance =
      typeof policy?.annualPaidLeaveAllowance === "number"
        ? policy.annualPaidLeaveAllowance
        : 36;
    const deductionPerDay =
      typeof policy?.unpaidDeductionPerDay === "number"
        ? policy.unpaidDeductionPerDay
        : 1000;

    // 1. Fetch approved TrainerLeave requests overlapping with this calendar year
    const leaveQuery = {
      trainerId,
      status: TRAINER_LEAVE_STATUS.APPROVED,
      $or: [
        { leaveStartDate: { $regex: `^${yearStr}` } },
        { leaveEndDate: { $regex: `^${yearStr}` } },
        { approvedStartDate: { $regex: `^${yearStr}` } },
        { approvedEndDate: { $regex: `^${yearStr}` } },
      ],
    };
    if (options?.excludeLeaveId) {
      leaveQuery.id = { $ne: options.excludeLeaveId };
    }

    const approvedLeaves = await TrainerLeave.find(leaveQuery).lean();

    // Collect unique informed leave dates (YYYY-MM-DD)
    const informedDatesSet = new Set();
    for (const l of approvedLeaves) {
      const start = l.approvedStartDate || l.leaveStartDate;
      const end = l.approvedEndDate || l.leaveEndDate;
      if (!start || !end) continue;
      const d1 = new Date(start + "T00:00:00Z");
      const d2 = new Date(end + "T00:00:00Z");
      for (let cur = new Date(d1); cur <= d2; cur.setUTCDate(cur.getUTCDate() + 1)) {
        const dateStr = cur.toISOString().slice(0, 10);
        if (dateStr.startsWith(yearStr)) {
          informedDatesSet.add(dateStr);
        }
      }
    }

    // Also collect TrainerLog entries with status LEAVE
    const leaveLogs = await TrainerLog.find({
      trainerId,
      status: TRAINER_LOG_STATUS.LEAVE,
      date: { $regex: `^${yearStr}` },
    }).lean();
    for (const log of leaveLogs) {
      if (log.date && log.date.startsWith(yearStr)) {
        informedDatesSet.add(log.date);
      }
    }

    // 2. Fetch uninformed absences from TrainerLog (status: ABSENT)
    const absentLogs = await TrainerLog.find({
      trainerId,
      status: TRAINER_LOG_STATUS.ABSENT,
      date: { $regex: `^${yearStr}` },
    }).lean();

    const uninformedDatesSet = new Set();
    for (const log of absentLogs) {
      if (log.date && log.date.startsWith(yearStr)) {
        // Prevent double counting if already present in informed leaves
        if (!informedDatesSet.has(log.date)) {
          uninformedDatesSet.add(log.date);
        }
      }
    }

    const informedDates = Array.from(informedDatesSet).sort();
    const uninformedDates = Array.from(uninformedDatesSet).sort();
    const allUniqueDates = Array.from(new Set([...informedDates, ...uninformedDates])).sort();

    const totalDaysUsed = allUniqueDates.length;
    const paidDaysUsed = Math.min(totalDaysUsed, annualAllowance);
    const remainingDays = Math.max(0, annualAllowance - totalDaysUsed);
    const lopDays = Math.max(0, totalDaysUsed - annualAllowance);
    const lopDeductionAmount = lopDays * deductionPerDay;

    const paidDates = allUniqueDates.slice(0, annualAllowance);
    const lopDates = allUniqueDates.slice(annualAllowance);

    return {
      trainerId,
      year: Number(yearStr),
      annualAllowance,
      totalDaysUsed,
      paidDaysUsed,
      remainingDays,
      lopDays,
      lopDeductionAmount,
      deductionPerDay,
      informedDays: informedDates.length,
      uninformedDays: uninformedDates.length,
      informedDates,
      uninformedDates,
      allUniqueDates,
      paidDates,
      lopDates,
    };
  }

  /**
   * Evaluates the LOP impact of a proposed leave window.
   *
   * @param {string} trainerId
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate   - YYYY-MM-DD
   * @param {object} [options]
   */
  async evaluateLeaveLopImpact(trainerId, startDate, endDate, options = {}) {
    const yearStr = startDate ? startDate.slice(0, 4) : String(new Date().getFullYear());
    const balance = await this.calculateTrainerAnnualLeaveBalance(trainerId, yearStr, options);

    // Collect dates in the proposed leave
    const proposedDates = [];
    const d1 = new Date(startDate + "T00:00:00Z");
    const d2 = new Date(endDate + "T00:00:00Z");
    for (let cur = new Date(d1); cur <= d2; cur.setUTCDate(cur.getUTCDate() + 1)) {
      const dateStr = cur.toISOString().slice(0, 10);
      proposedDates.push(dateStr);
    }

    // Determine which proposed dates are new (not already in existing leave/absent records)
    const existingDatesSet = new Set(balance.allUniqueDates);
    const newDates = proposedDates.filter((d) => !existingDatesSet.has(d));
    const totalRequestedDays = proposedDates.length;
    const netNewDays = newDates.length;

    // Current remaining paid leave days before this request
    const priorRemaining = balance.remainingDays;
    const paidDaysForThisRequest = Math.min(netNewDays, priorRemaining);
    const lopDaysForThisRequest = Math.max(0, netNewDays - priorRemaining);
    const lopDeduction = lopDaysForThisRequest * balance.deductionPerDay;

    const projectedDaysUsed = balance.totalDaysUsed + netNewDays;
    const projectedRemaining = Math.max(0, balance.annualAllowance - projectedDaysUsed);
    const projectedLopDays = Math.max(0, projectedDaysUsed - balance.annualAllowance);

    return {
      annualAllowance: balance.annualAllowance,
      currentBalance: {
        totalDaysUsed: balance.totalDaysUsed,
        remainingDays: balance.remainingDays,
        lopDays: balance.lopDays,
        informedDays: balance.informedDays,
        uninformedDays: balance.uninformedDays,
      },
      requestImpact: {
        totalRequestedDays,
        netNewDays,
        paidDays: paidDaysForThisRequest,
        lopDays: lopDaysForThisRequest,
        lopDeduction,
      },
      projectedBalance: {
        totalDaysUsed: projectedDaysUsed,
        remainingDays: projectedRemaining,
        lopDays: projectedLopDays,
      },
    };
  }

  /**
   * 9. Aggregate monthly leave summary per trainer with annual 36-day allowance and LOP deductions.
   */
  async getMonthlyLeaveSummary(query) {
    const month = query?.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const [yearNum] = month.split("-").map(Number);
    const yearStr = String(yearNum);

    // Fetch active policy to get allowance and deduction rate
    const policy = await trainerLeavePolicyService.getPolicy();
    const annualAllowance = typeof policy?.annualPaidLeaveAllowance === "number" ? policy.annualPaidLeaveAllowance : 36;
    const deductionPerDay = typeof policy?.unpaidDeductionPerDay === "number" ? policy.unpaidDeductionPerDay : 1000;
    const monthlyAllowance = Math.round(annualAllowance / 12) || 3;

    // Fetch leaves that overlap with this month
    const leaves = await TrainerLeave.find({
      $or: [
        { leaveStartDate: { $regex: `^${month}` } },
        { leaveEndDate: { $regex: `^${month}` } },
      ],
    }).lean();

    // Group leaves by trainerId
    const summaryMap = {};
    for (const l of leaves) {
      if (!summaryMap[l.trainerId]) {
        summaryMap[l.trainerId] = {
          trainerId: l.trainerId,
          trainerName: l.trainerName,
          approvedDays: 0,
          pendingDays: 0,
          rejectedDays: 0,
          emergencyLeavesCount: 0,
          leaves: [],
        };
      }
      summaryMap[l.trainerId].leaves.push(l);

      if (l.leaveType === "EMERGENCY") {
        summaryMap[l.trainerId].emergencyLeavesCount++;
      }
    }

    // Get all trainers to provide a comprehensive list
    const allTrainers = await Trainer.find().lean();
    const trainersSummary = await Promise.all(
      allTrainers.map(async (t) => {
        const leaveItem = summaryMap[t.id] || {
          trainerId: t.id,
          trainerName: `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.name || t.id,
          approvedDays: 0,
          pendingDays: 0,
          rejectedDays: 0,
          emergencyLeavesCount: 0,
          leaves: [],
        };

        // Calculate trainer's full annual leave history & balance
        const balance = await this.calculateTrainerAnnualLeaveBalance(t.id, yearStr);

        // Find which unique leave/absent dates occurred in the queried month
        const monthDates = balance.allUniqueDates.filter((d) => d.startsWith(month));
        const monthPaidDates = balance.paidDates.filter((d) => d.startsWith(month));
        const monthLopDates = balance.lopDates.filter((d) => d.startsWith(month));

        const paidDays = monthPaidDates.length;
        const unpaidDays = monthLopDates.length; // LOP days in this month
        const totalDeduction = unpaidDays * deductionPerDay;

        return {
          ...leaveItem,
          approvedDays: monthDates.length,
          monthlyAllowance,
          paidDays,
          unpaidDays, // LOP days
          totalDeduction,
          deductionPerDay,
          remainingBalance: balance.remainingDays,
          // Annual metrics
          annualAllowance,
          annualDaysUsed: balance.totalDaysUsed,
          annualRemainingDays: balance.remainingDays,
          annualLopDays: balance.lopDays,
          annualInformedDays: balance.informedDays,
          annualUninformedDays: balance.uninformedDays,
          monthLeaveDates: monthDates,
          monthPaidDates,
          monthLopDates,
        };
      })
    );

    return {
      month,
      annualAllowance,
      monthlyAllowance,
      deductionPerDay,
      trainersSummary,
      totalApprovedLeaveDays: trainersSummary.reduce((acc, r) => acc + r.approvedDays, 0),
      totalUnpaidLeaveDays: trainersSummary.reduce((acc, r) => acc + r.unpaidDays, 0),
      totalLeaveDeductions: trainersSummary.reduce((acc, r) => acc + r.totalDeduction, 0),
    };
  }

  /**
   * 10. Annual leave summary aggregation across faculty coaches.
   * Resets every calendar year while preserving previous years' records.
   */
  async getAnnualLeaveSummary(query = {}, user) {
    const year = query.year || new Date().getFullYear();
    const policy = await trainerLeavePolicyService.getPolicy();

    let targetTrainerIds = [];
    if (user?.role === "trainer") {
      targetTrainerIds = [user.trainerId || "TRN-NONEXISTENT"];
    } else if (query.trainerId && query.trainerId !== "all" && query.trainerId !== "ALL") {
      targetTrainerIds = [query.trainerId];
    } else {
      const trainers = await Trainer.find().lean();
      targetTrainerIds = trainers.map((t) => t.id);
    }

    const summaries = await Promise.all(
      targetTrainerIds.map((trainerId) => this.calculateTrainerAnnualLeaveBalance(trainerId, year))
    );

    const trainersMap = {};
    const trainersList = await Trainer.find({ id: { $in: targetTrainerIds } }).lean();
    trainersList.forEach((t) => {
      trainersMap[t.id] = `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.name || t.id;
    });

    const enrichedSummaries = summaries.map((s) => ({
      ...s,
      trainerName: trainersMap[s.trainerId] || s.trainerId,
    }));

    if (query.trainerId && query.trainerId !== "all" && query.trainerId !== "ALL") {
      return enrichedSummaries[0] || null;
    }

    return {
      year: Number(year),
      annualAllowance: policy.annualPaidLeaveAllowance || 36,
      deductionPerDay: policy.unpaidDeductionPerDay || 1000,
      summaries: enrichedSummaries,
    };
  }
}

module.exports = new TrainerLeaveService();
