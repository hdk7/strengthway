"use strict";

const whatsappService = require("./whatsapp.service");
const WhatsAppMessage = require("./whatsappMessage.model");
const { success } = require("../../shared/response");
const config = require("../../config/env");

/**
 * GET /api/v1/whatsapp/webhook
 * Handles Meta webhook challenge verification during initial webhook subscription.
 */
async function verifyWebhook(req, res) {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const expectedToken =
      whatsappService.verifyToken ||
      config.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      "strengthway_meta_webhook_secret_verify_2026";

    if (mode === "subscribe" && token === expectedToken) {
      // Respond with the challenge token received from Meta as plain text
      return res.status(200).send(challenge);
    }

    console.warn(
      `[WhatsAppWebhook] Verification failed. Received token: "${token}", Expected: "${expectedToken}"`
    );
    return res.status(403).json({
      success: false,
      message: "Webhook verification failed: Invalid verify token.",
    });
  } catch (err) {
    console.error("[WhatsAppWebhook] Exception in verifyWebhook:", err);
    return res.status(500).json({ success: false, message: "Webhook verification error." });
  }
}

/**
 * POST /api/v1/whatsapp/webhook
 * Receives delivery, read, and failure status updates from Meta's Cloud API.
 */
async function handleWebhook(req, res) {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    const isValid = whatsappService.verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      console.warn("[WhatsAppWebhook] Invalid X-Hub-Signature-256 header. Rejected.");
      return res.status(403).json({
        success: false,
        message: "Webhook verification failed: Invalid HMAC-SHA256 signature.",
      });
    }

    const result = await whatsappService.processWebhookPayload(req.body);

    // Meta expects 200 OK fast
    return res.status(200).json({
      success: true,
      message: "Webhook received and processed.",
      result,
    });
  } catch (err) {
    console.error("[WhatsAppWebhook] Error handling webhook event:", err);
    // Return 200 to prevent Meta from disabling the webhook on unexpected application errors
    return res.status(200).json({
      success: false,
      error: err.message,
    });
  }
}

/**
 * GET /api/v1/whatsapp/config
 * Retrieves safe connection status and metadata for the Admin UI.
 */
async function getConfig(req, res, next) {
  try {
    const status = whatsappService.getConfigStatus();
    return success(res, status, "WhatsApp configuration status retrieved.");
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/whatsapp/test-send
 * Admin-triggered test message dispatch.
 */
async function sendTestMessage(req, res, next) {
  try {
    const { toPhone, messageText, useTemplate } = req.body;
    const adminUser = req.user || { name: "Admin" };

    if (!toPhone) {
      return res.status(422).json({
        success: false,
        message: "Recipient phone number (toPhone) is required.",
      });
    }

    const result = await whatsappService.sendTestMessage({
      toPhone,
      messageText,
      useTemplate: Boolean(useTemplate),
      adminUser,
    });

    return success(res, result, "Test message dispatched successfully.");
  } catch (err) {
    return res.status(err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 400).json({
      success: false,
      message: err.message || "Failed to dispatch WhatsApp test message.",
      metaError: err.metaError || null,
    });
  }
}

/**
 * GET /api/v1/whatsapp/logs
 * Retrieves paginated audit logs of all WhatsApp messages sent.
 */
async function getMessageLogs(req, res, next) {
  try {
    const { status, search, enrollmentId, skip = 0, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== "ALL" && status !== "All") {
      filter.status = status.toLowerCase();
    }

    if (enrollmentId) {
      filter.enrollmentId = enrollmentId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { messageId: regex },
        { invoiceNumber: regex },
        { recipientPhone: regex },
        { candidateName: regex },
        { planName: regex },
        { enrollmentId: regex },
      ];
    }

    const [logs, total] = await Promise.all([
      WhatsAppMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      WhatsAppMessage.countDocuments(filter),
    ]);

    return success(
      res,
      { data: logs, total },
      "WhatsApp message logs retrieved successfully."
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  verifyWebhook,
  handleWebhook,
  getConfig,
  sendTestMessage,
  getMessageLogs,
};
