"use strict";

const router = require("express").Router();
const ctrl = require("./batch.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin, requireTrainer } = require("../../middleware/role.middleware");
const { scopeBatchQuery, scopeBatchDoc, scopeMemberDoc } = require("../../middleware/scope.middleware");
const {
  createBatchSchema,
  updateBatchSchema,
  enrollMemberSchema,
  syncTrainersSchema,
  toggleCoachSlotSchema,
  createClassSchema,
  updateClassSchema,
  permanentTransferSchema,
  flexibleAssignmentSchema,
  revokeFlexAssignmentSchema,
  assignSubstituteSchema,
  cancelSubstituteSchema,
} = require("./batch.schema");

// ─── Literal Routes (Must precede /:id) ───────────────────────────────────────
router.get("/coach-shifts", authenticate, ctrl.getCoachShifts);
router.patch("/coach-shifts/toggle", authenticate, requireAdmin, validate(toggleCoachSlotSchema), ctrl.toggleCoachShift);

// Class catalogue list: Admin & Trainer only (Members restricted)
router.get("/classes", authenticate, requireTrainer, ctrl.getAllClasses);
router.put("/classes/:classId", authenticate, requireAdmin, validate(updateClassSchema), ctrl.updateClass);
router.delete("/classes/:classId", authenticate, requireAdmin, ctrl.deleteClass);

// ─── Batch Assignments & Transfers Literal Routes ─────────────────────────────
router.post("/assignments/transfer", authenticate, requireAdmin, validate(permanentTransferSchema), ctrl.transferMember);
router.post("/assignments/flex", authenticate, requireAdmin, validate(flexibleAssignmentSchema), ctrl.createFlexAssignment);
router.post("/assignments/process-expired-flex", authenticate, ctrl.processExpiredFlexAssignments);
router.get("/assignments/member/:memberId", authenticate, (req, res, next) => {
  req.params.id = req.params.memberId;
  next();
}, scopeMemberDoc, ctrl.getMemberAssignments);
router.delete("/assignments/:assignmentId/revoke", authenticate, requireAdmin, validate(revokeFlexAssignmentSchema), ctrl.revokeFlexAssignment);
router.delete("/assignments/:id/revoke", authenticate, requireAdmin, validate(revokeFlexAssignmentSchema), ctrl.revokeFlexAssignment);
router.post("/assignments/:assignmentId/revoke", authenticate, requireAdmin, validate(revokeFlexAssignmentSchema), ctrl.revokeFlexAssignment);
router.post("/assignments/:id/revoke", authenticate, requireAdmin, validate(revokeFlexAssignmentSchema), ctrl.revokeFlexAssignment);

// ─── Direct Session Substitute Routes (Literal routes preceding /:id) ────────
router.get("/sessions/:sessionId/substitutes/eligible", authenticate, requireAdmin, ctrl.getEligibleSubstitutes);
router.post("/sessions/:sessionId/substitute", authenticate, requireAdmin, validate(assignSubstituteSchema), ctrl.assignSubstitute);
router.delete("/sessions/:sessionId/substitute", authenticate, requireAdmin, validate(cancelSubstituteSchema), ctrl.cancelSubstitute);
router.post("/sessions/:sessionId/substitute/cancel", authenticate, requireAdmin, validate(cancelSubstituteSchema), ctrl.cancelSubstitute);
router.get("/sessions/:sessionId/substitute-audits", authenticate, requireAdmin, ctrl.getSessionSubstituteAudits);

// ─── Batches Core ─────────────────────────────────────────────────────────────
// GET /api/v1/batches — Admin sees all; Trainer sees assigned; Member sees enrolled
router.get("/", authenticate, scopeBatchQuery, ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createBatchSchema), ctrl.create);
router.get("/:id", authenticate, scopeBatchDoc, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateBatchSchema), ctrl.update);
router.patch("/:id", authenticate, requireAdmin, validate(updateBatchSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

// ─── Batch Sub-routes (Admin only) ───────────────────────────────────────────
router.patch("/:id/enroll", authenticate, requireAdmin, validate(enrollMemberSchema), ctrl.enroll);
router.patch("/:id/unenroll", authenticate, requireAdmin, validate(enrollMemberSchema), ctrl.unenroll);
router.patch("/:id/sync-trainers", authenticate, requireAdmin, validate(syncTrainersSchema), ctrl.syncTrainers);
router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);

// ─── Month-Wise Tracking, Capacity & Audit Trail Sub-routes ───────────────────
router.get("/:id/month-tracking", authenticate, scopeBatchDoc, ctrl.getMonthTracking);
router.get("/:id/capacity-check", authenticate, scopeBatchDoc, ctrl.getCapacityCheck);
router.get("/:id/effective-attendees", authenticate, scopeBatchDoc, ctrl.getEffectiveAttendees);
router.get("/:id/audit-logs", authenticate, scopeBatchDoc, ctrl.getBatchAuditLogs);
router.get("/:id/audit-history", authenticate, scopeBatchDoc, ctrl.getBatchAuditLogs);
router.get("/:id/substitute-audits", authenticate, scopeBatchDoc, ctrl.getBatchSubstituteAudits);
router.get("/:id/sessions/:sessionId/substitutes/eligible", authenticate, requireAdmin, ctrl.getEligibleSubstitutes);
router.get("/:id/sessions/:sessionId/eligible-substitutes", authenticate, requireAdmin, ctrl.getEligibleSubstitutes);
router.post("/:id/sessions/:sessionId/substitute", authenticate, requireAdmin, validate(assignSubstituteSchema), ctrl.assignSubstitute);
router.delete("/:id/sessions/:sessionId/substitute", authenticate, requireAdmin, validate(cancelSubstituteSchema), ctrl.cancelSubstitute);
router.post("/:id/sessions/:sessionId/substitute/cancel", authenticate, requireAdmin, validate(cancelSubstituteSchema), ctrl.cancelSubstitute);
router.get("/:id/sessions/:sessionId/substitute-history", authenticate, scopeBatchDoc, ctrl.getSessionSubstituteAudits);

// ─── Batch Scheduled Classes Sub-routes ───────────────────────────────────────
router.get("/:id/classes", authenticate, scopeBatchDoc, ctrl.getClassesByBatch);
router.post("/:id/classes", authenticate, requireAdmin, validate(createClassSchema), ctrl.createClass);
router.put("/:id/classes/:classId", authenticate, requireAdmin, validate(updateClassSchema), ctrl.updateClass);
router.delete("/:id/classes/:classId", authenticate, requireAdmin, ctrl.deleteClass);

// ─── Batch Reusable Classes Scheduling, Shuffling & History Sub-routes ────────
const batchScheduleCtrl = require("../classes/batchSchedule.controller");
router.get("/:id/schedule", authenticate, scopeBatchDoc, batchScheduleCtrl.getBatchSchedule);
router.post("/:id/schedule/assign-classes", authenticate, requireAdmin, batchScheduleCtrl.assignClasses);
router.post("/:id/schedule/shuffle", authenticate, requireAdmin, batchScheduleCtrl.shuffleClasses);
router.get("/:id/schedule/history", authenticate, scopeBatchDoc, batchScheduleCtrl.getScheduleHistory);

module.exports = router;

