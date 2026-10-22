"use strict";

const memberDiscountService = require("./memberDiscount.service");
const { success } = require("../../shared/response");
const { ForbiddenError } = require("../../shared/apiError");

async function calculatePreview(req, res, next) {
  try {
    const result = await memberDiscountService.calculateDiscount(req.body);
    return success(res, result, "Discount preview calculated successfully.");
  } catch (err) {
    next(err);
  }
}

async function previewCalculationsBatch(req, res, next) {
  try {
    const results = await memberDiscountService.previewCalculations(req.body.items || []);
    return success(res, results, "Batch preview calculated successfully.");
  } catch (err) {
    next(err);
  }
}

async function assignBulk(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const result = await memberDiscountService.assignBulkDiscounts({
      campaignName: req.body.campaignName,
      discounts: req.body.discounts,
      notifyMembers: req.body.notifyMembers !== false,
      adminUser,
    });
    return success(
      res,
      result,
      `Successfully assigned individual discounts to ${result.totalAssigned} member(s).`,
      201
    );
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const result = await memberDiscountService.getAll(req.query);
    return success(res, result, "Member discounts retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const discount = await memberDiscountService.getById(req.params.id);

    // Data isolation: if authenticated as a member, ensure they only view their own discount
    if (req.user?.role === "member") {
      if (req.user.memberId !== discount.memberId) {
        throw new ForbiddenError("You are not authorized to view another member's discount offer.");
      }
    }

    return success(res, discount, "Member discount retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMyActive(req, res, next) {
  try {
    const memberId = req.user?.memberId || req.query.memberId;
    if (!memberId) {
      throw new ForbiddenError("Member profile identification required.");
    }
    const discounts = await memberDiscountService.getActiveDiscountsForMember(
      memberId,
      req.query.planId
    );
    return success(res, discounts, "Active member discounts retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const result = await memberDiscountService.cancelDiscount(req.params.id, {
      reason: req.body.reason,
      adminUser,
    });
    return success(res, result, "Member discount offer cancelled successfully.");
  } catch (err) {
    next(err);
  }
}

async function resendNotification(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const result = await memberDiscountService.resendNotification(
      req.params.id,
      adminUser
    );
    return success(
      res,
      result,
      "Discount offer notification resent to member successfully."
    );
  } catch (err) {
    next(err);
  }
}

async function generateCheckoutLink(req, res, next) {
  try {
    const adminUser = req.user || { name: "System" };
    const result = await memberDiscountService.generateDiscountCheckoutLink(
      req.params.id,
      adminUser
    );
    return success(res, result, "Checkout link generated successfully.");
  } catch (err) {
    next(err);
  }
}

async function verifyOnlinePayment(req, res, next) {
  try {
    const result = await memberDiscountService.verifyDiscountOnlinePayment(
      req.params.id,
      req.body
    );
    return success(res, result, "Discounted renewal payment verified successfully.");
  } catch (err) {
    console.error("VERIFY_PAYMENT_ERROR:", err.message, err.stack);
    next(err);
  }
}

module.exports = {
  calculatePreview,
  previewCalculationsBatch,
  assignBulk,
  getAll,
  getById,
  getMyActive,
  cancel,
  resendNotification,
  generateCheckoutLink,
  verifyOnlinePayment,
};
