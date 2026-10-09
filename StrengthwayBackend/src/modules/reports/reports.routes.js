"use strict";

const router = require("express").Router();
const ctrl = require("./reports.controller");

// ─── Reports Endpoints ────────────────────────────────────────────────────────
router.get("/monthly-batch-summary", ctrl.getMonthlyBatchReport);
router.get("/monthly-member-summary", ctrl.getMonthlyMemberReport);
router.get("/monthly-trainer-summary", ctrl.getMonthlyTrainerReport);
router.get("/monthly-class-summary", ctrl.getMonthlyClassReport);

module.exports = router;
