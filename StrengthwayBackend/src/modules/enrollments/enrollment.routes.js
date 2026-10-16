"use strict";

const router = require("express").Router();
const ctrl = require("./enrollment.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate, optionalAuth } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const {
  createEnrollmentSchema,
  recordOfflinePaymentSchema,
  verifyPaymentSchema,
  cancelEnrollmentSchema,
} = require("./enrollment.schema");

// Public Webhook listener (verified via signature)
router.post("/webhook/razorpay", ctrl.handleWebhook);

// Authenticated CRM & Public Checkout routes
router.get("/next-id", authenticate, requireAdmin, ctrl.getNextIds);
router.get("/inquiry/:inquiryId", authenticate, requireAdmin, ctrl.getInquiryEnrollment);
router.get("/", authenticate, requireAdmin, ctrl.getAll);

// Read single enrollment: accessible by Admin or by customer visiting checkout link
router.get("/:id", optionalAuth, ctrl.getById);

// Enrollment creation & actions
router.post("/", authenticate, requireAdmin, validate(createEnrollmentSchema), ctrl.create);
router.post("/:id/generate-send-link", authenticate, requireAdmin, ctrl.generateAndSendPaymentLink);
router.post("/:id/resend-link", authenticate, requireAdmin, ctrl.resendPaymentLink);
router.post(
  "/:id/record-offline-payment",
  authenticate,
  requireAdmin,
  validate(recordOfflinePaymentSchema),
  ctrl.recordOfflinePayment
);
router.post(
  "/:id/verify-payment",
  optionalAuth,
  validate(verifyPaymentSchema),
  ctrl.verifyOnlinePayment
);
router.patch(
  "/:id/cancel",
  authenticate,
  requireAdmin,
  validate(cancelEnrollmentSchema),
  ctrl.cancel
);

module.exports = router;
