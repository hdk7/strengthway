"use strict";

const batchService = require("./batch.service");
const batchAssignmentService = require("./batchAssignment.service");
const substituteTrainerService = require("./substituteTrainer.service");
const { success, created } = require("../../shared/response");

// ─── Batches ──────────────────────────────────────────────────────────────────
async function getAll(req, res, next) {
  try {
    const { status } = req.query;
    const batches = await batchService.getAll({
      status,
      scopedBatchIds: req.scopedBatchIds ?? null,
    });
    return success(res, batches, "Batches retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const batch = await batchService.getById(req.params.id);
    return success(res, batch, "Batch retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const batch = await batchService.create(req.body);
    return created(res, batch, "Batch created successfully.");
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const batch = await batchService.update(req.params.id, req.body);
    return success(res, batch, "Batch updated successfully.");
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await batchService.delete(req.params.id);
    return success(res, result, "Batch deleted successfully.");
  } catch (err) {
    next(err);
  }
}

async function enroll(req, res, next) {
  try {
    const batch = await batchService.enrollMember(req.params.id, req.body.memberId);
    return success(res, batch, "Member enrolled in batch successfully.");
  } catch (err) {
    next(err);
  }
}

async function unenroll(req, res, next) {
  try {
    const batch = await batchService.unenrollMember(req.params.id, req.body.memberId);
    return success(res, batch, "Member unenrolled from batch successfully.");
  } catch (err) {
    next(err);
  }
}

async function syncTrainers(req, res, next) {
  try {
    const batch = await batchService.syncTrainers(req.params.id, req.body.trainerIds);
    return success(res, batch, "Batch trainers synchronized successfully.");
  } catch (err) {
    next(err);
  }
}

async function toggleStatus(req, res, next) {
  try {
    const batch = await batchService.toggleStatus(req.params.id);
    return success(res, batch, `Batch status changed to ${batch.status}.`);
  } catch (err) {
    next(err);
  }
}

// ─── Coach Shifts ─────────────────────────────────────────────────────────────
async function getCoachShifts(req, res, next) {
  try {
    const shifts = await batchService.getCoachShifts();
    return success(res, shifts, "Coach shift matrix retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function toggleCoachShift(req, res, next) {
  try {
    const { coachId, slotKey } = req.body;
    const coach = await batchService.toggleCoachShift(coachId, slotKey);
    return success(res, coach, "Coach shift slot toggled successfully.");
  } catch (err) {
    next(err);
  }
}

// ─── Scheduled Classes ────────────────────────────────────────────────────────
async function getAllClasses(req, res, next) {
  try {
    const classes = await batchService.getAllClasses();
    return success(res, classes, "All scheduled classes retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getClassesByBatch(req, res, next) {
  try {
    const classes = await batchService.getClassesByBatch(req.params.id);
    return success(res, classes, "Batch scheduled classes retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function createClass(req, res, next) {
  try {
    const cls = await batchService.createClass(req.params.id, req.body);
    return created(res, cls, "Scheduled class created successfully.");
  } catch (err) {
    next(err);
  }
}

async function updateClass(req, res, next) {
  try {
    const classId = req.params.classId || req.params.id;
    const cls = await batchService.updateClass(classId, req.body);
    return success(res, cls, "Scheduled class updated successfully.");
  } catch (err) {
    next(err);
  }
}

async function deleteClass(req, res, next) {
  try {
    const classId = req.params.classId || req.params.id;
    const result = await batchService.deleteClass(classId);
    return success(res, result, "Scheduled class deleted successfully.");
  } catch (err) {
    next(err);
  }
}

// ─── Batch Assignments & Transfers ───────────────────────────────────────────
async function transferMember(req, res, next) {
  try {
    const result = await batchAssignmentService.executePermanentTransfer({
      ...req.body,
      transferredBy: req.user?.name || req.body.transferredBy || "Admin",
    });
    return success(res, result, "Member transferred to new batch successfully.");
  } catch (err) {
    next(err);
  }
}

async function createFlexAssignment(req, res, next) {
  try {
    const result = await batchAssignmentService.createFlexibleAssignment({
      ...req.body,
      transferredBy: req.user?.name || req.body.transferredBy || "Admin",
    });
    return created(res, result, "Flexible batch pass created successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMemberAssignments(req, res, next) {
  try {
    const data = await batchAssignmentService.getMemberAssignments(req.params.memberId);
    return success(res, data, "Member batch assignments retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function revokeFlexAssignment(req, res, next) {
  try {
    const assignmentId = req.params.assignmentId || req.params.id;
    const result = await batchAssignmentService.revokeFlexibleAssignment(
      assignmentId,
      req.body?.reason,
      req.user?.name || req.body?.revokedBy || "Admin"
    );
    return success(res, result, "Flexible assignment revoked successfully.");
  } catch (err) {
    next(err);
  }
}

// ─── Month-Wise Category Tracking & Capacity ──────────────────────────────────
async function getMonthTracking(req, res, next) {
  try {
    const { month } = req.query;
    const tracking = await batchService.getBatchMonthTracking(req.params.id, month);
    return success(res, tracking, "Batch month tracking retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getCapacityCheck(req, res, next) {
  try {
    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const capacity = await batchAssignmentService.calculateBatchCapacityOnDate(
      req.params.id,
      targetDate
    );
    return success(res, capacity, "Batch capacity calculated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getEffectiveAttendees(req, res, next) {
  try {
    const targetDate = req.query.date || new Date().toISOString().slice(0, 10);
    const attendees = await batchAssignmentService.getBatchEffectiveAttendeesForDate(
      req.params.id,
      targetDate
    );
    return success(res, attendees, "Effective batch attendees retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

// ─── Batch Audit Trail & Rejoining Processing ─────────────────────────────────
async function getBatchAuditLogs(req, res, next) {
  try {
    const logs = await batchAssignmentService.getBatchAuditLogs(req.params.id, req.query);
    return success(res, logs, "Batch audit logs retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function processExpiredFlexAssignments(req, res, next) {
  try {
    const result = await batchAssignmentService.processExpiredFlexAssignments(
      req.body?.referenceDate || req.query?.referenceDate
    );
    return success(res, result, "Expired flex assignments processed successfully.");
  } catch (err) {
    next(err);
  }
}

// ─── Substitute Trainer Management ───────────────────────────────────────────
async function getEligibleSubstitutes(req, res, next) {
  try {
    const sessionId = req.params.sessionId;
    const data = await substituteTrainerService.getEligibleSubstitutes(sessionId);
    return success(res, data, "Eligible substitute trainers retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function assignSubstitute(req, res, next) {
  try {
    const sessionId = req.params.sessionId;
    const performedBy = req.user?.name || req.body?.performedBy || "Admin";
    const result = await substituteTrainerService.assignSubstitute({
      sessionId,
      originalTrainerId: req.body?.originalTrainerId,
      substituteTrainerId: req.body?.substituteTrainerId,
      reason: req.body?.reason,
      notes: req.body?.notes,
      proceedWithoutSubstitute: Boolean(req.body?.proceedWithoutSubstitute),
      idempotencyKey: req.body?.idempotencyKey || req.headers["x-idempotency-key"] || "",
      performedBy,
    });
    const message = result.proceededWithoutSubstitute
      ? "Proceeding without assigning substitute trainer."
      : "Substitute trainer assigned successfully.";
    return success(res, result, message);
  } catch (err) {
    next(err);
  }
}

async function cancelSubstitute(req, res, next) {
  try {
    const sessionId = req.params.sessionId;
    const performedBy = req.user?.name || req.body?.performedBy || "Admin";
    const result = await substituteTrainerService.cancelSubstitute({
      sessionId,
      cancellationReason: req.body?.cancellationReason,
      performedBy,
    });
    return success(res, result, "Substitute assignment cancelled successfully. Primary trainer restored.");
  } catch (err) {
    next(err);
  }
}

async function getBatchSubstituteAudits(req, res, next) {
  try {
    const batchId = req.params.id;
    const data = await substituteTrainerService.getBatchSubstitutionAuditLogs(batchId, req.query);
    return success(res, data, "Batch substitution audit logs retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getSessionSubstituteAudits(req, res, next) {
  try {
    const sessionId = req.params.sessionId;
    const data = await substituteTrainerService.getSessionSubstitutionHistory(sessionId);
    return success(res, data, "Session substitution audit history retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  enroll,
  unenroll,
  syncTrainers,
  toggleStatus,
  getCoachShifts,
  toggleCoachShift,
  getAllClasses,
  getClassesByBatch,
  createClass,
  updateClass,
  deleteClass,
  transferMember,
  createFlexAssignment,
  getMemberAssignments,
  revokeFlexAssignment,
  getMonthTracking,
  getCapacityCheck,
  getEffectiveAttendees,
  getBatchAuditLogs,
  processExpiredFlexAssignments,
  getEligibleSubstitutes,
  assignSubstitute,
  cancelSubstitute,
  getBatchSubstituteAudits,
  getSessionSubstituteAudits,
};

