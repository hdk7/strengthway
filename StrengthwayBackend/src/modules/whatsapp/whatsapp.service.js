"use strict";

const https = require("https");
const crypto = require("crypto");
const config = require("../../config/env");
const WhatsAppMessage = require("./whatsappMessage.model");
const Enrollment = require("../enrollments/enrollment.model");

class WhatsAppService {
  constructor() {
    this.refreshCredentials();
  }

  /**
   * Refreshes credentials from env/config without overwriting test/runtime overrides.
   */
  refreshCredentials(force = false) {
    if (force || this.accessToken === undefined) {
      this.accessToken =
        config.WHATSAPP_ACCESS_TOKEN ||
        process.env.WHATSAPP_ACCESS_TOKEN ||
        process.env.WHATSAPP_API_TOKEN ||
        "";
    }
    if (force || this.phoneNumberId === undefined) {
      this.phoneNumberId =
        config.WHATSAPP_PHONE_NUMBER_ID ||
        process.env.WHATSAPP_PHONE_NUMBER_ID ||
        "";
    }
    if (force || this.businessAccountId === undefined) {
      this.businessAccountId =
        config.WHATSAPP_BUSINESS_ACCOUNT_ID ||
        process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
        "";
    }
    if (force || this.appSecret === undefined) {
      this.appSecret =
        config.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET || "";
    }
    if (force || this.verifyToken === undefined) {
      this.verifyToken =
        config.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
        process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
        "strengthway_meta_webhook_secret_verify_2026";
    }
    if (force || this.graphApiVersion === undefined) {
      this.graphApiVersion =
        config.WHATSAPP_GRAPH_API_VERSION ||
        process.env.WHATSAPP_GRAPH_API_VERSION ||
        "v20.0";
    }
    if (force || this.defaultTemplateName === undefined) {
      this.defaultTemplateName =
        config.WHATSAPP_PAYMENT_TEMPLATE_NAME ||
        process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME ||
        "membership_payment_link";
    }
    if (force || this.defaultTemplateLang === undefined) {
      this.defaultTemplateLang =
        config.WHATSAPP_PAYMENT_TEMPLATE_LANG ||
        process.env.WHATSAPP_PAYMENT_TEMPLATE_LANG ||
        "en_US";
    }
    if (force || this.gymName === undefined) {
      this.gymName =
        config.GYM_NAME || process.env.GYM_NAME || "Strengthway Gym";
    }
  }

