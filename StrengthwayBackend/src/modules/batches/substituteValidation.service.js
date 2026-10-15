"use strict";

const Trainer = require("../trainers/trainer.model");
const Batch = require("./batch.model");
const Session = require("../schedules/session.model");
const TrainerLeave = require("../attendance/trainerLeave.model");
const TrainerLog = require("../attendance/trainerLog.model");
const { TRAINER_LEAVE_STATUS } = require("../../shared/constants");
const { NotFoundError, BadRequestError } = require("../../shared/apiError");

/**
 * Converts a time string (e.g. "06:00 AM", "6:00 AM", "14:30") into minutes from midnight.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }
  return null;
}

/**
 * Normalizes date inputs to standard YYYY-MM-DD format for accurate string comparison against leave records.
 */
function normalizeDateStr(dateVal) {
  if (!dateVal) return "";
  if (dateVal instanceof Date) {
    return dateVal.toISOString().slice(0, 10);
  }
  const str = String(dateVal).trim();
  if (str.includes("T")) {
    return str.split("T")[0];
  }
  const ymd = str.match(/\d{4}-\d{2}-\d{2}/);
  if (ymd) return ymd[0];
  return str;
}

/**
 * Checks whether two time intervals [startA, endA] and [startB, endB] overlap.
 * Strictly checks start and end boundaries: startA < endB && endA > startB.
 * Ongoing classes are treated as occupied for their full scheduled duration.
 */
function areTimesOverlapping(startAStr, endAStr, startBStr, endBStr) {
  const startA = parseTimeToMinutes(startAStr);
  const endA = parseTimeToMinutes(endAStr);
  const startB = parseTimeToMinutes(startBStr);
  const endB = parseTimeToMinutes(endBStr);

  if (startA === null || endA === null || startB === null || endB === null) {
    // If minutes cannot be parsed, check exact string equality as fallback
    return startAStr?.trim() === startBStr?.trim();
  }

  return startA < endB && endA > startB;
}

class SubstituteValidationService {
  /**
   * Validates if a specific trainer is genuinely available for a session on a date and time slot.
   */
  async validateTrainerAvailability({
    trainerId,
    date,
    startTime = "06:00 AM",
    endTime = "07:00 AM",
    excludeSessionId = "",
    originalTrainerId = "",
  }) {
    if (!trainerId) {
      return { isAvailable: false, reason: "Trainer ID is required." };
    }

    const normDate = normalizeDateStr(date);

    // 1. Verify Trainer exists and is Active
    const trainer = await Trainer.findOne({ id: trainerId }).lean();
    if (!trainer) {
      return { isAvailable: false, reason: `Trainer with ID "${trainerId}" was not found.` };
    }
    if (trainer.status === "Inactive") {
      return { isAvailable: false, reason: `Trainer ${trainer.name || trainerId} is currently Inactive.` };
    }

    // 2. Cannot substitute for oneself if already the original primary trainer
    if (originalTrainerId && trainerId === originalTrainerId) {
      return {
        isAvailable: false,
        reason: "Trainer is already the primary assigned coach for this session.",
      };
    }

    // 3. Check for Approved or Pending Leaves covering the date
    const leaveConflict = await TrainerLeave.findOne({
      trainerId,
      status: { $in: [TRAINER_LEAVE_STATUS.APPROVED, TRAINER_LEAVE_STATUS.PENDING] },
      leaveStartDate: { $lte: normDate },
      leaveEndDate: { $gte: normDate },
    }).lean();

    if (leaveConflict) {
      const statusLabel = leaveConflict.status === TRAINER_LEAVE_STATUS.APPROVED ? "approved" : "pending";
      return {
        isAvailable: false,
        reason: `Trainer is on ${statusLabel} leave from ${leaveConflict.leaveStartDate} to ${leaveConflict.leaveEndDate}${leaveConflict.reason ? ` (${leaveConflict.reason})` : ""}.`,
        conflictType: "LEAVE",
        conflictDetails: leaveConflict,
      };
    }

    // 4. Check TrainerLog for explicit leave or absent status on this date
    const logConflict = await TrainerLog.findOne({
      trainerId,
      date: normDate,
      status: { $in: ["LEAVE", "ABSENT"] },
    }).lean();

    if (logConflict) {
      return {
        isAvailable: false,
        reason: `Trainer is recorded as ${logConflict.status} on ${normDate}.`,
        conflictType: "TRAINER_LOG",
        conflictDetails: logConflict,
      };
    }

    // 5. Check for overlapping Scheduled or Active Batch Sessions on this date
    const sessionQuery = {
      $or: [{ sessionDate: normDate }, { date: normDate }, { sessionDate: date }, { date: date }],
      status: { $nin: ["CANCELLED"] },
      $and: [
        {
          $or: [
            { coachId: trainerId, isSubstituted: { $ne: true } },
            { substituteCoachId: trainerId, substitutionStatus: { $nin: ["CANCELLED"] } },
          ],
        },
      ],
    };

    if (excludeSessionId) {
      sessionQuery.id = { $ne: excludeSessionId };
    }

    const candidateSessions = await Session.find(sessionQuery).lean();

    for (const sess of candidateSessions) {
      const sessStart = sess.startTime || "06:00 AM";
      const sessEnd = sess.endTime || "07:00 AM";

      if (areTimesOverlapping(startTime, endTime, sessStart, sessEnd)) {
        return {
          isAvailable: false,
          reason: `Trainer has an overlapping session in batch "${sess.batchName || sess.batchId}" (Class #${sess.classNumber || 1}, ${sessStart} - ${sessEnd}).`,
          conflictType: "SESSION_OVERLAP",
          conflictingSession: sess,
        };
      }
    }

    // 6. Check assigned batches where a scheduled batch operates during this slot
    const assignedBatches = await Batch.find({
      trainerIds: trainerId,
      status: "Active",
    }).lean();

    if (assignedBatches.length > 0 && date && typeof date === "string" && date.includes("-")) {
      const [y, m, d] = date.split("-").map(Number);
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
        new Date(y, m - 1, d).getDay()
      ];

      for (const b of assignedBatches) {
        const operatingDays = Array.isArray(b.daysList) && b.daysList.length > 0
          ? b.daysList
          : (b.daysPattern === "TTS"
              ? ["Tuesday", "Thursday", "Saturday"]
              : ["Monday", "Wednesday", "Friday"]);

        const matchesDay = operatingDays.some(
          (od) => od.toLowerCase() === dayName.toLowerCase()
        );

        if (matchesDay) {
          const bStart = b.startTime || "06:00 AM";
          const bEnd = b.endTime || "07:00 AM";

          if (areTimesOverlapping(startTime, endTime, bStart, bEnd)) {
            // Check if this batch already had a session record checked above
            const hasCheckedSession = candidateSessions.some((cs) => cs.batchId === b.id);
            if (!hasCheckedSession) {
              return {
                isAvailable: false,
                reason: `Trainer is scheduled for regular batch "${b.name}" (${bStart} - ${bEnd}) on ${dayName}s.`,
                conflictType: "BATCH_SCHEDULE_OVERLAP",
                conflictingBatch: b,
              };
            }
          }
        }
      }
    }

