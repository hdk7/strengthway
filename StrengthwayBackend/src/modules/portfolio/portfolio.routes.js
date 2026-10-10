"use strict";

const router = require("express").Router();
const ctrl = require("./portfolio.controller");
const { validate } = require("../../middleware/validate.middleware");
const {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  reorderPortfolioSchema,
} = require("./portfolio.schema");

// Public route for Landing & Portfolio pages
router.get("/public", ctrl.getPublic);

// Admin portfolio management routes
router.get("/", ctrl.getAll);
router.post("/", validate(createPortfolioItemSchema), ctrl.create);
router.patch("/reorder", validate(reorderPortfolioSchema), ctrl.reorder);

router.get("/:id", ctrl.getById);
router.put("/:id", validate(updatePortfolioItemSchema), ctrl.update);
router.patch("/:id/toggle-status", ctrl.toggleStatus);
router.patch("/:id/soft-delete", ctrl.softDelete);
router.patch("/:id/restore", ctrl.restore);
router.delete("/:id/permanent", ctrl.permanentDelete);

module.exports = router;
