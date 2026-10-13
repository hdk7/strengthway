"use strict";

const reportsService = require("./reports.service");
const { success } = require("../../shared/response");

const rbacScope = require("../../shared/rbacScope");
const { ForbiddenError } = require("../../shared/apiError");

async function getMonthlyBatchReport(req, res, next) {
  try {
    if (req.user?.role === "member") {
      throw new ForbiddenError("Access denied. Members cannot access batch aggregate reports.");
    }

    const { month, batchId } = req.query;

    if (req.user?.role === "trainer" && batchId && batchId !== "ALL") {
      await rbacScope.assertCanAccessBatch(req.user, batchId);
    }

    const report = await reportsService.getMonthlyBatchReport(month, batchId);

    // If trainer requests all batches, scope to assigned batches
    if (req.user?.role === "trainer" && Array.isArray(report?.batches)) {
      const assignedBatches = await rbacScope.getTrainerAssignedBatchIds(req.user.trainerId);
      report.batches = report.batches.filter((b) => assignedBatches.includes(b.batchId));
    }

    return success(res, report, "Monthly batch report generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyMemberReport(req, res, next) {
  try {
    const { month, status } = req.query;
    const report = await reportsService.getMonthlyMemberReport(month, status);

    if (req.user?.role === "member") {
      // Member can only see their own attendance row
      if (Array.isArray(report?.members)) {
        report.members = report.members.filter((m) => m.memberId === req.user.memberId);
      }
    } else if (req.user?.role === "trainer") {
      // Trainer can only see assigned members
      const assignedIds = await rbacScope.getTrainerAssignedMemberIds(req.user.trainerId);
      if (Array.isArray(report?.members)) {
        report.members = report.members.filter((m) => assignedIds.includes(m.memberId));
      }
    }

    return success(res, report, "Monthly member report generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyTrainerReport(req, res, next) {
  try {
    if (req.user?.role === "member") {
      throw new ForbiddenError("Access denied. Members cannot access trainer activity reports.");
    }

    const { month } = req.query;
    const report = await reportsService.getMonthlyTrainerReport(month);

    if (req.user?.role === "trainer") {
      // Trainer can only see their own activity row
      if (Array.isArray(report?.trainers)) {
        report.trainers = report.trainers.filter((t) => t.trainerId === req.user.trainerId);
      }
    }

    return success(res, report, "Monthly trainer report generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyClassReport(req, res, next) {
  try {
    if (req.user?.role === "member") {
      throw new ForbiddenError("Access denied. Members cannot access class aggregate reports.");
    }

    const { month, scheduleId } = req.query;
    const report = await reportsService.getMonthlyClassReport(month, scheduleId);
    return success(res, report, "Monthly scheduled class report generated successfully.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMonthlyBatchReport,
  getMonthlyMemberReport,
  getMonthlyTrainerReport,
  getMonthlyClassReport,
};
