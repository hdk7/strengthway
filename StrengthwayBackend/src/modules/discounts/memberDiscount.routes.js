"use strict";

const router = require("express").Router();
const ctrl = require("./memberDiscount.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const {
  calculatePreviewSchema,
  assignBulkDiscountsSchema,
  cancelDiscountSchema,
} = require("./memberDiscount.schema");

// Member accessible routes (authenticated as member)
router.get("/my-active", authenticate, ctrl.getMyActive);

// Admin-only preview & assignment
router.post(
  "/preview",
  authenticate,
  requireAdmin,
  validate(calculatePreviewSchema),
  ctrl.calculatePreview
);
router.post(
  "/preview-batch",
  authenticate,
  requireAdmin,
  ctrl.previewCalculationsBatch
);
router.post(
  "/bulk-assign",
  authenticate,
  requireAdmin,
  validate(assignBulkDiscountsSchema),
  ctrl.assignBulk
);

// Admin list all discounts
router.get("/", authenticate, requireAdmin, ctrl.getAll);

// Read single discount (Admin or assigned Member)
router.get("/:id", authenticate, ctrl.getById);

// Admin actions
router.patch(
  "/:id/cancel",
  authenticate,
  requireAdmin,
  validate(cancelDiscountSchema),
  ctrl.cancel
);
router.post(
  "/:id/resend-notification",
  authenticate,
  requireAdmin,
  ctrl.resendNotification
);

// Checkout & Online Payment Verification
const { optionalAuth } = require("../../middleware/auth.middleware");

router.post("/:id/checkout-link", authenticate, ctrl.generateCheckoutLink);
router.post("/:id/verify-payment", optionalAuth, ctrl.verifyOnlinePayment);

module.exports = router;
