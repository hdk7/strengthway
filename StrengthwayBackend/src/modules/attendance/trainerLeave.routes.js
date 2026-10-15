"use strict";

const router = require("express").Router();
const ctrl = require("./trainerLeave.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin, requireTrainer } = require("../../middleware/role.middleware");

// ─── Trainer Leave Requests Endpoints ─────────────────────────────────────────
// Members forbidden; Trainers can submit & view own; Admin has full access
router.post("/", authenticate, requireTrainer, ctrl.createLeaveRequest);
router.get("/", authenticate, requireTrainer, ctrl.getLeaveRequests);
router.get("/monthly-summary", authenticate, requireTrainer, ctrl.getMonthlyLeaveSummary);
router.get("/annual-summary", authenticate, requireTrainer, ctrl.getAnnualLeaveSummary);
router.get("/:id", authenticate, requireTrainer, ctrl.getLeaveRequestById);
router.get("/:id/affected-sessions", authenticate, requireTrainer, ctrl.getLeaveAffectedSessions);
router.patch("/:id/status", authenticate, requireAdmin, ctrl.updateLeaveStatus);
router.delete("/:id", authenticate, requireTrainer, ctrl.cancelLeaveRequest);
router.post("/:id/cancel", authenticate, requireTrainer, ctrl.cancelLeaveRequest);

module.exports = router;
