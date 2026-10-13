"use strict";

const attendanceService = require("./attendance.service");
const { success, created } = require("../../shared/response");

async function markAttendance(req, res, next) {
  try {
    const record = await attendanceService.markAttendance({
      ...req.body,
      markedBy: req.user?.name || req.body.markedBy || "Coach",
    });
    return success(res, record, "Attendance marked successfully.");
  } catch (err) {
    next(err);
  }
}

async function bulkMarkAttendance(req, res, next) {
  try {
    const result = await attendanceService.bulkMarkAttendance({
      ...req.body,
      markedBy: req.user?.name || req.body.markedBy || "Coach",
    });
    return success(res, result, `Attendance marked for ${result.count} members.`);
  } catch (err) {
    next(err);
  }
}

async function getBatchAttendanceGrid(req, res, next) {
  try {
    const { month } = req.query;
    const grid = await attendanceService.getBatchAttendanceGrid(req.params.batchId, month);
    return success(res, grid, "Batch attendance grid retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMemberAttendance(req, res, next) {
  try {
    const { month } = req.query;
    const records = await attendanceService.getMemberAttendance(req.params.memberId, month);
    return success(res, records, "Member attendance records retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

const rbacScope = require("../../shared/rbacScope");
const { ForbiddenError } = require("../../shared/apiError");

async function getAttendanceRecords(req, res, next) {
  try {
    const query = { ...req.query };

    if (req.user?.role === "member") {
      query.memberId = req.user.memberId;
    } else if (req.user?.role === "trainer") {
      const assignedIds = await rbacScope.getTrainerAssignedMemberIds(req.user.trainerId);
      if (query.memberId && !assignedIds.includes(query.memberId)) {
        throw new ForbiddenError("Access denied. You can only view attendance for assigned members.");
      }
      if (!query.memberId) {
        query.memberId = { $in: assignedIds };
      }
    }

    const records = await attendanceService.getAttendanceRecords(query);
    return success(res, records, "Attendance records retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function recordTrainerLog(req, res, next) {
  try {
    const log = await attendanceService.recordTrainerLog(req.body);
    return created(res, log, "Trainer log recorded successfully.");
  } catch (err) {
    next(err);
  }
}

async function getTrainerLogs(req, res, next) {
  try {
    if (req.user?.role === "member") {
      throw new ForbiddenError("Access denied. Members do not have access to trainer logs.");
    }
    if (req.user?.role === "trainer" && req.user.trainerId !== req.params.trainerId) {
      throw new ForbiddenError("Access denied. You can only view your own trainer logs.");
    }

    const { month, date } = req.query;
    const logs = await attendanceService.getTrainerLogs(req.params.trainerId, month, date);
    return success(res, logs, "Trainer logs retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

const trainerLeavePolicyService = require("./trainerLeavePolicy.service");

async function getAllTrainerLogs(req, res, next) {
  try {
    if (req.user?.role === "member") {
      throw new ForbiddenError("Access denied. Members do not have access to trainer logs.");
    }

    let trainerId = req.query.trainerId;
    if (req.user?.role === "trainer") {
      trainerId = req.user.trainerId; // enforce self-only
    }

    const { month, date } = req.query;
    const logs = await attendanceService.getTrainerLogs(trainerId, month, date);
    return success(res, logs, "Trainer logs retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getTrainerLeavePolicy(req, res, next) {
  try {
    const policy = await trainerLeavePolicyService.getPolicy();
    return success(res, policy, "Trainer leave policy retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function saveTrainerLeavePolicy(req, res, next) {
  try {
    const policy = await trainerLeavePolicyService.savePolicy(
      req.body,
      req.user?.name || req.user?.username || "admin"
    );
    return success(res, policy, "Trainer leave policy saved successfully.");
  } catch (err) {
    next(err);
  }
}

async function validateTrainerLeaveNotice(req, res, next) {
  try {
    const { startDate, endDate, submittedOn } = req.body;
    const result = await trainerLeavePolicyService.validateLeaveNotice(
      startDate,
      endDate,
      submittedOn
    );
    return success(res, result, "Leave notice validation completed.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  markAttendance,
  bulkMarkAttendance,
  getBatchAttendanceGrid,
  getMemberAttendance,
  getAttendanceRecords,
  recordTrainerLog,
  getTrainerLogs,
  getAllTrainerLogs,
  getTrainerLeavePolicy,
  saveTrainerLeavePolicy,
  validateTrainerLeaveNotice,
};

