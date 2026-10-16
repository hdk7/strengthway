"use strict";

const router = require("express").Router();
const ctrl = require("./attendance.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const { scopeBatchDoc, scopeMemberDoc } = require("../../middleware/scope.middleware");
const {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  createTrainerLogSchema,
  trainerCheckInSchema,
  trainerCheckOutSchema,
  trainerAddAnotherSessionSchema,
  processAutoCheckoutSchema,
  adminCorrectContinuousSessionSchema,
  adminOverrideMemberSchema,
  adminOverrideTrainerSchema,
} = require("./attendance.schema");

// ─── Attendance Core Endpoints ───────────────────────────────────────────────
// Attendance Marking: Restricted strictly to Admin (Trainers cannot mark or edit member attendance)
router.post(
  "/mark",
  authenticate,
  requireAdmin,
  validate(markAttendanceSchema),
  ctrl.markAttendance
);
router.post(
  "/bulk-mark",
  authenticate,
  requireAdmin,
  validate(bulkMarkAttendanceSchema),
  ctrl.bulkMarkAttendance
);

// Process automatic member checkouts for expired windows
router.post(
  "/process-auto-checkouts",
  authenticate,
  requireAdmin,
  validate(processAutoCheckoutSchema),
  ctrl.processAutoCheckouts
);

// ─── Admin Attendance Overrides & Audit Trail ────────────────────────────────
router.post(
  "/admin/override-member",
  authenticate,
  requireAdmin,
  validate(adminOverrideMemberSchema),
  ctrl.adminOverrideMember
);
router.post(
  "/admin/override-trainer",
  authenticate,
  requireAdmin,
  validate(adminOverrideTrainerSchema),
  ctrl.adminOverrideTrainer
);
router.post(
  "/admin/correct-continuous-session",
  authenticate,
  requireAdmin,
  validate(adminCorrectContinuousSessionSchema),
  ctrl.adminCorrectContinuousSession
);
router.get(
  "/audit-logs",
  authenticate,
  requireAdmin,
  ctrl.getAttendanceAuditLogs
);

// ─── Attendance Query Endpoints ───────────────────────────────────────────────
// Grid: Scoped to Admin, assigned Trainer, or enrolled Member
router.get(
  "/batch/:batchId",
  authenticate,
  requirePermission("attendance", "view", "view_own"),
  (req, res, next) => {
    req.params.id = req.params.batchId;
    next();
  },
  scopeBatchDoc,
  ctrl.getBatchAttendanceGrid
);

// Member attendance: Scoped to Admin, assigned Trainer, or Member's own profile
router.get(
  "/member/:memberId",
  authenticate,
  requirePermission("attendance", "view", "view_own"),
  (req, res, next) => {
    req.params.id = req.params.memberId;
    next();
  },
  scopeMemberDoc,
  ctrl.getMemberAttendance
);

// Attendance query: Scoped in controller (Admin all; Trainer assigned; Member self)
router.get("/", authenticate, ctrl.getAttendanceRecords);

// ─── Trainer Check-In / Check-Out & Continuous Intervals ───────────────────────
// Trainer check-in (supports individual sessions and consecutive sessions continuous interval)
router.post(
  "/trainer-checkin",
  authenticate,
  validate(trainerCheckInSchema),
  ctrl.trainerCheckIn
);
router.post(
  "/trainer-checkout",
  authenticate,
  validate(trainerCheckOutSchema),
  ctrl.trainerCheckOut
);
router.post(
  "/trainer/add-another-session",
  authenticate,
  validate(trainerAddAnotherSessionSchema),
  ctrl.trainerAddAnotherSession
);
router.get(
  "/trainer-schedule/:trainerId",
  authenticate,
  ctrl.getTrainerDailySchedule
);
router.get(
  "/trainer-intervals",
  authenticate,
  ctrl.getTrainerIntervals
);

// ─── Trainer Logs Endpoints (Conducted Session Ledger) ─────────────────────────
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


