"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("./whatsapp.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");

// Public Meta WhatsApp Cloud API Webhook Endpoints
router.get("/webhook", ctrl.verifyWebhook);
router.post("/webhook", ctrl.handleWebhook);

// Protected Admin Configuration and Monitoring Endpoints
router.get("/config", authenticate, requireAdmin, ctrl.getConfig);
router.post("/test-send", authenticate, requireAdmin, ctrl.sendTestMessage);
router.get("/logs", authenticate, requireAdmin, ctrl.getMessageLogs);

module.exports = router;
