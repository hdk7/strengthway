"use strict";

const router = require("express").Router();
const ctrl = require("./member.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const { scopeMemberQuery, scopeMemberDoc } = require("../../middleware/scope.middleware");
const {
  createMemberSchema,
  updateMemberSchema,
  convertLeadSchema,
} = require("./member.schema");

// ── Collection routes ────────────────────────────────────────────────────────
// GET /api/v1/members — Admin sees all; Trainer sees assigned members; Member sees self
router.get(
  "/",
  authenticate,
  requirePermission("members", "view", "view_assigned", "view_own"),
  scopeMemberQuery,
  ctrl.getAll
);
// POST /api/v1/members — Requires members:create
router.post(
  "/",
  authenticate,
  requirePermission("members", "create"),
  validate(createMemberSchema),
  ctrl.create
);

// ── Document routes ──────────────────────────────────────────────────────────
// GET /api/v1/members/:id — Scoped to Admin, assigned Trainer, or Member's own profile
router.get(
  "/:id",
  authenticate,
  requirePermission("members", "view", "view_assigned", "view_own"),
  scopeMemberDoc,
  ctrl.getById
);
router.get(
  "/:id/month-tracking",
  authenticate,
  requirePermission("members", "view", "view_assigned", "view_own"),
  scopeMemberDoc,
  ctrl.getMonthTracking
);

// Write/Delete operations
router.put(
  "/:id",
  authenticate,
  requirePermission("members", "edit"),
  validate(updateMemberSchema),
  ctrl.update
);
router.delete(
  "/:id",
  authenticate,
  requirePermission("members", "delete"),
  ctrl.permanentDelete
);

// ── Action routes (Admin only) ───────────────────────────────────────────────
router.patch("/:id/soft-delete", authenticate, requireAdmin, ctrl.softDelete);
router.patch("/:id/restore", authenticate, requireAdmin, ctrl.restore);
router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);
router.patch("/:id/convert", authenticate, requireAdmin, validate(convertLeadSchema), ctrl.convertLead);
router.post("/:id/contact", authenticate, requireAdmin, ctrl.recordContact);
router.patch("/:id/archive", authenticate, requireAdmin, ctrl.archiveInquiry);

module.exports = router;

