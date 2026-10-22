"use strict";

const dashboardService = require("./dashboard.service");
const { success } = require("../../shared/response");
const { ForbiddenError } = require("../../shared/apiError");
const { USER_ROLES } = require("../../shared/constants");

class DashboardController {
  /**
   * GET /api/v1/dashboard/admin
   */
  async getAdminDashboard(req, res, next) {
    try {
      if (req.user?.role !== USER_ROLES.ADMIN && req.user?.role !== USER_ROLES.STAFF) {
        throw new ForbiddenError("Access denied. Admin role required for facility operational intelligence.");
      }

      const { year, month, batchId } = req.query;
      const data = await dashboardService.getAdminDashboard({ year, month, batchId });

      return success(res, data, "Admin dashboard data fetched successfully.");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/trainer
   */
  async getTrainerDashboard(req, res, next) {
    try {
      let targetTrainerId = req.user?.trainerId;

      // Allow admin or staff to preview a specific trainer's dashboard
      if ((req.user?.role === USER_ROLES.ADMIN || req.user?.role === USER_ROLES.STAFF) && req.query.trainerId) {
        targetTrainerId = req.query.trainerId;
      }

      if (req.user?.role === USER_ROLES.MEMBER) {
        throw new ForbiddenError("Access denied. Members cannot access trainer dashboard.");
      }

      const { year, month, batchId } = req.query;
      const data = await dashboardService.getTrainerDashboard(targetTrainerId, { year, month, batchId });

      return success(res, data, "Trainer dashboard data fetched successfully.");
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/dashboard/member
   */
  async getMemberDashboard(req, res, next) {
    try {
      let targetMemberId = req.user?.memberId;

      // Allow admin or staff to preview a specific member's dashboard
      if ((req.user?.role === USER_ROLES.ADMIN || req.user?.role === USER_ROLES.STAFF) && req.query.memberId) {
        targetMemberId = req.query.memberId;
      }

      if (req.user?.role === USER_ROLES.TRAINER) {
        // Trainers can only view members assigned to their batches
        if (!req.query.memberId) {
          throw new ForbiddenError("Trainer must specify a memberId to view athlete dashboard.");
        }
        targetMemberId = req.query.memberId;
      }

      const { year, month } = req.query;
      const data = await dashboardService.getMemberDashboard(targetMemberId, { year, month });

      return success(res, data, "Member dashboard data fetched successfully.");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
