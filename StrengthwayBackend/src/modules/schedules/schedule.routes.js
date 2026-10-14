"use strict";

const router = require("express").Router();
const ctrl = require("./schedule.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin, requireTrainer } = require("../../middleware/role.middleware");
const {
  createScheduleSchema,
  updateScheduleSchema,
  assignBatchesSchema,
  createItemSchema,
  updateItemSchema,
} = require("./schedule.schema");

// ─── Master Schedules ──────────────────────────────────────────────────────────
// Read allowed for Admin & Trainer; modifications admin-only (Members restricted)
router.get("/", authenticate, requireTrainer, ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createScheduleSchema), ctrl.create);

// ─── Direct Curriculum Items Routes (Must be before /:id) ────────────────────
router.put("/items/:itemId", authenticate, requireAdmin, validate(updateItemSchema), ctrl.updateItemDirect);
router.delete("/items/:itemId", authenticate, requireAdmin, ctrl.deleteItemDirect);

router.get("/:id", authenticate, requireTrainer, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateScheduleSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);
router.patch("/:id/assign-batches", authenticate, requireAdmin, validate(assignBatchesSchema), ctrl.assignBatches);
router.post("/:id/duplicate", authenticate, requireAdmin, ctrl.duplicate);
router.get("/:id/tracking", authenticate, requireTrainer, ctrl.getTracking);

// ─── Curriculum Items (Sub-resource) ───────────────────────────────────────────
router.get("/:id/items", authenticate, requireTrainer, ctrl.getItems);
router.post("/:id/items", authenticate, requireAdmin, validate(createItemSchema), ctrl.addItem);
router.put("/:id/items/:itemId", authenticate, requireAdmin, validate(updateItemSchema), ctrl.updateItem);
router.delete("/:id/items/:itemId", authenticate, requireAdmin, ctrl.deleteItem);

module.exports = router;
