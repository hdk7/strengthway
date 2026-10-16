"use strict";

const classCancellationService = require("./classCancellation.service");

class ClassCancellationController {
  async simulate(req, res, next) {
    try {
      const batchId = req.params.id || req.params.batchId || req.body.batchId;
      const result = await classCancellationService.simulateCancellation({
        ...req.body,
        batchId,
      });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async apply(req, res, next) {
    try {
      const batchId = req.params.id || req.params.batchId || req.body.batchId;
      const performedBy =
        req.user?.name ||
        `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
        req.user?.id ||
        "Admin";

      const result = await classCancellationService.applyCancellation({
        ...req.body,
        batchId,
        performedBy,
      });

      return res.status(200).json({
        success: true,
        message: "Class cancellation and sequential rescheduling applied successfully.",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getBatchCancellations(req, res, next) {
    try {
      const batchId = req.params.id || req.params.batchId;
      const result = await classCancellationService.getBatchCancellations(
        batchId,
        req.query
      );
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCancellationById(req, res, next) {
    try {
      const id = req.params.cancellationId || req.params.id;
      const result = await classCancellationService.getCancellationById(id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMemberAdjustments(req, res, next) {
    try {
      const memberId = req.params.memberId || req.params.id;
      const result = await classCancellationService.getMemberAdjustments(memberId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async applyMemberRenewalAdjustment(req, res, next) {
    try {
      const memberId = req.params.memberId || req.params.id;
      const performedBy =
        req.user?.name ||
        `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
        req.user?.id ||
        "Admin";

      const result = await classCancellationService.applyAdjustmentToRenewal({
        ...req.body,
        memberId,
        performedBy,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClassCancellationController();
