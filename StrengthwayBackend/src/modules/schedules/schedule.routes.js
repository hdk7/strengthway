"use strict";

const router = require("express").Router();
const ctrl = require("./schedule.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const {
  createScheduleSchema,
  updateScheduleSchema,
  assignBatchesSchema,
  createItemSchema,
  updateItemSchema,
} = require("./schedule.schema");

// ─── Master Schedules ──────────────────────────────────────────────────────────
// Read allowed for authenticated users; modifications admin-only
router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createScheduleSchema), ctrl.create);

// ─── Direct Curriculum Items Routes (Must be before /:id) ────────────────────
router.put("/items/:itemId", authenticate, requireAdmin, validate(updateItemSchema), ctrl.updateItemDirect);
router.delete("/items/:itemId", authenticate, requireAdmin, ctrl.deleteItemDirect);

router.get("/:id", authenticate, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateScheduleSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);
router.patch("/:id/assign-batches", authenticate, requireAdmin, validate(assignBatchesSchema), ctrl.assignBatches);
router.post("/:id/duplicate", authenticate, requireAdmin, ctrl.duplicate);
router.get("/:id/tracking", authenticate, ctrl.getTracking);

// ─── Curriculum Items (Sub-resource) ───────────────────────────────────────────
router.get("/:id/items", authenticate, ctrl.getItems);
router.post("/:id/items", authenticate, requireAdmin, validate(createItemSchema), ctrl.addItem);
router.put("/:id/items/:itemId", authenticate, requireAdmin, validate(updateItemSchema), ctrl.updateItem);
router.delete("/:id/items/:itemId", authenticate, requireAdmin, ctrl.deleteItem);

module.exports = router;
