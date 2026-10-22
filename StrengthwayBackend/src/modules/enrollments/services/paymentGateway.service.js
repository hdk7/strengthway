"use strict";

const crypto = require("crypto");
const https = require("https");
const config = require("../../../config/env");

let RazorpaySDK = null;
try {
  RazorpaySDK = require("razorpay");
} catch {
  // Gracefully fallback to native HTTPS client if package not yet installed
}

class PaymentGatewayService {
  constructor() {
    this.refreshCredentials();
  }

  refreshCredentials() {
    this.keyId =
      config.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret =
      config.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
    this.webhookSecret =
      config.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || "";

    if (this.isConfigured() && RazorpaySDK && !this.razorpayInstance) {
      try {
        this.razorpayInstance = new RazorpaySDK({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
      } catch (err) {
        console.warn("[PaymentGateway] Failed to initialize Razorpay SDK instance:", err.message);
      }
    }
  }

  isConfigured() {
    return Boolean(this.keyId && this.keySecret);
  }

  /**
   * Generates a payment link either through real Razorpay API or a fully-functional simulation link.
   *
   * @param {Object} params
   * @param {number} params.amount - Final payable amount in INR
   * @param {string} params.referenceId - Enrollment ID or Invoice Number
   * @param {string} params.description - Plan and gym details
   * @param {Object} params.customer - { name, email, contact }
   * @param {Date} [params.expireBy] - Optional expiration Date
   * @returns {Promise<Object>}
   */
  async createPaymentLink({
    amount,
    referenceId,
    description,
    customer = {},
    expireBy,
  }) {
    this.refreshCredentials();
    const expiresAt = expireBy || new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours default

    // Clean and validate customer payload
    const customerPayload = {
      name: (customer.name || "Strengthway Athlete").trim(),
    };
    if (customer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email).trim())) {
      customerPayload.email = String(customer.email).trim().toLowerCase();
    }
    if (customer.contact) {
      const cleanContact = String(customer.contact).replace(/[^0-9+]/g, "");
      if (cleanContact) {
        customerPayload.contact = cleanContact;
      }
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    // When Razorpay credentials are fully configured in environment
    if (this.isConfigured()) {
      // 1. Try with official Razorpay Node.js SDK if loaded
      if (this.razorpayInstance?.paymentLink?.create) {
        try {
          const sdkResponse = await this.razorpayInstance.paymentLink.create({
            amount: amountInPaise,
            currency: "INR",
            accept_partial: false,
            reference_id: referenceId,
            description: description || `Strengthway Gym Membership — ${referenceId}`,
            customer: customerPayload,
            notify: {
              sms: false,
              email: Boolean(customerPayload.email),
              whatsapp: false, // Handled by Meta WhatsApp Cloud API integration
            },
            reminder_enable: true,
            expire_by: Math.floor(expiresAt.getTime() / 1000),
            notes: {
              enrollmentId: referenceId,
              facility: config.GYM_NAME || "Strengthway Gym",
            },
          });

          return {
            linkId: sdkResponse.id,
            orderId: sdkResponse.order_id || `order_rzp_${sdkResponse.id}`,
            url: sdkResponse.short_url || sdkResponse.url,
            shortUrl: sdkResponse.short_url,
            status: "Created",
            expiresAt,
            gateway: "Razorpay",
            mockMode: false,
            raw: sdkResponse,
          };
        } catch (sdkErr) {
          console.warn(
            "[PaymentGateway] Razorpay SDK create payment link failed, trying REST API:",
            sdkErr.message
          );
        }
      }

      // 2. Direct HTTPS REST API client
      try {
        const payload = JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          accept_partial: false,
          reference_id: referenceId,
          description: description || `Strengthway Gym Membership — ${referenceId}`,
          customer: customerPayload,
          notify: {
            sms: false,
            email: Boolean(customerPayload.email),
            whatsapp: false,
          },
          reminder_enable: true,
          expire_by: Math.floor(expiresAt.getTime() / 1000),
          notes: {
            enrollmentId: referenceId,
            facility: config.GYM_NAME || "Strengthway Gym",
          },
        });

        const authHeader =
          "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");

        const response = await this._httpPost(
          "https://api.razorpay.com/v1/payment_links",
          payload,
          {
            Authorization: authHeader,
            "Content-Type": "application/json",
          }
        );

        return {
          linkId: response.id,
          orderId: response.order_id || `order_rzp_${response.id}`,
          url: response.short_url || response.url,
          shortUrl: response.short_url,
          status: "Created",
          expiresAt,
          gateway: "Razorpay",
          mockMode: false,
          raw: response,
        };
      } catch (err) {
        console.warn(
          "[PaymentGateway] Razorpay API call failed, falling back to simulated gateway:",
          err.message
        );
      }
    }

    // Decoupled / Simulation Mode (when Razorpay keys are not yet configured or testing)
    const mockOrderId = `order_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const mockLinkId = `plink_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const isDiscount = String(referenceId).startsWith("DSC-");
    const paramKey = isDiscount ? "discountId" : "enrollmentId";

    const baseUrl = config.CLIENT_ORIGIN || process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const paymentUrl = `${baseUrl}/payment/checkout?${paramKey}=${encodeURIComponent(
      referenceId
    )}&orderId=${mockOrderId}&linkId=${mockLinkId}&amount=${amount}`;

    return {
      linkId: mockLinkId,
      orderId: mockOrderId,
      url: paymentUrl,
      shortUrl: paymentUrl,
      status: "Created",
      expiresAt,
      gateway: "Simulated",
      mockMode: true,
    };
  }

  /**
   * Verifies payment signature server-side.
   *
   * @param {Object} params
   * @param {string} params.orderId
   * @param {string} params.paymentId
   * @param {string} params.signature
   * @returns {boolean}
   */
  verifyPaymentSignature({ orderId, paymentId, signature }) {
    this.refreshCredentials();
    if (!orderId || !paymentId) {
      return false;
    }

    // Check if real Razorpay keys are in use
    if (this.isConfigured() && !orderId.startsWith("order_sim_")) {
      try {
        const text = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
          .createHmac("sha256", this.keySecret)
          .update(text)
          .digest("hex");
        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "utf8"),
          Buffer.from(signature || "", "utf8")
        );
      } catch (err) {
        return false;
      }
    }

    // In simulation / decoupled mode: verify mock token format or mock signature
    if (
      signature &&
      (signature.startsWith("sig_mock_") ||
        signature === "simulated_success" ||
        signature === "webhook_verified")
    ) {
      return true;
    }

    // Also support fallback mock verification for simulated orders
    if (orderId.startsWith("order_sim_") && paymentId.startsWith("pay_sim_")) {
      return true;
    }

    return false;
  }

  /**
   * Verifies Razorpay Webhook signature using HMAC-SHA256 and RAZORPAY_WEBHOOK_SECRET.
   *
   * @param {Buffer|string} rawBody - Raw request body
   * @param {string} signatureHeader - Value of 'x-razorpay-signature' header
   * @returns {boolean}
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    this.refreshCredentials();
    if (!this.webhookSecret) {
      // In development or simulation mode without secret set, allow with warning
      if (config.NODE_ENV !== "production") {
        return true;
      }
      return false;
    }

    if (!signatureHeader) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signatureHeader, "utf8");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (err) {
      console.error("[PaymentGateway] Webhook signature verification error:", err.message);
      return false;
    }
  }

  /**
   * Generates a valid mock payment payload for testing and UI simulation.
   */
  generateMockPaymentPayload(orderId) {
    const paymentId = `pay_sim_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const signature = `sig_mock_${crypto.randomBytes(16).toString("hex")}`;
    return {
      razorpay_order_id: orderId || `order_sim_${Date.now()}`,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    };
  }

  /**
   * Helper for raw HTTPS POST requests.
   */
  _httpPost(urlStr, data, headers) {
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
                reject(
                  new Error(
                    parsed.error?.description ||
                      `HTTP ${res.statusCode}: ${body.slice(0, 100)}`
                  )
                );
              }
            } catch (e) {
              reject(new Error(`Failed to parse gateway response: ${body.slice(0, 100)}`));
            }
          });
        }
      );

      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = new PaymentGatewayService();
