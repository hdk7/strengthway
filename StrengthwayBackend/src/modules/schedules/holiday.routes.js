"use strict";

const router = require("express").Router();
const ctrl = require("./holiday.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const {
  createHolidaySchema,
  updateHolidaySchema,
} = require("./schedule.schema");

router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, requireAdmin, validate(createHolidaySchema), ctrl.create);
router.get("/:id", authenticate, ctrl.getById);
router.put("/:id", authenticate, requireAdmin, validate(updateHolidaySchema), ctrl.update);
router.delete("/:id", authenticate, requireAdmin, ctrl.remove);

module.exports = router;
