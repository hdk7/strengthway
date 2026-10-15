"use strict";

const router = require("express").Router();
const ctrl = require("./notification.controller");
const { authenticate } = require("../../middleware/auth.middleware");

router.get("/", authenticate, ctrl.getNotifications);
router.patch("/:id/read", authenticate, ctrl.markAsRead);
router.patch("/read-all", authenticate, ctrl.markAllAsRead);

module.exports = router;
