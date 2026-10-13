"use strict";

const router = require("express").Router();
const ctrl = require("./plan.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { createPlanSchema, updatePlanSchema } = require("./plan.schema");

// Plans catalog is readable; modifications are Admin-only (Masters)
router.get("/", ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createPlanSchema), ctrl.create);

router.get("/:id", ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updatePlanSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

router.patch("/:id/soft-delete", authenticate, requireAdmin, ctrl.softDelete);
router.patch("/:id/restore", authenticate, requireAdmin, ctrl.restore);
router.patch("/:id/toggle-status", authenticate, requireAdmin, ctrl.toggleStatus);

module.exports = router;
