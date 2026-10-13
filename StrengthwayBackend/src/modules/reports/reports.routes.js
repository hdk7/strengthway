"use strict";

const router = require("express").Router();
const ctrl = require("./reports.controller");
const { authenticate } = require("../../middleware/auth.middleware");

// ─── Reports Endpoints (Authenticated & Role-Scoped) ─────────────────────────
router.get("/monthly-batch-summary", authenticate, ctrl.getMonthlyBatchReport);
router.get("/monthly-member-summary", authenticate, ctrl.getMonthlyMemberReport);
router.get("/monthly-trainer-summary", authenticate, ctrl.getMonthlyTrainerReport);
router.get("/monthly-class-summary", authenticate, ctrl.getMonthlyClassReport);

module.exports = router;
