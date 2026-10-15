"use strict";

const mongoose = require("mongoose");
const Session = require("../schedules/session.model");
const Batch = require("./batch.model");
const Trainer = require("../trainers/trainer.model");
const TrainerLeave = require("../attendance/trainerLeave.model");
const BatchSubstituteAudit = require("./batchSubstituteAudit.model");
const substituteValidationService = require("./substituteValidation.service");
const { generateBatchSubstituteAuditId, generateAssignmentTransactionId } = require("../../shared/idGenerator");
const { SUBSTITUTION_REASON, SUBSTITUTION_STATUS, SUBSTITUTION_ACTION, TRAINER_LEAVE_STATUS } = require("../../shared/constants");
const { BadRequestError, NotFoundError } = require("../../shared/apiError");

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

function normalizeReason(r) {
  if (!r) return "";
  const lower = String(r).trim().toLowerCase();
  if (lower === "leave") return "Leave";
  if (lower === "absent") return "Absent";
  if (lower === "emergency") return "Emergency";
  if (lower === "other") return "Other";
  return r;
}

class SubstituteTrainerService {
  /**
   * Retrieves eligible substitute trainers for a specific scheduled session.
   */
  async getEligibleSubstitutes(sessionId) {
    return substituteValidationService.getEligibleSubstituteTrainers(sessionId);
  }

  /**
   * Assigns, modifies, or optionally proceeds without a substitute trainer for a scheduled session.
   * Enforces backend availability validation, approved leave verification, idempotency, and audit logging.
   */
  async assignSubstitute({
    sessionId,
    originalTrainerId,
    substituteTrainerId,
    reason,
    notes = "",
    performedBy = "Admin",
    proceedWithoutSubstitute = false,
    idempotencyKey = "",
  }) {
    if (!sessionId) {
      throw new BadRequestError("sessionId is required.");
    }

    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      throw new NotFoundError(`Scheduled session "${sessionId}" not found.`);
    }

    const batch = await Batch.findOne({ id: session.batchId }).lean();
    const batchName = batch?.name || session.batchName || "Batch";
    const effectiveSessionDate = normalizeDateStr(session.sessionDate || session.date) || new Date().toISOString().slice(0, 10);

    // Identify candidate trainers assigned to this batch
    const candidateBatchTrainerIds = new Set();
    if (Array.isArray(batch?.trainerIds)) {
      batch.trainerIds.forEach((id) => id && candidateBatchTrainerIds.add(id));
    }
    if (session.originalCoachId) candidateBatchTrainerIds.add(session.originalCoachId);
    if (session.coachId) candidateBatchTrainerIds.add(session.coachId);

    // Fetch batch trainers from DB
    const assignedBatchTrainers = await Trainer.find({
      $or: [
        { id: { $in: Array.from(candidateBatchTrainerIds) } },
        { batchIds: session.batchId },
      ],
      isDeleted: false,
    }).lean();

    // Determine target original trainer requiring substitution
    let targetOriginalTrainerId = originalTrainerId || session.originalCoachId || session.coachId || "";

    // ── Option A: Admin decides to proceed without a substitute ──────────────
    if (proceedWithoutSubstitute) {
      const prevDetails = {
        isSubstituted: session.isSubstituted,
        originalCoachId: session.originalCoachId,
        substituteCoachId: session.substituteCoachId,
        substituteCoachName: session.substituteCoachName,
        substitutionStatus: session.substitutionStatus,
      };

      const auditId = generateBatchSubstituteAuditId();
      const transactionId = generateAssignmentTransactionId("SUB");

      // Check for idempotency
      if (idempotencyKey) {
        const existingAudit = await BatchSubstituteAudit.findOne({ idempotencyKey }).lean();
        if (existingAudit) {
          return {
            success: true,
            proceededWithoutSubstitute: true,
            session,
            audit: existingAudit,
          };
        }
      }

      const effectiveReason = normalizeReason(reason) || "Other";

      const originalTrainerDoc = targetOriginalTrainerId
        ? await Trainer.findOne({ id: targetOriginalTrainerId }).lean()
        : null;
      const effectiveOriginalName = originalTrainerDoc?.name || session.originalCoachName || session.coachName || "Assigned Coach";

      // Reset session substitution state if previously substituted
      session.isSubstituted = false;
      session.coachId = targetOriginalTrainerId || session.coachId;
      session.coachName = effectiveOriginalName;
      session.substituteCoachId = null;
      session.substituteCoachName = "";
      session.substitutionStatus = "NONE";
      session.substitutionReason = effectiveReason;
      session.substitutionNotes = notes || "";
      await session.save();

      const auditRecord = await BatchSubstituteAudit.create({
        id: auditId,
        transactionId,
        batchId: session.batchId,
        batchName,
        sessionId: session.id,
        sessionDate: effectiveSessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        timing: session.timing,
        classNumber: session.classNumber,
        className: session.className || session.subject,
        originalTrainerId: targetOriginalTrainerId || session.coachId,
        originalTrainerName: effectiveOriginalName,
        substituteTrainerId: "",
        substituteTrainerName: "None (Floor Handled)",
        reason: reason || "Administrative Decision",
        notes: notes || "Admin decided existing or floor trainers can handle the session without a designated substitute.",
        actionType: SUBSTITUTION_ACTION.PROCEEDED_WITHOUT_SUBSTITUTE,
        substitutionStatus: "Proceeded Without Substitute",
        performedBy,
        performedAt: new Date(),
        previousDetails: prevDetails,
        updatedDetails: {
          isSubstituted: false,
          substituteCoachId: null,
          substituteCoachName: "",
        },
        idempotencyKey,
      });

      return {
        success: true,
        proceededWithoutSubstitute: true,
        session,
        audit: auditRecord.toObject ? auditRecord.toObject() : auditRecord,
      };
    }

