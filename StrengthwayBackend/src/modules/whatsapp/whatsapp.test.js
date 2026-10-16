"use strict";

jest.setTimeout(30000);

const request = require("supertest");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connectDB, disconnectDB } = require("../../config/database");
const app = require("../../app");
const { JWT_SECRET } = require("../../config/env");

const WhatsAppMessage = require("./whatsappMessage.model");
const Enrollment = require("../enrollments/enrollment.model");
const User = require("../auth/user.model");
const whatsappService = require("./whatsapp.service");

describe("Official Meta WhatsApp Cloud API Integration Suite", () => {
  let adminToken = null;
  let adminUserId = null;
  let trainerToken = null;
  let trainerUserId = null;
  let testEnrollmentId = `ENR-TEST-WA-${Date.now().toString().slice(-4)}`;
  let testInvoiceNumber = `INV-TEST-WA-${Date.now().toString().slice(-4)}`;

  const testAppSecret = "test_meta_app_secret_1234567890";
  const testVerifyToken = "test_verify_token_custom_2026";

  beforeAll(async () => {
    await connectDB();

    // Configure test secrets in whatsappService for deterministic testing
    whatsappService.appSecret = testAppSecret;
    whatsappService.verifyToken = testVerifyToken;
    whatsappService.accessToken = "";

    // 1. Create Admin User
    const adminUser = await User.create({
      name: "Admin WhatsApp Tester",
      email: `admin.wa.${Date.now()}@strengthway.com`,
      passwordHash: "dummyhash",
      role: "admin",
      isActive: true,
    });
    adminUserId = adminUser._id;
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), role: "admin", name: adminUser.name, email: adminUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 2. Create Trainer User (to test RBAC restrictions)
    const trainerUser = await User.create({
      name: "Trainer WhatsApp Tester",
      email: `trainer.wa.${Date.now()}@strengthway.com`,
      passwordHash: "dummyhash",
      role: "trainer",
      isActive: true,
    });
    trainerUserId = trainerUser._id;
    trainerToken = jwt.sign(
      { id: trainerUser._id.toString(), role: "trainer", name: trainerUser.name, email: trainerUser.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 3. Create a mock pending enrollment for webhook status reconciliation
    await Enrollment.create({
      id: testEnrollmentId,
      inquiryId: "INQ-WA-TEST-001",
      personalDetails: {
        firstName: "Marcus",
        lastName: "Aurelius",
        name: "Marcus Aurelius",
        email: "marcus.stoic@example.com",
        mobile: "+91 9876543210",
        gender: "Male",
        city: "Rome",
        state: "Karnataka",
      },
      membershipPlan: {
        id: "plan-gold",
        name: "Annual Stoic Strength",
        durationMonths: 12,
        price: 24000,
        formattedPrice: "₹24,000",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      pricing: {
        originalPrice: 24000,
        discountType: "none",
        discountValue: 0,
        discountAmount: 0,
        finalAmount: 24000,
        paidAmount: 0,
        balanceAmount: 24000,
      },
      status: "Pending Payment",
      invoice: {
        invoiceNumber: testInvoiceNumber,
        status: "Pending Payment",
        subtotal: 24000,
        discount: 0,
        totalAmount: 24000,
        dueAmount: 24000,
        paymentLink: {
          url: "http://localhost:5173/payment/checkout?test=1",
          status: "Created",
        },
      },
      whatsappStatus: {
        sent: true,
        sentAt: new Date(),
        messageId: "wamid.test_initial_message_id_001",
        deliveryStatus: "Sent",
        resendCount: 0,
      },
      auditLogs: [],
    });
  });

  afterAll(async () => {
    await WhatsAppMessage.deleteMany({
      $or: [
        { enrollmentId: testEnrollmentId },
        { invoiceNumber: testInvoiceNumber },
        { recipientPhone: "919876543210" },
      ],
    });
    await Enrollment.deleteMany({ id: testEnrollmentId });
    if (adminUserId) await User.deleteOne({ _id: adminUserId });
    if (trainerUserId) await User.deleteOne({ _id: trainerUserId });
    await disconnectDB();
  });

  // ── 1. Phone Normalization & Validation Unit Tests ─────────────────────────
  describe("Phone Normalization & E.164 Standards", () => {
    test("normalizes 10-digit Indian numbers by prefixing 91", () => {
      const normalized = whatsappService.normalizePhoneNumber("9876543210");
      expect(normalized).toBe("919876543210");
    });

    test("cleans formatted +91 number correctly", () => {
      const normalized = whatsappService.normalizePhoneNumber("+91 99887 76655");
      expect(normalized).toBe("919988776655");
    });

    test("validates phone number structure correctly", () => {
      expect(whatsappService.isValidPhoneNumber("919876543210")).toBe(true);
      expect(whatsappService.isValidPhoneNumber("12345")).toBe(false);
      expect(whatsappService.isValidPhoneNumber("")).toBe(false);
    });
  });

  // ── 2. Message Formatting & Meta Template Payloads ─────────────────────────
  describe("Template & Message Formatting", () => {
    test("formats approved template payload with body parameters correctly", () => {
      const payload = whatsappService.formatTemplatePayload({
        toPhone: "919876543210",
        candidateName: "Hercules",
        gymName: "Strengthway Gym",
        planName: "Quarterly Elite",
        finalAmount: 12000,
        invoiceNumber: "INV-2026-0001",
        paymentLink: "https://strengthway.com/pay/abc",
        templateName: "membership_payment_link",
        languageCode: "en_US",
      });

      expect(payload.messaging_product).toBe("whatsapp");
      expect(payload.type).toBe("template");
      expect(payload.to).toBe("919876543210");
      expect(payload.template.name).toBe("membership_payment_link");
      expect(payload.template.language.code).toBe("en_US");

      const params = payload.template.components[0].parameters;
      expect(params).toHaveLength(6);
      expect(params[0].text).toBe("Hercules");
      expect(params[1].text).toBe("Strengthway Gym");
      expect(params[2].text).toBe("Quarterly Elite");
      expect(params[3].text).toBe("₹12,000");
      expect(params[4].text).toBe("INV-2026-0001");
      expect(params[5].text).toBe("https://strengthway.com/pay/abc");
    });

    test("formats text message copy conforming to specification", () => {
      const copy = whatsappService.formatMessageContent({
        candidateName: "Hercules",
        gymName: "Strengthway Gym",
        planName: "Quarterly Elite",
        durationMonths: 3,
        finalAmount: 12000,
        invoiceNumber: "INV-2026-0001",
        paymentLink: "https://strengthway.com/pay/abc",
      });

      expect(copy).toContain("Hercules");
      expect(copy).toContain("Strengthway Gym");
      expect(copy).toContain("Quarterly Elite");
      expect(copy).toContain("INV-2026-0001");
      expect(copy).toContain("₹12,000");
      expect(copy).toContain("https://strengthway.com/pay/abc");
    });
  });

  // ── 3. Simulated Dispatch & Database Audit Recording ───────────────────────
  describe("Message Dispatch & Persistence", () => {
    test("dispatches payment link message in simulated mode and records in database", async () => {
      const result = await whatsappService.sendPaymentLink({
        toPhone: "919876543210",
        candidateName: "Marcus Aurelius",
        planName: "Annual Stoic Strength",
        durationMonths: 12,
        finalAmount: 24000,
        invoiceNumber: testInvoiceNumber,
        paymentLink: "http://localhost:5173/payment/checkout?test=1",
        enrollmentId: testEnrollmentId,
      });

      expect(result.sent).toBe(true);
      expect(result.messageId).toMatch(/^wamid\./);
      expect(result.deliveryStatus).toBe("Simulated");
      expect(result.whatsappWebUrl).toContain("919876543210");

      // Verify stored message doc in database
      const stored = await WhatsAppMessage.findOne({ messageId: result.messageId });
      expect(stored).not.toBeNull();
      expect(stored.enrollmentId).toBe(testEnrollmentId);
      expect(stored.invoiceNumber).toBe(testInvoiceNumber);
      expect(stored.recipientPhone).toBe("919876543210");
    });

    test("handles invalid recipient phone gracefully without throwing fatal errors", async () => {
      const result = await whatsappService.sendPaymentLink({
        toPhone: "123", // invalid
        candidateName: "Bad Phone Candidate",
        planName: "Test Plan",
        finalAmount: 5000,
        invoiceNumber: "INV-BAD-001",
        paymentLink: "http://localhost:5173",
      });

      expect(result.sent).toBe(false);
      expect(result.deliveryStatus).toBe("Failed");
      expect(result.failureReason).toContain("Invalid recipient phone number");
    });
  });

  // ── 4. Webhook Verification (GET) ──────────────────────────────────────────
  describe("Meta Webhook Verification (GET /api/v1/whatsapp/webhook)", () => {
    test("returns hub.challenge with 200 when verify token matches", async () => {
      const challengeCode = "challenge_token_abc_12345";
      const res = await request(app)
        .get("/api/v1/whatsapp/webhook")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": testVerifyToken,
          "hub.challenge": challengeCode,
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challengeCode);
    });

    test("returns 403 Forbidden when verify token is incorrect", async () => {
      const res = await request(app)
        .get("/api/v1/whatsapp/webhook")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong_token_unauthorized",
          "hub.challenge": "12345",
        });

      expect(res.status).toBe(403);
    });
  });

  // ── 5. Webhook Signature Verification & Status Updates (POST) ──────────────
  describe("Meta Webhook Event Handling (POST /api/v1/whatsapp/webhook)", () => {
    test("rejects webhook request when HMAC signature is invalid", async () => {
      const payload = { object: "whatsapp_business_account", entry: [] };
      const res = await request(app)
        .post("/api/v1/whatsapp/webhook")
        .set("x-hub-signature-256", "sha256=invalid_signature_hex_00000000000000000000000000000000")
        .send(payload);

      expect(res.status).toBe(403);
    });

    test("accepts valid HMAC signature and processes delivered status update", async () => {
      const testMsgId = "wamid.test_initial_message_id_001";

      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "WABA_TEST_ID",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  statuses: [
                    {
                      id: testMsgId,
                      status: "delivered",
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: "919876543210",
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const rawJson = JSON.stringify(webhookPayload);
      const signature =
        "sha256=" +
        crypto.createHmac("sha256", testAppSecret).update(rawJson).digest("hex");

      const res = await request(app)
        .post("/api/v1/whatsapp/webhook")
        .set("Content-Type", "application/json")
        .set("x-hub-signature-256", signature)
        .send(rawJson);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify that enrollment whatsappStatus was updated to "Delivered"
      const updatedEnrollment = await Enrollment.findOne({ id: testEnrollmentId });
      expect(updatedEnrollment.whatsappStatus.deliveryStatus).toBe("Delivered");
      expect(updatedEnrollment.whatsappStatus.lastDeliveredAt).toBeDefined();

      // CRITICAL CHECK: Invoice MUST remain "Pending Payment" - WhatsApp delivery is NOT proof of payment!
      expect(updatedEnrollment.invoice.status).toBe("Pending Payment");
      expect(updatedEnrollment.status).toBe("Pending Payment");
    });

    test("processes subsequent 'read' status idempotently without downgrading", async () => {
      const testMsgId = "wamid.test_initial_message_id_001";

      const readPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "WABA_TEST_ID",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  statuses: [
                    {
                      id: testMsgId,
                      status: "read",
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      recipient_id: "919876543210",
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const rawJson = JSON.stringify(readPayload);
      const signature =
        "sha256=" +
        crypto.createHmac("sha256", testAppSecret).update(rawJson).digest("hex");

      const res = await request(app)
        .post("/api/v1/whatsapp/webhook")
        .set("Content-Type", "application/json")
        .set("x-hub-signature-256", signature)
        .send(rawJson);

      expect(res.status).toBe(200);

      const updatedEnrollment = await Enrollment.findOne({ id: testEnrollmentId });
      expect(updatedEnrollment.whatsappStatus.deliveryStatus).toBe("Read");
      // Invoice still pending
      expect(updatedEnrollment.invoice.status).toBe("Pending Payment");
    });
  });

  // ── 6. Admin RBAC Restrictions & Config Endpoints ─────────────────────────
  describe("Admin RBAC & Configuration Monitoring", () => {
    test("GET /api/v1/whatsapp/config returns safe connection status for Admin", async () => {
      const res = await request(app)
        .get("/api/v1/whatsapp/config")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.mode).toBeDefined();
      expect(res.body.data.templateName).toBeDefined();
      expect(res.body.data.webhookPath).toBe("/api/v1/whatsapp/webhook");
      // Verify no sensitive secrets are leaked
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.body.data.appSecret).toBeUndefined();
    });

    test("GET /api/v1/whatsapp/config returns 403 Forbidden for Trainer role", async () => {
      const res = await request(app)
        .get("/api/v1/whatsapp/config")
        .set("Authorization", `Bearer ${trainerToken}`);

      expect(res.status).toBe(403);
    });

    test("POST /api/v1/whatsapp/test-send dispatches test message for Admin", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/test-send")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          toPhone: "9876543210",
          messageText: "Test health ping from test runner",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.to).toBe("919876543210");
    });

    test("POST /api/v1/whatsapp/test-send returns 403 Forbidden for Trainer role", async () => {
      const res = await request(app)
        .post("/api/v1/whatsapp/test-send")
        .set("Authorization", `Bearer ${trainerToken}`)
        .send({
          toPhone: "9876543210",
          messageText: "Unauthorized ping attempt",
        });

      expect(res.status).toBe(403);
    });

    test("GET /api/v1/whatsapp/logs retrieves message logs for Admin", async () => {
      const res = await request(app)
        .get("/api/v1/whatsapp/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });
});
