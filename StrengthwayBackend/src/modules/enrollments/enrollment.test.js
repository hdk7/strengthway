"use strict";

jest.setTimeout(30000);

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { connectDB, disconnectDB } = require("../../config/database");
const app = require("../../app");
const { JWT_SECRET } = require("../../config/env");

const Inquiry = require("../inquiries/inquiry.model");
const MembershipPlan = require("../membership-plans/plan.model");
const Member = require("../members/member.model");
const Enrollment = require("./enrollment.model");
const User = require("../auth/user.model");
const whatsappService = require("../whatsapp/whatsapp.service");

describe("Payment-First Member Conversion & Enrollment Integration Suite", () => {
  const testInquiryId = `INQ-TEST-ENR-${Date.now().toString().slice(-4)}`;
  const testInquiryId2 = `INQ-ONLINE-ENR-${Date.now().toString().slice(-4)}`;
  const testPlanId = "plan-quarterly-test";
  let createdEnrollmentId = null;
  let onlineEnrollmentId = null;
  let adminToken = null;
  let adminUserId = null;

  beforeAll(async () => {
    await connectDB();
    whatsappService.accessToken = "";

    // 0. Create test admin user & JWT
    const adminUser = await User.create({
      name: "Super Admin",
      email: `admin.test.${Date.now()}@strengthway.com`,
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

    // 1. Create a test plan
    await MembershipPlan.findOneAndUpdate(
      { id: testPlanId },
      {
        id: testPlanId,
        name: "Quarterly Strength Elite",
        durationMonths: 3,
        price: 15000,
        formattedPrice: "₹15,000",
        status: "Active",
      },
      { upsert: true, returnDocument: "after" }
    );

    // 2. Create test contacted inquiries
    await Inquiry.create({
      id: testInquiryId,
      name: "Alexander The Great",
      gender: "Male",
      mobile: "+91 9988776655",
      email: "alexander.strength@example.com",
      address: "Palace Way, Pella",
      status: "Contacted",
      contactDetails: {
        contactedAt: new Date(),
        contactMethod: "Phone Call",
        contactNotes: "Candidate confirmed enrollment desire for quarterly program.",
        outcome: "Proceed to Enrollment",
      },
    });

    await Inquiry.create({
      id: testInquiryId2,
      name: "Cleopatra Philopator",
      gender: "Female",
      mobile: "+91 9988774433",
      email: "cleopatra.fit@example.com",
      address: "Royal Quarters, Alexandria",
      status: "Contacted",
      contactDetails: {
        contactedAt: new Date(),
        contactMethod: "WhatsApp",
        contactNotes: "Wants online payment checkout link.",
        outcome: "Proceed to Enrollment",
      },
    });
  });

  afterAll(async () => {
    await Enrollment.deleteMany({ inquiryId: { $in: [testInquiryId, testInquiryId2] } });
    await Inquiry.deleteMany({ id: { $in: [testInquiryId, testInquiryId2] } });
    await Member.deleteMany({ inquiryId: { $in: [testInquiryId, testInquiryId2] } });
    await MembershipPlan.deleteOne({ id: testPlanId });
    if (adminUserId) {
      await User.deleteOne({ _id: adminUserId });
    }
    await disconnectDB();
  });

  // ── 1. Next ID Generation
  test("GET /api/v1/enrollments/next-id — returns next available enrollment ID and invoice number", async () => {
    const res = await request(app)
      .get("/api/v1/enrollments/next-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enrollmentId).toMatch(/^ENR-\d{4}-\d{4}$/);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
  });

  // ── 2. Create Enrollment with Discount & Payment Link
  test("POST /api/v1/enrollments — creates enrollment, validates backend discount, and generates payment link & WhatsApp message", async () => {
    const payload = {
      inquiryId: testInquiryId,
      firstName: "Alexander",
      lastName: "Macedon",
      email: "alexander.strength@example.com",
      mobile: "+91 9988776655",
      gender: "Male",
      dob: "1996-03-15",
      address: "Palace Way, Pella",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      emergencyName: "Olympias",
      emergencyPhone: "+91 9988776600",
      emergencyRelation: "Mother",
      planId: testPlanId,
      proposedStartDate: new Date().toISOString().split("T")[0],
      discountType: "fixed",
      discountValue: 2000,
      discountReason: "Early Bird Strengthway Promotion",
      paymentMode: "PAYMENT_LINK",
    };

    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^ENR-\d{4}-\d{4}$/);
    expect(res.body.data.status).toBe("Pending Payment");

    // Verify backend calculated pricing (15000 - 2000 = 13000)
    expect(res.body.data.pricing.originalPrice).toBe(15000);
    expect(res.body.data.pricing.discountAmount).toBe(2000);
    expect(res.body.data.pricing.finalAmount).toBe(13000);

    // Verify invoice
    expect(res.body.data.invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(res.body.data.invoice.status).toBe("Pending Payment");
    expect(res.body.data.invoice.totalAmount).toBe(13000);
    expect(res.body.data.invoice.paymentLink.url).toBeDefined();

    // Verify WhatsApp tracking
    expect(res.body.data.whatsappStatus.sent).toBe(true);
    expect(res.body.data.whatsappStatus.deliveryStatus).toBeDefined();

    // Crucial check: Active Member record must NOT exist yet!
    const memberCheck = await Member.findOne({ inquiryId: testInquiryId });
    expect(memberCheck).toBeNull();

    createdEnrollmentId = res.body.data.id;
  });

  // ── 3. Duplicate Submission Protection
  test("POST /api/v1/enrollments — prevents duplicate enrollment/invoice when submitted repeatedly", async () => {
    const payload = {
      inquiryId: testInquiryId,
      firstName: "Alexander",
      lastName: "Macedon",
      email: "alexander.strength@example.com",
      mobile: "+91 9988776655",
      planId: testPlanId,
      proposedStartDate: new Date().toISOString().split("T")[0],
      discountType: "percentage",
      discountValue: 10, // 10% of 15000 = 1500 -> 13500
      discountReason: "Special Concession",
    };

    const res = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    // Same enrollment ID reused
    expect(res.body.data.id).toBe(createdEnrollmentId);
    expect(res.body.data.pricing.discountAmount).toBe(1500);
    expect(res.body.data.pricing.finalAmount).toBe(13500);

    // Ensure only 1 enrollment document exists for this inquiry
    const totalEnrollments = await Enrollment.countDocuments({ inquiryId: testInquiryId });
    expect(totalEnrollments).toBe(1);
  });

  // ── 4. Resend Payment Link
  test("POST /api/v1/enrollments/:id/resend-link — resends payment link without duplicate invoices", async () => {
    const res = await request(app)
      .post(`/api/v1/enrollments/${createdEnrollmentId}/resend-link`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.whatsappStatus.resendCount).toBe(1);
    expect(res.body.data.whatsappStatus.lastResentAt).toBeDefined();
  });

  // ── 5. Record Offline Payment: Partial Collection
  test("POST /api/v1/enrollments/:id/record-offline-payment — partial payment records dues without converting", async () => {
    const res = await request(app)
      .post(`/api/v1/enrollments/${createdEnrollmentId}/record-offline-payment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        paymentMethod: "Cash",
        transactionId: "CASH-REC-001",
        receiptNotes: "Advance token payment received",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Partially Paid");
    expect(res.body.data.pricing.paidAmount).toBe(5000);
    expect(res.body.data.pricing.balanceAmount).toBe(8500);
    expect(res.body.data.invoice.status).toBe("Partially Paid");

    // Member must NOT be active
    const memberCheck = await Member.findOne({ inquiryId: testInquiryId });
    expect(memberCheck).toBeNull();
  });

  // ── 6. Record Offline Payment: Balance Clearing & Member Conversion
  test("POST /api/v1/enrollments/:id/record-offline-payment — clearing balance verifies payment and converts to active Member", async () => {
    const res = await request(app)
      .post(`/api/v1/enrollments/${createdEnrollmentId}/record-offline-payment`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 8500,
        paymentMethod: "UPI",
        transactionId: "UPI-BALANCE-002",
        receiptNotes: "Remaining dues cleared via UPI",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.member).toBeDefined();
    expect(res.body.data.member.status).toBe("Active");
    expect(res.body.data.member.inquiryId).toBe(testInquiryId);
    expect(res.body.data.member.membershipPlan.id).toBe(testPlanId);
    expect(res.body.data.member.paymentDetails.status).toBe("Completed");
    expect(res.body.data.receiptNo).toBeDefined();

    // Verify enrollment is marked converted
    const enrollmentInDb = await Enrollment.findOne({ id: createdEnrollmentId });
    expect(enrollmentInDb.status).toBe("Converted");
    expect(enrollmentInDb.convertedMemberId).toBe(res.body.data.member.id);

    // Verify inquiry is marked converted
    const inquiryInDb = await Inquiry.findOne({ id: testInquiryId });
    expect(inquiryInDb.status).toBe("Converted");
    expect(inquiryInDb.convertedMemberId).toBe(res.body.data.member.id);
  });

  // ── 7. Online Payment Verification & Instant Conversion
  test("POST /api/v1/enrollments/:id/verify-payment — verifies online signature and converts to Member", async () => {
    // Create enrollment for Cleopatra
    const createRes = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        inquiryId: testInquiryId2,
        firstName: "Cleopatra",
        lastName: "Philopator",
        email: "cleopatra.fit@example.com",
        mobile: "+91 9988774433",
        planId: testPlanId,
        proposedStartDate: new Date().toISOString().split("T")[0],
        discountType: "none",
        discountValue: 0,
      });

    expect(createRes.status).toBe(201);
    onlineEnrollmentId = createRes.body.data.id;
    const gatewayOrderId = createRes.body.data.invoice.gatewayOrderId;

    // Verify online payment via checkout simulator signature
    const verifyRes = await request(app)
      .post(`/api/v1/enrollments/${onlineEnrollmentId}/verify-payment`)
      .send({
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: `pay_sim_${Date.now()}_1234`,
        razorpay_signature: "sig_mock_verified_signature",
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.member).toBeDefined();
    expect(verifyRes.body.data.member.status).toBe("Active");
    expect(verifyRes.body.data.member.inquiryId).toBe(testInquiryId2);

    const onlineEnrollmentInDb = await Enrollment.findOne({ id: onlineEnrollmentId });
    expect(onlineEnrollmentInDb.status).toBe("Converted");
    expect(onlineEnrollmentInDb.invoice.status).toBe("Paid");
  });

  // ── 8. Generate & Send Payment Link via WhatsApp (Admin Action)
  test("POST /api/v1/enrollments/:id/generate-send-link — RBAC protected admin action reuses active link and dispatches via WhatsApp", async () => {
    // Create an enrollment for webhook testing
    const inq3Id = `INQ-RZP-${Date.now().toString().slice(-4)}`;
    await Inquiry.create({
      id: inq3Id,
      name: "Marcus Aurelius",
      gender: "Male",
      mobile: "+91 9876543210",
      email: "marcus.aurelius@strengthway.com",
      status: "Contacted",
    });

    const createRes = await request(app)
      .post("/api/v1/enrollments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        inquiryId: inq3Id,
        firstName: "Marcus",
        lastName: "Aurelius",
        email: "marcus.aurelius@strengthway.com",
        mobile: "+91 9876543210",
        planId: testPlanId,
        proposedStartDate: new Date().toISOString().split("T")[0],
        discountType: "none",
        discountValue: 0,
      });

    expect(createRes.status).toBe(201);
    const rzpEnrollmentId = createRes.body.data.id;
    const initialUrl = createRes.body.data.invoice.paymentLink.url;

    // Unauthorized call should be rejected (401)
    const unauthorizedRes = await request(app).post(
      `/api/v1/enrollments/${rzpEnrollmentId}/generate-send-link`
    );
    expect(unauthorizedRes.status).toBe(401);

    // Authorized Admin call should succeed and reuse existing active link
    const authRes = await request(app)
      .post(`/api/v1/enrollments/${rzpEnrollmentId}/generate-send-link`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.data.invoice.paymentLink.url).toBe(initialUrl);
    expect(authRes.body.data.whatsappStatus.resendCount).toBe(1);

    // ── 9. Razorpay Webhook Integration: payment_link.paid
    const rzpLinkId = authRes.body.data.invoice.paymentLink.linkId;
    const rzpOrderId = authRes.body.data.invoice.gatewayOrderId;
    const rzpPaymentId = `pay_rzp_mock_${Date.now()}`;
    const mockUtr = `UTR-RZP-UPI-${Date.now().toString().slice(-6)}`;

    const webhookPayload = {
      entity: "event",
      event: "payment_link.paid",
      payload: {
        payment_link: {
          entity: {
            id: rzpLinkId,
            reference_id: rzpEnrollmentId,
            status: "paid",
            amount: 1500000,
            amount_paid: 1500000,
          },
        },
        payment: {
          entity: {
            id: rzpPaymentId,
            order_id: rzpOrderId,
            amount: 1500000,
            currency: "INR",
            status: "captured",
            method: "upi",
            vpa: "marcus@okhdfcbank",
            acquirer_data: {
              upi_transaction_id: mockUtr,
              rrn: "402812345678",
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    };

    const webhookRes = await request(app)
      .post("/api/v1/enrollments/webhook/razorpay")
      .set("x-razorpay-signature", "mock_signature_test")
      .send(webhookPayload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);

    // Verify Enrollment is Converted and invoice is Paid
    const convertedEnrollment = await Enrollment.findOne({ id: rzpEnrollmentId });
    expect(convertedEnrollment.status).toBe("Converted");
    expect(convertedEnrollment.invoice.status).toBe("Paid");
    expect(convertedEnrollment.invoice.gatewayPaymentId).toBe(rzpPaymentId);

    // Verify Member is created with stored UPI reference
    const convertedMember = await Member.findOne({ inquiryId: inq3Id });
    expect(convertedMember).toBeDefined();
    expect(convertedMember.status).toBe("Active");
    expect(convertedMember.paymentDetails.transactionId).toBe(rzpPaymentId);
    expect(convertedMember.paymentDetails.upiReference).toBe(mockUtr);

    // ── 10. Webhook Idempotency: Duplicate Event Does Not Create Duplicate Member
    const duplicateWebhookRes = await request(app)
      .post("/api/v1/enrollments/webhook/razorpay")
      .set("x-razorpay-signature", "mock_signature_test")
      .send(webhookPayload);

    expect(duplicateWebhookRes.status).toBe(200);
    const memberCount = await Member.countDocuments({ inquiryId: inq3Id });
    expect(memberCount).toBe(1);

    // Cleanup extra inquiry
    await Enrollment.deleteMany({ inquiryId: inq3Id });
    await Inquiry.deleteOne({ id: inq3Id });
    await Member.deleteMany({ inquiryId: inq3Id });
  });
});
