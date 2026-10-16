"use strict";

const enrollmentService = require("./enrollment.service");
const { success, created } = require("../../shared/response");

async function getAll(req, res, next) {
  try {
    const { status, search, skip, limit } = req.query;
    const result = await enrollmentService.getAll({
      status,
      search,
      skip,
      limit,
    });
    return success(res, result, "Enrollments retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const enrollment = await enrollmentService.getById(req.params.id);
    return success(res, enrollment, "Enrollment retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getInquiryEnrollment(req, res, next) {
  try {
    const enrollment = await enrollmentService.getInquiryEnrollment(req.params.inquiryId);
    return success(res, enrollment, "Inquiry enrollment retrieved.");
  } catch (err) {
    next(err);
  }
}

async function getNextIds(req, res, next) {
  try {
    const ids = await enrollmentService.getNextIds();
    return success(res, ids, "Next enrollment and invoice IDs generated.");
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin", email: "admin@strengthway.com" };
    const enrollment = await enrollmentService.createEnrollment(req.body, adminUser);
    return created(
      res,
      enrollment,
      "Enrollment and pending invoice created successfully. Payment link generated."
    );
  } catch (err) {
    next(err);
  }
}

async function generateAndSendPaymentLink(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const enrollment = await enrollmentService.generateAndSendPaymentLink(
      req.params.id,
      adminUser
    );
    return success(
      res,
      enrollment,
      "Payment link successfully generated and dispatched through WhatsApp."
    );
  } catch (err) {
    next(err);
  }
}

async function resendPaymentLink(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const enrollment = await enrollmentService.generateAndSendPaymentLink(
      req.params.id,
      adminUser
    );
    return success(
      res,
      enrollment,
      "Payment link successfully resent through WhatsApp."
    );
  } catch (err) {
    next(err);
  }
}

async function recordOfflinePayment(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const result = await enrollmentService.recordOfflinePayment(
      req.params.id,
      req.body,
      adminUser
    );
    return success(
      res,
      result,
      "Offline payment recorded successfully."
    );
  } catch (err) {
    next(err);
  }
}

async function verifyOnlinePayment(req, res, next) {
  try {
    const adminUser = req.user || { name: "System" };
    const result = await enrollmentService.verifyOnlinePayment(
      req.params.id,
      req.body,
      adminUser
    );
    return success(
      res,
      result,
      "Payment verified successfully. Member record activated."
    );
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const adminUser = req.user || { name: "Admin" };
    const enrollment = await enrollmentService.cancelEnrollment(
      req.params.id,
      req.body.reason,
      adminUser
    );
    return success(res, enrollment, "Enrollment cancelled successfully.");
  } catch (err) {
    next(err);
  }
}

async function handleWebhook(req, res, next) {
  try {
    const signature =
      req.headers["x-razorpay-signature"] || req.headers["x-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const result = await enrollmentService.handleWebhook(
      req.body,
      signature,
      rawBody
    );
    return success(res, result, "Razorpay webhook processed successfully.");
  } catch (err) {
    console.error("[RazorpayWebhookController] Webhook handling error:", err.message);
    if (err.name === "ValidationError" || err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  getInquiryEnrollment,
  getNextIds,
  create,
  generateAndSendPaymentLink,
  resendPaymentLink,
  recordOfflinePayment,
  verifyOnlinePayment,
  cancel,
  handleWebhook,
};
