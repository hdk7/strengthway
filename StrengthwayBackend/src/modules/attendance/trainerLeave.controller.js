"use strict";

const trainerLeaveService = require("./trainerLeave.service");
const { success, created } = require("../../shared/response");

async function createLeaveRequest(req, res, next) {
  try {
    const leave = await trainerLeaveService.createLeaveRequest(req.body, req.user);
    return created(res, leave, "Coach leave request submitted successfully.");
  } catch (err) {
    next(err);
  }
}

async function getLeaveRequests(req, res, next) {
  try {
    const leaves = await trainerLeaveService.getLeaveRequests(req.query, req.user);
    return success(res, leaves, "Coach leave requests retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getLeaveRequestById(req, res, next) {
  try {
    const leave = await trainerLeaveService.getLeaveRequestById(req.params.id, req.user);
    return success(res, leave, "Coach leave request details retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function updateLeaveStatus(req, res, next) {
  try {
    const result = await trainerLeaveService.updateLeaveStatus(
      req.params.id,
      {
        ...req.body,
        reviewedBy: req.user?.name || req.body.reviewedBy || "Admin",
      },
      req.user
    );
    return success(res, result, `Leave request status updated to ${result.status}.`);
  } catch (err) {
    next(err);
  }
}

async function cancelLeaveRequest(req, res, next) {
  try {
    const leave = await trainerLeaveService.cancelLeaveRequest(req.params.id, req.user);
    return success(res, leave, "Leave request cancelled successfully.");
  } catch (err) {
    next(err);
  }
}

async function getLeaveAffectedSessions(req, res, next) {
  try {
    const data = await trainerLeaveService.getLeaveAffectedSessions(req.params.id, req.user);
    return success(res, data, "Affected batch sessions retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyLeaveSummary(req, res, next) {
  try {
    const summary = await trainerLeaveService.getMonthlyLeaveSummary(req.query);
    return success(res, summary, "Monthly trainer leave summary retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getAnnualLeaveSummary(req, res, next) {
  try {
    const summary = await trainerLeaveService.getAnnualLeaveSummary(req.query, req.user);
    return success(res, summary, "Annual trainer leave summary retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveStatus,
  cancelLeaveRequest,
  getLeaveAffectedSessions,
  getMonthlyLeaveSummary,
  getAnnualLeaveSummary,
};
