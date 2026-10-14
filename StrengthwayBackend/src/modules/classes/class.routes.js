"use strict";

const router = require("express").Router();
const ctrl = require("./class.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin, requireTrainer } = require("../../middleware/role.middleware");
const { createClassSchema, updateClassSchema } = require("./class.schema");

// ─── Literal Routes (Must precede /:id) ───────────────────────────────────────
// Class catalogue is protected: Admin & Trainer only (Members cannot access class catalogue)
router.get("/calendar", authenticate, requireTrainer, ctrl.getCalendar);

// ─── Core CRUD Routes ─────────────────────────────────────────────────────────
// Read restricted to Admin & Trainer; Mutations restricted to Admin
router.get("/", authenticate, requireTrainer, ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createClassSchema), ctrl.create);

router.get("/:id", authenticate, requireTrainer, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateClassSchema), ctrl.update);
router.patch("/:id", authenticate, requireAdmin, validate(updateClassSchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

module.exports = router;
