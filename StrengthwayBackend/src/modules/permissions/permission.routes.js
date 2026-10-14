"use strict";

const express = require("express");
const router = express.Router();
const permissionController = require("./permission.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

// Get permissions for current authenticated user
router.get("/me", authenticate, (req, res, next) =>
  permissionController.getMyPermissions(req, res, next)
);

// Admin-only endpoints
router.get("/", authenticate, requireAdmin, (req, res, next) =>
  permissionController.getMatrix(req, res, next)
);

router.get("/audit", authenticate, requireAdmin, (req, res, next) =>
  permissionController.getAudit(req, res, next)
);

router.put("/:role", authenticate, requireAdmin, (req, res, next) =>
  permissionController.updateRole(req, res, next)
);

router.post("/:role/reset", authenticate, requireAdmin, (req, res, next) =>
  permissionController.resetRole(req, res, next)
);

module.exports = router;
