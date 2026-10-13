"use strict";

const router = require("express").Router();
const ctrl = require("./attendance.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { scopeBatchDoc, scopeMemberDoc } = require("../../middleware/scope.middleware");
const {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  createTrainerLogSchema,
} = require("./attendance.schema");

// ─── Attendance Core Endpoints (Admin only - biometrics / manual override) ────
router.post("/mark", authenticate, requireAdmin, validate(markAttendanceSchema), ctrl.markAttendance);
router.post("/bulk-mark", authenticate, requireAdmin, validate(bulkMarkAttendanceSchema), ctrl.bulkMarkAttendance);

// ─── Attendance Query Endpoints ───────────────────────────────────────────────
// Grid: Scoped to Admin, assigned Trainer, or enrolled Member
router.get("/batch/:batchId", authenticate, (req, res, next) => {
  req.params.id = req.params.batchId;
  next();
}, scopeBatchDoc, ctrl.getBatchAttendanceGrid);

// Member attendance: Scoped to Admin, assigned Trainer, or Member's own profile
router.get("/member/:memberId", authenticate, (req, res, next) => {
  req.params.id = req.params.memberId;
  next();
}, scopeMemberDoc, ctrl.getMemberAttendance);

// Attendance query: Scoped in controller (Admin all; Trainer assigned; Member self)
router.get("/", authenticate, ctrl.getAttendanceRecords);

// ─── Trainer Logs Endpoints ───────────────────────────────────────────────────
// Trainer log recording: Admin only (biometric log / admin approval)
router.post("/trainer-logs", authenticate, requireAdmin, validate(createTrainerLogSchema), ctrl.recordTrainerLog);
// Trainer logs query: Admin all; Trainer self; Member forbidden
router.get("/trainer-logs", authenticate, ctrl.getAllTrainerLogs);
router.get("/trainer-logs/:trainerId", authenticate, ctrl.getTrainerLogs);

// ─── Trainer Leave Policy Endpoints ──────────────────────────────────────────
router.get("/leave-policy", authenticate, ctrl.getTrainerLeavePolicy);
router.put("/leave-policy", authenticate, requireAdmin, ctrl.saveTrainerLeavePolicy);
router.post("/leave-policy", authenticate, requireAdmin, ctrl.saveTrainerLeavePolicy);
router.post("/leave-policy/validate", authenticate, ctrl.validateTrainerLeaveNotice);

module.exports = router;

