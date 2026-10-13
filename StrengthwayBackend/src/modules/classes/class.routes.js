"use strict";

const router = require("express").Router();
const ctrl = require("./class.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { createClassSchema, updateClassSchema } = require("./class.schema");

// ─── Literal Routes (Must precede /:id) ───────────────────────────────────────
router.get("/calendar", authenticate, ctrl.getCalendar);

// ─── Core CRUD Routes ─────────────────────────────────────────────────────────
// Read-only for authenticated roles; Mutations restricted to Admin
router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createClassSchema), ctrl.create);

router.get("/:id", authenticate, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateClassSchema), ctrl.update);
router.patch("/:id", authenticate, requireAdmin, validate(updateClassSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

module.exports = router;
