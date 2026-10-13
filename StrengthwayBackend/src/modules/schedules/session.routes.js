"use strict";

const router = require("express").Router();
const ctrl = require("./session.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const {
  updateSessionStatusSchema,
  updateSessionSchema,
} = require("./schedule.schema");

router.get("/", authenticate, ctrl.getAll);
router.get("/:id", authenticate, ctrl.getById);
router.patch("/:id/status", authenticate, requireAdmin, validate(updateSessionStatusSchema), ctrl.updateStatus);
router.put("/:id", authenticate, requireAdmin, validate(updateSessionSchema), ctrl.update);

module.exports = router;