    // ── Option B: Assign or Reassign a Substitute Trainer ────────────────────
    if (!substituteTrainerId) {
      throw new BadRequestError("Substitute Trainer ID is required.");
    }

    // Check all assigned batch trainers who have approved leave covering this session
    const approvedLeaves = await TrainerLeave.find({
      trainerId: { $in: assignedBatchTrainers.map((t) => t.id) },
      status: { $in: [TRAINER_LEAVE_STATUS.APPROVED, "APPROVED", "Approved"] },
      leaveStartDate: { $lte: effectiveSessionDate },
      leaveEndDate: { $gte: effectiveSessionDate },
    }).lean();

    if (approvedLeaves.length === 0) {
      throw new BadRequestError(
        `No trainer assigned to batch "${batchName}" has approved leave covering this session on ${effectiveSessionDate}. Substitute assignment is not allowed.`
      );
    }

    // If targetOriginalTrainerId was not explicitly chosen or is invalid
    if (!targetOriginalTrainerId || !approvedLeaves.some((l) => l.trainerId === targetOriginalTrainerId)) {
      if (approvedLeaves.length === 1) {
        targetOriginalTrainerId = approvedLeaves[0].trainerId;
      } else {
        throw new BadRequestError(
          `Multiple trainers on leave for this class. Please select which trainer requires a substitute.`
        );
      }
    }

    // Validate that targetOriginalTrainerId has approved leave covering this session date
    const targetLeave = approvedLeaves.find((l) => l.trainerId === targetOriginalTrainerId);
    if (!targetLeave) {
      throw new BadRequestError(
        `Trainer "${targetOriginalTrainerId}" does not have an approved leave covering session date ${effectiveSessionDate}.`
      );
    }

    // Prevent assigning the trainer on leave as their own substitute
    if (substituteTrainerId === targetOriginalTrainerId) {
      throw new BadRequestError("Substitute trainer cannot be the same trainer who requires substitution.");
    }

    const effectiveReason = normalizeReason(reason) || "Leave";
    const validReasons = Object.values(SUBSTITUTION_REASON);
    if (!validReasons.includes(effectiveReason)) {
      throw new BadRequestError(
        `Invalid substitution reason "${reason}". Allowed values: ${validReasons.join(", ")}.`
      );
    }

    // Check idempotency key to prevent duplicate audit entries on rapid retry
    if (idempotencyKey) {
      const existingAudit = await BatchSubstituteAudit.findOne({ idempotencyKey }).lean();
      if (existingAudit && session.substituteCoachId === substituteTrainerId) {
        return {
          success: true,
          session,
          audit: existingAudit,
          isDuplicate: true,
        };
      }
    }

    // Prevent duplicate substitute assignment if already assigned to the same substitute with same reason
    if (
      session.isSubstituted &&
      session.substituteCoachId === substituteTrainerId &&
      session.originalCoachId === targetOriginalTrainerId &&
      session.substitutionReason === effectiveReason &&
      session.substitutionStatus !== "CANCELLED"
    ) {
      return {
        success: true,
        session,
        message: "Trainer is already assigned as substitute for this session.",
      };
    }

    // 1. Re-validate substitute trainer availability on the backend at confirmation time
    const availability = await substituteValidationService.validateTrainerAvailability({
      trainerId: substituteTrainerId,
      date: effectiveSessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      excludeSessionId: session.id,
      originalTrainerId: targetOriginalTrainerId,
    });

    if (!availability.isAvailable) {
      throw new BadRequestError(
        `Cannot assign substitute trainer: ${availability.reason || "Trainer is unavailable."}`
      );
    }

