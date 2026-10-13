"use strict";

const router = require("express").Router();
const ctrl = require("./trainer.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate, optionalAuth } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { scopeTrainerQuery, scopeTrainerDoc } = require("../../middleware/scope.middleware");
const {
  createTrainerSchema,
  updateTrainerSchema,
  syncBatchesSchema,
} = require("./trainer.schema");

// ── Collection routes ────────────────────────────────────────────────────────
// GET /api/v1/trainers — Public visitors see directory; Admin sees all; Trainer sees self; Member forbidden
router.get("/", optionalAuth, scopeTrainerQuery, ctrl.getAll);
// POST /api/v1/trainers — Admin only
router.post("/", authenticate, requireAdmin, validate(createTrainerSchema), ctrl.create);

// ── Document routes ──────────────────────────────────────────────────────────
// GET /api/v1/trainers/:id — Public sees portfolio; Trainer sees self; Member forbidden
router.get("/:id", optionalAuth, scopeTrainerDoc, ctrl.getById);
router.get("/:id/month-tracking", authenticate, scopeTrainerDoc, ctrl.getMonthTracking);

// Write/Delete operations — Admin only
router.put("/:id", authenticate, requireAdmin, validate(updateTrainerSchema), ctrl.update);
router.patch("/:id", authenticate, requireAdmin, validate(updateTrainerSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

// ── Action routes (Admin only) ───────────────────────────────────────────────
router.patch("/:id/soft-delete", authenticate, requireAdmin, ctrl.softDelete);
router.patch("/:id/restore", authenticate, requireAdmin, ctrl.restore);
router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);
router.patch("/:id/sync-batches", authenticate, requireAdmin, validate(syncBatchesSchema), ctrl.syncBatches);

module.exports = router;

