"use strict";

const express = require("express");
const dashboardController = require("./dashboard.controller");
const { authenticate } = require("../../middleware/auth.middleware");

const router = express.Router();

/**
 * @route   GET /api/v1/dashboard/admin
 * @desc    Fetch Admin operational & financial analytics
 * @access  Private (Admin / Staff)
 */
router.get("/admin", authenticate, (req, res, next) =>
  dashboardController.getAdminDashboard(req, res, next)
);

/**
 * @route   GET /api/v1/dashboard/trainer
 * @desc    Fetch Trainer personal schedule, student attendance & shift stats
 * @access  Private (Trainer / Admin)
 */
router.get("/trainer", authenticate, (req, res, next) =>
  dashboardController.getTrainerDashboard(req, res, next)
);

/**
 * @route   GET /api/v1/dashboard/member
 * @desc    Fetch Member personal schedule, attendance & plan validity
 * @access  Private (Member / Admin / Trainer)
 */
router.get("/member", authenticate, (req, res, next) =>
  dashboardController.getMemberDashboard(req, res, next)
);

module.exports = router;