    const originalTrainerDoc = await Trainer.findOne({ id: targetOriginalTrainerId }).lean();
    const originalTrainerName =
      originalTrainerDoc?.name ||
      `${originalTrainerDoc?.firstName || ""} ${originalTrainerDoc?.lastName || ""}`.trim() ||
      session.originalCoachName ||
      session.coachName ||
      targetOriginalTrainerId;

    const substituteTrainer = availability.trainer || (await Trainer.findOne({ id: substituteTrainerId }).lean());
    const substituteName =
      substituteTrainer?.name ||
      `${substituteTrainer?.firstName || ""} ${substituteTrainer?.lastName || ""}`.trim() ||
      substituteTrainerId;

    const previousDetails = {
      originalCoachId: session.originalCoachId || session.coachId,
      originalCoachName: session.originalCoachName || session.coachName,
      substituteCoachId: session.substituteCoachId,
      substituteCoachName: session.substituteCoachName,
      isSubstituted: session.isSubstituted,
      substitutionReason: session.substitutionReason,
      substitutionNotes: session.substitutionNotes,
      substitutionStatus: session.substitutionStatus,
    };

    const isModification = Boolean(session.isSubstituted && session.substituteCoachId);
    const actionType = isModification ? SUBSTITUTION_ACTION.MODIFIED : SUBSTITUTION_ACTION.ASSIGNED;

    // Determine substitution status: ACTIVE if session is today, else SCHEDULED
    const todayStr = new Date().toISOString().slice(0, 10);
    const subStatus = effectiveSessionDate === todayStr ? SUBSTITUTION_STATUS.ACTIVE : SUBSTITUTION_STATUS.SCHEDULED;

    // Set substitution details on session (primary batch.trainerIds is NOT touched)
    session.originalCoachId = targetOriginalTrainerId;
    session.originalCoachName = originalTrainerName;
    session.substituteCoachId = substituteTrainerId;
    session.substituteCoachName = substituteName;
    session.coachId = substituteTrainerId;
    session.coachName = substituteName;
    session.isSubstituted = true;
    session.substitutionReason = effectiveReason;
    session.substitutionNotes = notes || "";
    session.substitutionStatus = subStatus;
    session.substitutionAssignedBy = performedBy;
    session.substitutionAssignedAt = new Date();
    session.substitutionCancelledAt = null;
    session.substitutionCancelledBy = "";
    session.substitutionCancellationReason = "";

    await session.save();

    // Create Audit Log
    const auditId = generateBatchSubstituteAuditId();
    const transactionId = generateAssignmentTransactionId("SUB");

    const auditRecord = await BatchSubstituteAudit.create({
      id: auditId,
      transactionId,
      batchId: session.batchId,
      batchName,
      sessionId: session.id,
      sessionDate: effectiveSessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      timing: session.timing,
      classNumber: session.classNumber,
      className: session.className || session.subject,
      originalTrainerId: targetOriginalTrainerId,
      originalTrainerName,
      substituteTrainerId,
      substituteTrainerName: substituteName,
      reason: effectiveReason,
      notes,
      actionType,
      substitutionStatus: subStatus === SUBSTITUTION_STATUS.ACTIVE ? "Active" : "Scheduled",
      performedBy,
      performedAt: new Date(),
      previousDetails,
      updatedDetails: {
        originalCoachId: targetOriginalTrainerId,
        originalCoachName: originalTrainerName,
        substituteCoachId: substituteTrainerId,
        substituteCoachName: substituteName,
        substitutionReason: effectiveReason,
        substitutionStatus: subStatus,
      },
      idempotencyKey,
    });

