"use strict";

const reportsService = require("./reports.service");
const { success } = require("../../shared/response");

async function getMonthlyBatchReport(req, res, next) {
  try {
    const { month, batchId } = req.query;
    const report = await reportsService.getMonthlyBatchReport(month, batchId);
    return success(res, report, "Monthly batch report generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyMemberReport(req, res, next) {
  try {
    const { month, status } = req.query;
    const report = await reportsService.getMonthlyMemberReport(month, status);
    return success(res, report, "Monthly member report generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyTrainerReport(req, res, next) {
  try {
    const { month } = req.query;
    const report = await reportsService.getMonthlyTrainerReport(month);
    return success(res, report, "Monthly trainer report generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthlyClassReport(req, res, next) {
  try {
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