  /**
   * Checks whether official Meta credentials are fully configured.
   */
  isConfigured() {
    this.refreshCredentials();
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  /**
   * Cleans and normalizes a phone number to WhatsApp E.164 standard without leading '+'.
   * Example: "+91 99887 76655" -> "919988776655"
   * Example: "9988776655" -> "919988776655" (default India code 91)
   */
  normalizePhoneNumber(phone) {
    if (!phone) return "";
    let clean = String(phone).replace(/[^0-9+]/g, "");
    if (clean.startsWith("+")) {
      clean = clean.replace("+", "");
    } else if (clean.length === 10) {
      clean = "91" + clean;
    }
    return clean;
  }

  /**
   * Validates whether a normalized phone number is structurally valid for WhatsApp.
   */
  isValidPhoneNumber(normalizedPhone) {
    if (!normalizedPhone) return false;
    // E.164 without '+': digits only, length between 10 and 15
    return /^[1-9]\d{9,14}$/.test(normalizedPhone);
  }

  /**
   * Builds the standardized WhatsApp message text copy.
   * Conforms with the approved template text specification (Phase 5).
   */
  formatMessageContent({
    candidateName,
    gymName,
    planName,
    durationMonths,
    finalAmount,
    invoiceNumber,
    paymentLink,
    proposedStartDate,
  }) {
    const gym = gymName || this.gymName;
    const formattedAmount = `₹${Number(finalAmount).toLocaleString("en-IN")}`;
    const startNotice = proposedStartDate
      ? `\n📅 *Proposed Start Date:* ${new Date(proposedStartDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}`
      : "";

    return (
      `🏋️ *${gym} — Membership Enrollment*\n\n` +
      `Hello *${candidateName}*, thank you for choosing *${gym}*.\n\n` +
      `Your membership enrollment is ready.\n\n` +
      `📋 *Plan:* ${planName}${durationMonths ? ` (${durationMonths} Mo)` : ""}\n` +
      `💰 *Amount payable:* *${formattedAmount}*\n` +
      `🧾 *Invoice reference:* ${invoiceNumber}${startNotice}\n\n` +
      `Complete your payment securely using the link below:\n` +
      `👉 ${paymentLink}\n\n` +
      `⏳ _This payment link remains active for 48 hours._\n` +
      `Please contact the gym if you need assistance.\n` +
      `Welcome to *${gym}*!`
    );
  }

  /**
   * Formats a Meta WhatsApp Cloud API template payload.
   * Body parameters:
   * {{1}} = candidateName
   * {{2}} = gymName
   * {{3}} = planName
   * {{4}} = formattedAmount
   * {{5}} = invoiceNumber
   * {{6}} = paymentLink
   */
  formatTemplatePayload({
    toPhone,
    candidateName,
    gymName,
    planName,
    durationMonths,
    finalAmount,
    invoiceNumber,
    paymentLink,
    templateName,
    languageCode,
  }) {
    const gym = gymName || this.gymName;
    const formattedAmount = `₹${Number(finalAmount).toLocaleString("en-IN")}`;
    const tplName = templateName || this.defaultTemplateName;
    const langCode = languageCode || this.defaultTemplateLang;
    const planDisplay = planName
      ? `${planName}${durationMonths ? ` (${durationMonths} Mo)` : ""}`
      : "Membership Plan";

    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "template",
      template: {
        name: tplName,
        language: {
          code: langCode,
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(candidateName || "Athlete") },
              { type: "text", text: String(gym) },
              { type: "text", text: String(planDisplay) },
              { type: "text", text: String(formattedAmount) },
              { type: "text", text: String(invoiceNumber || "INV-PENDING") },
              { type: "text", text: String(paymentLink || "") },
            ],
          },
        ],
      },
    };
  }

  /**
   * Formats a standard Meta WhatsApp Cloud API text payload.
   */
  formatTextPayload({ toPhone, messageText }) {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toPhone,
      type: "text",
      text: {
        preview_url: true,
        body: messageText,
      },
    };
  }

  /**
   * Dispatches the WhatsApp payment link message.
   * Uses Meta Cloud API when configured, or simulated mode when decoupled.
   *
   * @param {Object} params
   * @param {string} params.toPhone - Recipient phone number
   * @param {string} params.candidateName - Name of the candidate
   * @param {string} params.planName - Name of the membership plan
   * @param {number} [params.durationMonths] - Plan duration in months
   * @param {number} params.finalAmount - Final payable amount
   * @param {string} params.invoiceNumber - Invoice reference number
   * @param {string} params.paymentLink - Hosted payment gateway checkout URL
   * @param {Date|string} [params.proposedStartDate] - Membership start date
   * @param {string} [params.enrollmentId] - Enrollment record ID
   * @param {string} [params.inquiryId] - Originating Inquiry ID
   * @param {Object} [params.adminUser] - Admin initiator
   * @param {boolean} [params.preferTemplate=true] - Whether to send template message first
   * @returns {Promise<Object>}
   */
  async sendPaymentLink({
    toPhone,
    candidateName,
    planName,
    durationMonths,
    finalAmount,
    invoiceNumber,
    paymentLink,
    proposedStartDate,
    enrollmentId = null,
    inquiryId = null,
    adminUser = { name: "Admin" },
    preferTemplate = true,
  }) {
    this.refreshCredentials();

    const normalizedPhone = this.normalizePhoneNumber(toPhone);
    const messageContent = this.formatMessageContent({
      candidateName,
      gymName: this.gymName,
      planName,
      durationMonths,
      finalAmount,
      invoiceNumber,
      paymentLink,
      proposedStartDate,
    });

    const whatsappWebUrl = normalizedPhone
      ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageContent)}`
      : "";

    // Validation
    if (!this.isValidPhoneNumber(normalizedPhone)) {
      const errorMsg = `Invalid recipient phone number: "${toPhone}". Must be a valid 10-15 digit number.`;
      console.warn(`[WhatsAppService] ${errorMsg}`);

      // Record failed message in database if enrollmentId is provided
      if (enrollmentId) {
        await this._recordMessageInDb({
          messageId: `wamid.invalid_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
          enrollmentId,
          inquiryId,
          invoiceNumber,
          recipientPhone: normalizedPhone || String(toPhone),
          candidateName,
          planName,
          finalAmount,
          messageType: preferTemplate ? "template" : "text",
          status: "failed",
          failureReason: errorMsg,
          sentAt: new Date(),
          failedAt: new Date(),
          initiatedBy: adminUser?.name || "Admin",
          paymentLink,
          messageContent,
          whatsappWebUrl,
        });
      }

      return {
        sent: false,
        sentAt: new Date(),
        messageId: null,
        deliveryStatus: "Failed",
        resendCount: 0,
        lastDeliveredAt: null,
        failureReason: errorMsg,
        messageContent,
        whatsappWebUrl,
      };
    }

    // ── Mode 1: Official Meta WhatsApp Cloud API ──────────────────────────────
    if (this.isConfigured()) {
      try {
        let payload;
        let messageType = "text";

        if (preferTemplate) {
          payload = this.formatTemplatePayload({
            toPhone: normalizedPhone,
            candidateName,
            gymName: this.gymName,
            planName,
            durationMonths,
            finalAmount,
            invoiceNumber,
            paymentLink,
            templateName: this.defaultTemplateName,
            languageCode: this.defaultTemplateLang,
          });
          messageType = "template";
        } else {
          payload = this.formatTextPayload({
            toPhone: normalizedPhone,
            messageText: messageContent,
          });
        }

        const endpoint = `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`;
        const headers = {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        };

        let response;
        try {
          response = await this._httpPost(endpoint, JSON.stringify(payload), headers);
        } catch (templateErr) {
          // If template dispatch fails (e.g. template not yet approved in Meta WABA),
          // fallback to text message attempt if preferTemplate was enabled
          if (preferTemplate) {
            console.warn(
              `[WhatsAppService] Template "${this.defaultTemplateName}" dispatch failed (${templateErr.message}). Attempting text fallback...`
            );
            const fallbackPayload = this.formatTextPayload({
              toPhone: normalizedPhone,
              messageText: messageContent,
            });
            response = await this._httpPost(
              endpoint,
              JSON.stringify(fallbackPayload),
              headers
            );
            messageType = "text";
          } else {
            throw templateErr;
          }
        }

        const messageId = response.messages?.[0]?.id || `wamid_${Date.now()}`;
        const initialStatus = "sent";

        // Record in Database
        await this._recordMessageInDb({
          messageId,
          enrollmentId,
          inquiryId,
          invoiceNumber,
          recipientPhone: normalizedPhone,
          candidateName,
          planName,
          finalAmount,
          messageType,
          templateName: this.defaultTemplateName,
          language: this.defaultTemplateLang,
          status: initialStatus,
          sentAt: new Date(),
          initiatedBy: adminUser?.name || "Admin",
          paymentLink,
          messageContent,
          whatsappWebUrl,
          rawResponse: response,
        });

        return {
          sent: true,
          sentAt: new Date(),
          messageId,
          deliveryStatus: "Sent",
          resendCount: 0,
          lastDeliveredAt: null,
          messageContent,
          whatsappWebUrl,
          raw: response,
          provider: "Meta WhatsApp Cloud API",
        };
      } catch (err) {
        console.warn(
          "[WhatsAppService] Official Meta Cloud API dispatch encountered error:",
          err.message
        );

        const failureReason = err.message || "Meta Cloud API dispatch failed";

        // Log failed attempt in DB
        const failedMessageId = `wamid.err_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        await this._recordMessageInDb({
          messageId: failedMessageId,
          enrollmentId,
          inquiryId,
          invoiceNumber,
          recipientPhone: normalizedPhone,
          candidateName,
          planName,
          finalAmount,
          messageType: preferTemplate ? "template" : "text",
          status: "failed",
          failureReason,
          sentAt: new Date(),
          failedAt: new Date(),
          initiatedBy: adminUser?.name || "Admin",
          paymentLink,
          messageContent,
          whatsappWebUrl,
        });

        // Provide graceful fallback response with direct WhatsApp Web URL
        return {
          sent: false,
          sentAt: new Date(),
          messageId: failedMessageId,
          deliveryStatus: "Failed",
          resendCount: 0,
          failureReason,
          messageContent,
          whatsappWebUrl,
          note: "Official Meta API dispatch failed. Staff may use WhatsApp Web direct link to send manually.",
        };
      }
    }

    // ── Mode 2: Decoupled / Simulated Mode (when API keys are not yet configured) ──
    const simulatedMessageId = `wamid.sim_${Date.now()}_${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    await this._recordMessageInDb({
      messageId: simulatedMessageId,
      enrollmentId,
      inquiryId,
      invoiceNumber,
      recipientPhone: normalizedPhone,
      candidateName,
      planName,
      finalAmount,
      messageType: "simulated",
      status: "simulated",
      sentAt: new Date(),
      initiatedBy: adminUser?.name || "Admin",
      paymentLink,
      messageContent,
      whatsappWebUrl,
    });

    return {
      sent: true,
      sentAt: new Date(),
      messageId: simulatedMessageId,
      deliveryStatus: "Simulated",
      resendCount: 0,
      lastDeliveredAt: new Date(),
      messageContent,
      whatsappWebUrl,
      provider: "Simulated Engine",
      note: "WhatsApp message prepared. Click WhatsApp Web URL or connect Meta credentials in settings to dispatch directly via Cloud API.",
    };
  }

  /**
   * Sends an admin-initiated test message to verify Meta API connection and templates.
   */
  async sendTestMessage({
    toPhone,
    messageText,
    useTemplate = false,
    adminUser = { name: "Admin" },
  }) {
    this.refreshCredentials();
    const normalizedPhone = this.normalizePhoneNumber(toPhone);

    if (!this.isValidPhoneNumber(normalizedPhone)) {
      throw new Error(`Invalid recipient phone: "${toPhone}". Must be 10-15 digits.`);
    }

    if (!this.isConfigured()) {
      const mockId = `wamid.test_sim_${Date.now()}`;
      return {
        success: true,
        mode: "Simulated Mode",
        messageId: mockId,
        to: normalizedPhone,
        note: "Meta WhatsApp credentials are not configured. Simulated test message generated successfully.",
      };
    }

    let payload;
    if (useTemplate) {
      payload = this.formatTemplatePayload({
        toPhone: normalizedPhone,
        candidateName: "Test Athlete",
        gymName: this.gymName,
        planName: "Trial Pass",
        finalAmount: 999,
        invoiceNumber: "INV-TEST-001",
        paymentLink: `${config.CLIENT_ORIGIN || "http://localhost:5173"}/payment/checkout`,
        templateName: this.defaultTemplateName,
        languageCode: this.defaultTemplateLang,
      });
    } else {
      payload = this.formatTextPayload({
        toPhone: normalizedPhone,
        messageText:
          messageText ||
          `🏋️ Test ping from ${this.gymName} WhatsApp Cloud API integration at ${new Date().toLocaleTimeString()}! Connection verified.`,
      });
    }

    const endpoint = `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await this._httpPost(endpoint, JSON.stringify(payload), headers);
    const messageId = response.messages?.[0]?.id || `wamid_${Date.now()}`;

    // Record test message in DB
    await this._recordMessageInDb({
      messageId,
      recipientPhone: normalizedPhone,
      candidateName: "Admin Test",
      planName: "Test Connection",
      messageType: useTemplate ? "template" : "text",
      status: "sent",
      sentAt: new Date(),
      initiatedBy: adminUser?.name || "Admin",
      messageContent: typeof payload.text?.body === "string" ? payload.text.body : "Test Template Message",
      rawResponse: response,
    });

    return {
      success: true,
      mode: "Meta Cloud API",
      messageId,
      to: normalizedPhone,
      raw: response,
    };
  }

  /**
   * Verifies the incoming webhook HMAC-SHA256 signature using WHATSAPP_APP_SECRET.
   *
   * @param {string} signatureHeader - Value of 'x-hub-signature-256' header
   * @param {Buffer|string} rawBody - Raw request body
   * @returns {boolean}
   */
  verifyWebhookSignature(signatureHeader, rawBody) {
    this.refreshCredentials();

    if (!this.appSecret) {
      // In development / test mode without app secret set, allow with warning
      if (config.NODE_ENV !== "production") {
        return true;
      }
      return false;
    }

    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
      return false;
    }

    try {
      const signatureHash = signatureHeader.slice(7); // Remove 'sha256='
      const hmac = crypto.createHmac("sha256", this.appSecret);
      const calculatedHash = hmac.update(rawBody).digest("hex");

      const sigBuffer = Buffer.from(signatureHash, "hex");
      const calcBuffer = Buffer.from(calculatedHash, "hex");

      if (sigBuffer.length !== calcBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, calcBuffer);
    } catch (err) {
      console.error("[WhatsAppService] Signature verification exception:", err.message);
      return false;
    }
  }

  /**
   * Idempotently processes Meta WhatsApp Cloud API status update webhook events.
   *
   * @param {Object} payload - Parsed webhook payload
   * @returns {Promise<Object>} Summary of updates performed
   */
  async processWebhookPayload(payload) {
    const results = {
      processedCount: 0,
      statusesUpdated: [],
      errors: [],
    };

    if (!payload || !Array.isArray(payload.entry)) {
      return results;
    }

    // Status precedence order to ensure idempotence
    const STATUS_PRECEDENCE = {
      failed: 5,
      read: 4,
      delivered: 3,
      sent: 2,
      pending: 1,
      simulated: 0,
    };

    for (const entry of payload.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change.value;
        if (!value || !Array.isArray(value.statuses)) continue;

        for (const item of value.statuses) {
          try {
            const messageId = item.id;
            const newStatus = (item.status || "").toLowerCase(); // "sent", "delivered", "read", "failed"
            const timestamp = item.timestamp
              ? new Date(Number(item.timestamp) * 1000)
              : new Date();
            const recipientId = item.recipient_id;

            results.processedCount++;

            // 1. Find message in WhatsAppMessage collection
            let messageDoc = await WhatsAppMessage.findOne({ messageId });

            if (messageDoc) {
              const currentPrecedence = STATUS_PRECEDENCE[messageDoc.status] || 0;
              const newPrecedence = STATUS_PRECEDENCE[newStatus] || 0;

              // Only update status if new status is of equal or higher precedence
              if (newPrecedence >= currentPrecedence) {
                messageDoc.status = newStatus;
              }

              if (newStatus === "delivered" && !messageDoc.deliveredAt) {
                messageDoc.deliveredAt = timestamp;
              } else if (newStatus === "read" && !messageDoc.readAt) {
                messageDoc.readAt = timestamp;
                if (!messageDoc.deliveredAt) messageDoc.deliveredAt = timestamp;
              } else if (newStatus === "failed") {
                messageDoc.failedAt = timestamp;
                if (Array.isArray(item.errors) && item.errors.length > 0) {
                  messageDoc.failureReason = item.errors[0].title || item.errors[0].message || "Meta API error";
                  messageDoc.errorCode = String(item.errors[0].code || "");
                }
              }

              messageDoc.deliveryHistory.push({
                status: newStatus,
                timestamp,
                details: item,
              });

              messageDoc.rawWebhookPayloads.push(item);
              await messageDoc.save();
            }

            // 2. Synchronize with Enrollment if linked
            // Look up by stored messageId
            const enrollment = await Enrollment.findOne({
              $or: [
                { "whatsappStatus.messageId": messageId },
                { id: messageDoc?.enrollmentId },
              ],
            });

            if (enrollment) {
              const normalizedDeliveryStatus =
                newStatus === "delivered"
                  ? "Delivered"
                  : newStatus === "read"
                  ? "Read"
                  : newStatus === "sent"
                  ? "Sent"
                  : newStatus === "failed"
                  ? "Failed"
                  : enrollment.whatsappStatus?.deliveryStatus;

              enrollment.whatsappStatus.deliveryStatus = normalizedDeliveryStatus;
              if (newStatus === "delivered") {
                enrollment.whatsappStatus.lastDeliveredAt = timestamp;
              }

              enrollment.auditLogs.push({
                action: "WHATSAPP_STATUS_UPDATE",
                performedBy: "Meta Webhook",
                performedAt: new Date(),
                details: {
                  messageId,
                  status: newStatus,
                  recipientId,
                  timestamp,
                },
                notes: `WhatsApp message marked as "${normalizedDeliveryStatus}" via Meta Cloud Webhook.`,
              });

              await enrollment.save();
            }

            results.statusesUpdated.push({
              messageId,
              status: newStatus,
              timestamp,
            });
          } catch (statusErr) {
            console.error("[WhatsAppService] Error updating status:", statusErr);
            results.errors.push(statusErr.message);
          }
        }
      }
    }

    return results;
  }

  /**
   * Returns safe metadata for the Admin UI without exposing tokens or secrets.
   */
  getConfigStatus() {
    this.refreshCredentials();
    const configured = this.isConfigured();

    const maskedPhoneId = this.phoneNumberId
      ? `${this.phoneNumberId.slice(0, 4)}••••${this.phoneNumberId.slice(-4)}`
      : null;

    const maskedWabaId = this.businessAccountId
      ? `${this.businessAccountId.slice(0, 4)}••••${this.businessAccountId.slice(-4)}`
      : null;

    return {
      configured,
      mode: configured ? "Official Meta Cloud API" : "Simulated / Decoupled Engine",
      phoneNumberId: maskedPhoneId,
      rawPhoneNumberId: this.phoneNumberId || "",
      businessAccountId: maskedWabaId,
      rawBusinessAccountId: this.businessAccountId || "",
      graphApiVersion: this.graphApiVersion,
      templateName: this.defaultTemplateName,
      templateLang: this.defaultTemplateLang,
      hasAppSecret: Boolean(this.appSecret),
      hasVerifyToken: Boolean(this.verifyToken),
      gymName: this.gymName,
      webhookPath: "/api/v1/whatsapp/webhook",
      suggestedTemplateStructure: {
        name: this.defaultTemplateName,
        category: "UTILITY",
        language: this.defaultTemplateLang,
        placeholders: [
          "{{1}} Candidate Name",
          "{{2}} Gym Name",
          "{{3}} Plan Name",
          "{{4}} Total Payable Amount (₹)",
          "{{5}} Invoice Reference Number",
          "{{6}} Secure Payment Link URL",
        ],
      },
    };
  }

  /**
   * Internal DB helper to persist WhatsApp message audit logs.
   */
  async _recordMessageInDb(data) {
    try {
      return await WhatsAppMessage.findOneAndUpdate(
        { messageId: data.messageId },
        { $set: data },
        { upsert: true, returnDocument: "after" }
      );
    } catch (err) {
      console.warn("[WhatsAppService] Could not persist message record to DB:", err.message);
      return null;
    }
  }

  /**
   * Helper for raw HTTPS POST requests with timeout.
   */
  _httpPost(urlStr, data, headers, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: "POST",
          headers: {
            ...headers,
            "Content-Length": Buffer.byteLength(data),
          },
          timeout: timeoutMs,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(parsed);
              } else {
                const errorDetail =
                  parsed.error?.message ||
                  parsed.error?.error_user_msg ||
                  `HTTP ${res.statusCode}: ${body.slice(0, 150)}`;
                const err = new Error(errorDetail);
                err.statusCode = res.statusCode;
                err.metaError = parsed.error;
                reject(err);
              }
            } catch (e) {
              reject(
                new Error(
                  `Failed to parse response (HTTP ${res.statusCode}): ${body.slice(0, 100)}`
                )
              );
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`WhatsApp Cloud API request timed out after ${timeoutMs}ms`));
      });

      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = new WhatsAppService();