    return {
      success: true,
      session,
      audit: auditRecord.toObject ? auditRecord.toObject() : auditRecord,
    };
  }

  /**
   * Cancels a substitute assignment and restores original trainer assignment for the session.
   */
  async cancelSubstitute({ sessionId, cancellationReason = "", performedBy = "Admin" }) {
    if (!sessionId) {
      throw new BadRequestError("sessionId is required.");
    }

    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      throw new NotFoundError(`Scheduled session "${sessionId}" not found.`);
    }

    if (!session.isSubstituted && !session.substituteCoachId) {
      throw new BadRequestError("This session does not currently have an active substitute assignment.");
    }

    const batch = await Batch.findOne({ id: session.batchId }).lean();
    const batchName = batch?.name || session.batchName || "Batch";

    const originalTrainerId = session.originalCoachId || session.coachId || "TRN-101";
    const originalTrainerName = session.originalCoachName || session.coachName || "Assigned Coach";
    const prevSubId = session.substituteCoachId;
    const prevSubName = session.substituteCoachName;
    const prevReason = session.substitutionReason;

    const previousDetails = {
      originalCoachId: originalTrainerId,
      originalCoachName: originalTrainerName,
      substituteCoachId: prevSubId,
      substituteCoachName: prevSubName,
      substitutionReason: prevReason,
      substitutionStatus: session.substitutionStatus,
      isSubstituted: true,
    };

    // Revert substitution state
    session.isSubstituted = false;
    session.coachId = originalTrainerId;
    session.coachName = originalTrainerName;
    session.substituteCoachId = null;
    session.substituteCoachName = "";
    session.substitutionStatus = SUBSTITUTION_STATUS.CANCELLED;
    session.substitutionCancelledBy = performedBy;
    session.substitutionCancelledAt = new Date();
    session.substitutionCancellationReason = cancellationReason || "Admin cancelled substitute assignment";

    await session.save();

    // Create Cancellation Audit Record
    const auditId = generateBatchSubstituteAuditId();
    const transactionId = generateAssignmentTransactionId("SUB");

    const auditRecord = await BatchSubstituteAudit.create({
      id: auditId,
      transactionId,
      batchId: session.batchId,
      batchName,
      sessionId: session.id,
      sessionDate: session.sessionDate || session.date || new Date().toISOString().slice(0, 10),
      startTime: session.startTime,
      endTime: session.endTime,
      timing: session.timing,
      classNumber: session.classNumber,
      className: session.className || session.subject,
      originalTrainerId,
      originalTrainerName,
      substituteTrainerId: prevSubId || "",
      substituteTrainerName: prevSubName || "",
      reason: prevReason || "Leave",
      notes: session.substitutionNotes || "",
      actionType: SUBSTITUTION_ACTION.CANCELLED,
      substitutionStatus: "Cancelled",
      performedBy,
      performedAt: new Date(),
      previousDetails,
      updatedDetails: {
        isSubstituted: false,
        substituteCoachId: null,
        substituteCoachName: "",
        substitutionStatus: "CANCELLED",
      },
      cancellationReason: cancellationReason || "Original trainer returned or substitute no longer required",
    });

    return {
      success: true,
      message: "Substitute assignment cancelled successfully. Primary trainer restored.",
      session,
      audit: auditRecord.toObject ? auditRecord.toObject() : auditRecord,
    };
  }

  /**
   * Retrieves substitution audit trail for an entire batch with filtering.
   */
  async getBatchSubstitutionAuditLogs(batchId, query = {}) {
    if (!batchId) {
      throw new BadRequestError("batchId is required.");
    }

    const filter = { batchId };

    if (query.sessionId) {
      filter.sessionId = query.sessionId;
    }

    if (query.status && query.status !== "ALL" && query.status !== "All") {
      filter.substitutionStatus = new RegExp(`^${query.status}$`, "i");
    }

    if (query.actionType && query.actionType !== "ALL" && query.actionType !== "All") {
      filter.actionType = query.actionType;
    }

    if (query.reason && query.reason !== "ALL" && query.reason !== "All") {
      filter.reason = query.reason;
    }

    if (query.startDate) {
      filter.sessionDate = { $gte: query.startDate };
    }

    if (query.endDate) {
      filter.sessionDate = filter.sessionDate || {};
      filter.sessionDate.$lte = query.endDate;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      const regex = new RegExp(s, "i");
      filter.$or = [
        { originalTrainerName: regex },
        { substituteTrainerName: regex },
        { reason: regex },
        { notes: regex },
        { className: regex },
        { sessionId: regex },
        { performedBy: regex },
        { transactionId: regex },
      ];
    }

    const logs = await BatchSubstituteAudit.find(filter)
      .sort({ performedAt: -1, createdAt: -1 })
      .lean();

    const normalizedLogs = logs.map((l) => ({
      ...l,
      action: l.actionType,
      originalCoachId: l.originalTrainerId,
      originalCoachName: l.originalTrainerName,
      substituteCoachId: l.substituteTrainerId,
      substituteCoachName: l.substituteTrainerName,
      sessionStartTime: l.startTime,
      sessionEndTime: l.endTime,
      sessionTopic: l.className,
      status: l.substitutionStatus,
    }));

    return {
      batchId,
      totalCount: normalizedLogs.length,
      logs: normalizedLogs,
      audits: normalizedLogs,
    };
  }

  /**
   * Retrieves substitution audit history for a specific session.
   */
  async getSessionSubstitutionHistory(sessionId) {
    if (!sessionId) {
      throw new BadRequestError("sessionId is required.");
    }

    const logs = await BatchSubstituteAudit.find({ sessionId })
      .sort({ performedAt: -1 })
      .lean();

    return {
      sessionId,
      totalCount: logs.length,
      logs,
    };
  }
}

module.exports = new SubstituteTrainerService();
