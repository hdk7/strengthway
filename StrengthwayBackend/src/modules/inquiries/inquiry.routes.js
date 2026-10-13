"use strict";

const router = require("express").Router();
const ctrl = require("./inquiry.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const {
  createInquirySchema,
  updateInquirySchema,
  updateStatusSchema,
  recordContactSchema,
} = require("./inquiry.schema");

// Public creation from website landing page; Admin creation from CRM
router.post("/", validate(createInquirySchema), ctrl.create);

// ─── CRM Inquiries Management (Admin Only) ───────────────────────────────────
router.get("/next-id", authenticate, requireAdmin, ctrl.getNextId);
router.get("/", authenticate, requireAdmin, ctrl.getAll);
router.get("/:id", authenticate, requireAdmin, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateInquirySchema), ctrl.update);
router.post("/:id/contact", authenticate, requireAdmin, validate(recordContactSchema), ctrl.recordContact);
router.patch("/:id/status", authenticate, requireAdmin, validate(updateStatusSchema), ctrl.updateStatus);
router.patch("/:id/archive", authenticate, requireAdmin, ctrl.archive);
router.patch("/:id/soft-delete", authenticate, requireAdmin, ctrl.softDelete);
router.patch("/:id/restore", authenticate, requireAdmin, ctrl.restore);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

module.exports = router;
