"use strict";

const router = require("express").Router();
const ctrl = require("./member.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { scopeMemberQuery, scopeMemberDoc } = require("../../middleware/scope.middleware");
const {
  createMemberSchema,
  updateMemberSchema,
  convertLeadSchema,
} = require("./member.schema");

// ── Collection routes ────────────────────────────────────────────────────────
// GET /api/v1/members — Admin sees all; Trainer sees assigned members; Member sees self
router.get("/", authenticate, scopeMemberQuery, ctrl.getAll);
// POST /api/v1/members — Admin only
router.post("/", authenticate, requireAdmin, validate(createMemberSchema), ctrl.create);

// ── Document routes ──────────────────────────────────────────────────────────
// GET /api/v1/members/:id — Scoped to Admin, assigned Trainer, or Member's own profile
router.get("/:id", authenticate, scopeMemberDoc, ctrl.getById);
router.get("/:id/month-tracking", authenticate, scopeMemberDoc, ctrl.getMonthTracking);

// Write/Delete operations — Admin only
router.put("/:id", authenticate, requireAdmin, validate(updateMemberSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.permanentDelete);

// ── Action routes (Admin only) ───────────────────────────────────────────────
router.patch("/:id/soft-delete", authenticate, requireAdmin, ctrl.softDelete);
router.patch("/:id/restore", authenticate, requireAdmin, ctrl.restore);
router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);
router.patch("/:id/convert", authenticate, requireAdmin, validate(convertLeadSchema), ctrl.convertLead);
router.post("/:id/contact", authenticate, requireAdmin, ctrl.recordContact);
router.patch("/:id/archive", authenticate, requireAdmin, ctrl.archiveInquiry);

module.exports = router;