    return {
      isAvailable: true,
      trainer,
    };
  }

  /**
   * Evaluates all trainers in the system against a scheduled batch session
   * and returns eligible trainers vs unavailable trainers with conflict rationales.
   */
  async getEligibleSubstituteTrainers(sessionId) {
    if (!sessionId) {
      throw new BadRequestError("sessionId is required.");
    }

    const session = await Session.findOne({ id: sessionId }).lean();
    if (!session) {
      throw new NotFoundError(`Session "${sessionId}" not found.`);
    }

    const batch = await Batch.findOne({ id: session.batchId }).lean();
    const rawDate = session.sessionDate || session.date || session.displayDate || "";
    const sessionDate = normalizeDateStr(rawDate);
    const startTime = session.startTime || batch?.startTime || "06:00 AM";
    const endTime = session.endTime || batch?.endTime || "07:00 AM";
    // 1. Identify all trainers assigned to this batch
    const candidateBatchTrainerIds = new Set();
    if (Array.isArray(batch?.trainerIds)) {
      batch.trainerIds.forEach((id) => id && candidateBatchTrainerIds.add(id));
    }
    if (session.originalCoachId) candidateBatchTrainerIds.add(session.originalCoachId);
    if (session.coachId) candidateBatchTrainerIds.add(session.coachId);

    // Fetch assigned trainers dynamically from database records (registered and active)
    const assignedBatchTrainers = await Trainer.find({
      $or: [
        { id: { $in: Array.from(candidateBatchTrainerIds) } },
        { batchIds: batch?.id || session.batchId },
      ],
      isDeleted: { $ne: true },
      status: "Active",
    }).lean();

    // 2. Query TrainerLeave for approved leave records covering the exact scheduled session date
    const approvedLeaves = await TrainerLeave.find({
      trainerId: { $in: assignedBatchTrainers.map((t) => t.id) },
      status: { $in: [TRAINER_LEAVE_STATUS.APPROVED, "APPROVED", "Approved"] },
      leaveStartDate: { $lte: sessionDate },
      leaveEndDate: { $gte: sessionDate },
    }).lean();

    // 3. Build list of trainers requiring substitution (assigned trainers with approved leave)
    const trainersRequiringSubstitution = [];
    const trainersRequiringIds = new Set();

    for (const trn of assignedBatchTrainers) {
      const matchingLeave = approvedLeaves.find((l) => l.trainerId === trn.id);
      if (matchingLeave) {
        trainersRequiringIds.add(trn.id);
        const trnName = trn.name || `${trn.firstName || ""} ${trn.lastName || ""}`.trim() || trn.id;
        trainersRequiringSubstitution.push({
          id: trn.id,
          name: trnName,
          phone: trn.phone || "",
          email: trn.email || "",
          specialization: trn.specialization || "Faculty Coach",
          shift: trn.shift || "General",
          status: trn.status || "Active",
          leaveId: matchingLeave.id,
          leaveStartDate: matchingLeave.leaveStartDate,
          leaveEndDate: matchingLeave.leaveEndDate,
          leaveReason: matchingLeave.reason || "Approved Leave",
          totalDays: matchingLeave.totalDays || 1,
          leaveStatus: matchingLeave.status,
          isOriginalSessionCoach: session.originalCoachId === trn.id || session.coachId === trn.id,
        });
      }
    }

    // Default target original trainer ID
    const primaryTrainerId = session.originalCoachId || session.coachId || "";

    // 4. Fetch all active trainers from the database to validate genuine substitute availability
    // Showing only trainers registered by Admin through Trainer Management (not deleted, status: Active)
    const allTrainers = await Trainer.find({
      isDeleted: { $ne: true },
      status: "Active",
    }).sort({ name: 1, firstName: 1 }).lean();

    const eligibleTrainers = [];
    const unavailableTrainers = [];

    for (const trn of allTrainers) {
      const trnName = trn.name || `${trn.firstName || ""} ${trn.lastName || ""}`.trim() || trn.id;
      const trnId = trn.id;

      // If this trainer is one of the trainers on leave requiring substitution, they cannot substitute
      if (trainersRequiringIds.has(trnId)) {
        const matchingLeave = approvedLeaves.find((l) => l.trainerId === trnId);
        unavailableTrainers.push({
          id: trn.id,
          name: trnName,
          phone: trn.phone || "",
          email: trn.email || "",
          specialization: trn.specialization || "Faculty Coach",
          shift: trn.shift || "General",
          status: trn.status || "Active",
          isAvailable: false,
          conflictReason: `Assigned batch trainer on approved leave (${matchingLeave?.leaveStartDate || ""} to ${matchingLeave?.leaveEndDate || ""}); requires substitution.`,
          conflictType: "ON_APPROVED_LEAVE",
          isCurrentlyAssigned: session.substituteCoachId === trn.id,
        });
        continue;
      }

      const evalResult = await this.validateTrainerAvailability({
        trainerId: trnId,
        date: sessionDate,
        startTime,
        endTime,
        excludeSessionId: session.id,
        originalTrainerId: primaryTrainerId,
      });

      const trainerSummary = {
        id: trn.id,
        name: trnName,
        phone: trn.phone || "",
        email: trn.email || "",
        specialization: trn.specialization || "Functional Trainer",
        shift: trn.shift || "General",
        status: trn.status || "Active",
        isCurrentlyAssigned: session.substituteCoachId === trn.id,
      };

      if (evalResult.isAvailable) {
        eligibleTrainers.push({
          ...trainerSummary,
          isAvailable: true,
        });
      } else {
        unavailableTrainers.push({
          ...trainerSummary,
          isAvailable: false,
          conflictReason: evalResult.reason,
          conflictType: evalResult.conflictType,
          conflicts: [
            {
              type: evalResult.conflictType,
              reason: evalResult.reason,
            },
          ],
        });
      }
    }

    return {
      session: {
        id: session.id,
        classNumber: session.classNumber,
        className: session.className || session.subject,
        sessionDate: session.sessionDate || sessionDate,
        displayDate: session.displayDate,
        startTime,
        endTime,
        timing: session.timing || `${startTime} - ${endTime}`,
        originalCoachId: primaryTrainerId,
        originalCoachName: session.originalCoachName || session.coachName || "Assigned Coach",
        substituteCoachId: session.substituteCoachId || null,
        substituteCoachName: session.substituteCoachName || "",
        isSubstituted: Boolean(session.isSubstituted),
        substitutionReason: session.substitutionReason || "",
        substitutionNotes: session.substitutionNotes || "",
        substitutionStatus: session.substitutionStatus || "NONE",
      },
      batch: {
        id: batch?.id || session.batchId,
        name: batch?.name || session.batchName || "Batch",
      },
      trainersRequiringSubstitution,
      hasTrainersRequiringSubstitution: trainersRequiringSubstitution.length > 0,
      eligibleTrainers,
      unavailableTrainers,
      totalEligible: eligibleTrainers.length,
      totalUnavailable: unavailableTrainers.length,
      totalRequiringSubstitution: trainersRequiringSubstitution.length,
    };
  }
}

module.exports = new SubstituteValidationService();
module.exports.parseTimeToMinutes = parseTimeToMinutes;
module.exports.areTimesOverlapping = areTimesOverlapping;
