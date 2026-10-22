"use strict";

jest.setTimeout(30000);

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { connectDB, disconnectDB } = require("../../config/database");
const app = require("../../app");
const { JWT_SECRET } = require("../../config/env");

const Member = require("../members/member.model");
const MembershipPlan = require("../membership-plans/plan.model");
const MemberDiscount = require("./memberDiscount.model");
const Notification = require("../notifications/notification.model");
const User = require("../auth/user.model");

describe("Individual Member Discount Management Integration Suite", () => {
  const ts = Date.now().toString().slice(-4);
  const plan1Id = `plan-strength-1-${ts}`;
  const plan2Id = `plan-strength-2-${ts}`;

  const memberAId = `MEM-TEST-A-${ts}`;
  const memberBId = `MEM-TEST-B-${ts}`;
  const memberCId = `MEM-TEST-C-${ts}`;

  let adminToken;
  let adminUserId;
  let memberAToken;
  let memberAUserId;
  let memberBToken;
  let memberBUserId;

  let assignedCampaignId;
  let discountAId;
  let discountBId;
  let discountCId;

  beforeAll(async () => {
    await connectDB();

    // 1. Create Admin User
    const adminUser = await User.create({
      name: "Super Admin",
      email: `admin.discount.${ts}@strengthway.com`,
      passwordHash: "dummyhash",
      role: "admin",
      isActive: true,
    });
    adminUserId = adminUser._id;
    adminToken = jwt.sign(
      {
        id: adminUser._id.toString(),
        role: "admin",
        name: adminUser.name,
        email: adminUser.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 2. Create Plans
    await MembershipPlan.create({
      id: plan1Id,
      name: "Quarterly Strength Program",
      durationMonths: 3,
      price: 15000,
      formattedPrice: "₹15,000",
      status: "Active",
    });

    await MembershipPlan.create({
      id: plan2Id,
      name: "Annual Elite Program",
      durationMonths: 12,
      price: 48000,
      formattedPrice: "₹48,000",
      status: "Active",
    });

    // 3. Create Test Members
    await Member.create({
      id: memberAId,
      firstName: "Alexander",
      lastName: "Macedon",
      fullName: "Alexander Macedon",
      email: `alexander.${ts}@strengthway.com`,
      mobile: "+91 9988771122",
      gender: "Male",
      dob: "1995-03-15",
      status: "Active",
      membershipPlan: {
        id: plan1Id,
        name: "Quarterly Strength Program",
        durationMonths: 3,
        price: 15000,
        formattedPrice: "₹15,000",
      },
    });

    await Member.create({
      id: memberBId,
      firstName: "Cleopatra",
      lastName: "Philopator",
      fullName: "Cleopatra Philopator",
      email: `cleopatra.${ts}@strengthway.com`,
      mobile: "+91 9988773344",
      gender: "Female",
      dob: "1997-08-20",
      status: "Active",
      membershipPlan: {
        id: plan1Id,
        name: "Quarterly Strength Program",
        durationMonths: 3,
        price: 15000,
        formattedPrice: "₹15,000",
      },
    });

    await Member.create({
      id: memberCId,
      firstName: "Marcus",
      lastName: "Aurelius",
      fullName: "Marcus Aurelius",
      email: `marcus.${ts}@strengthway.com`,
      mobile: "+91 9988775566",
      gender: "Male",
      dob: "1990-04-26",
      status: "Active",
      membershipPlan: {
        id: plan2Id,
        name: "Annual Elite Program",
        durationMonths: 12,
        price: 48000,
        formattedPrice: "₹48,000",
      },
    });

    // Member A & B User Auth
    const userA = await User.create({
      name: "Alexander Macedon",
      email: `alexander.${ts}@strengthway.com`,
      passwordHash: "dummyhash",
      role: "member",
      memberId: memberAId,
      isActive: true,
    });
    memberAUserId = userA._id;
    memberAToken = jwt.sign(
      {
        id: userA._id.toString(),
        role: "member",
        memberId: memberAId,
        name: userA.name,
        email: userA.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const userB = await User.create({
      name: "Cleopatra Philopator",
      email: `cleopatra.${ts}@strengthway.com`,
      passwordHash: "dummyhash",
      role: "member",
      memberId: memberBId,
      isActive: true,
    });
    memberBUserId = userB._id;
    memberBToken = jwt.sign(
      {
        id: userB._id.toString(),
        role: "member",
        memberId: memberBId,
        name: userB.name,
        email: userB.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await MemberDiscount.deleteMany({
      memberId: { $in: [memberAId, memberBId, memberCId] },
    });
    await Notification.deleteMany({
      recipientId: { $in: [memberAId, memberBId, memberCId] },
    });
    await Member.deleteMany({ id: { $in: [memberAId, memberBId, memberCId] } });
    await MembershipPlan.deleteMany({ id: { $in: [plan1Id, plan2Id] } });
    await User.deleteMany({
      _id: { $in: [adminUserId, memberAUserId, memberBUserId] },
    });
    await disconnectDB();
  });

  // ── 1. Backend Discount Preview & Calculations Validation
  test("POST /api/v1/member-discounts/preview — calculates backend pricing and enforces validation limits", async () => {
    // Valid percentage calculation: 10% of 15,000 = 1,500 -> 13,500
    const resPercent = await request(app)
      .post("/api/v1/member-discounts/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        planId: plan1Id,
        discountType: "percentage",
        discountValue: 10,
      });

    expect(resPercent.status).toBe(200);
    expect(resPercent.body.data.standardPrice).toBe(15000);
    expect(resPercent.body.data.discountAmount).toBe(1500);
    expect(resPercent.body.data.finalPayableAmount).toBe(13500);

    // Valid fixed calculation: ₹3,000 off 15,000 = 12,000
    const resFixed = await request(app)
      .post("/api/v1/member-discounts/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        planId: plan1Id,
        discountType: "fixed",
        discountValue: 3000,
      });

    expect(resFixed.status).toBe(200);
    expect(resFixed.body.data.discountAmount).toBe(3000);
    expect(resFixed.body.data.finalPayableAmount).toBe(12000);

    // Invalid fixed: fixed discount exceeds plan price (e.g. 20,000 > 15,000)
    const resOverFixed = await request(app)
      .post("/api/v1/member-discounts/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        planId: plan1Id,
        discountType: "fixed",
        discountValue: 20000,
      });

    expect(resOverFixed.status).toBe(422);

    // Invalid percentage: > 100%
    const resOverPercent = await request(app)
      .post("/api/v1/member-discounts/preview")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        planId: plan1Id,
        discountType: "percentage",
        discountValue: 105,
      });

    expect(resOverPercent.status).toBe(422);
  });

  // ── 2. Bulk Operation with INDEPENDENT Configurations per Member
  test("POST /api/v1/member-discounts/bulk-assign — assigns different discounts to each member, notifies them in-app, and groups under campaignId", async () => {
    const payload = {
      campaignName: "Festive Strength Booster 2026",
      notifyMembers: true,
      discounts: [
        {
          memberId: memberAId,
          planId: plan1Id,
          discountType: "percentage",
          discountValue: 10, // 10% of 15,000 = ₹1,500 -> ₹13,500
          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
        {
          memberId: memberBId,
          planId: plan1Id,
          discountType: "fixed",
          discountValue: 2500, // ₹2,500 off 15,000 -> ₹12,500
          expiryDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        },
        {
          memberId: memberCId,
          planId: plan2Id,
          discountType: "percentage",
          discountValue: 15, // 15% of 48,000 = ₹7,200 -> ₹40,800
        },
      ],
    };

    const res = await request(app)
      .post("/api/v1/member-discounts/bulk-assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalAssigned).toBe(3);
    expect(res.body.data.campaignId).toMatch(/^CMP-\d{8}-\d{4}$/);
    assignedCampaignId = res.body.data.campaignId;

    const records = res.body.data.discounts;
    expect(records).toHaveLength(3);

    // Verify Member A: 10% off Plan 1
    const recA = records.find((r) => r.memberId === memberAId);
    expect(recA).toBeDefined();
    expect(recA.id).toMatch(/^DSC-\d{4}-\d{4}$/);
    expect(recA.discountType).toBe("percentage");
    expect(recA.discountValue).toBe(10);
    expect(recA.discountAmount).toBe(1500);
    expect(recA.finalPayableAmount).toBe(13500);
    expect(recA.status).toBe("Notified");
    expect(recA.notificationStatus).toBe("SENT");
    discountAId = recA.id;

    // Verify Member B: ₹2,500 fixed off Plan 1 (DIFFERENT configuration!)
    const recB = records.find((r) => r.memberId === memberBId);
    expect(recB).toBeDefined();
    expect(recB.discountType).toBe("fixed");
    expect(recB.discountValue).toBe(2500);
    expect(recB.discountAmount).toBe(2500);
    expect(recB.finalPayableAmount).toBe(12500);
    discountBId = recB.id;

    // Verify Member C: 15% off Plan 2 (DIFFERENT plan and percentage!)
    const recC = records.find((r) => r.memberId === memberCId);
    expect(recC).toBeDefined();
    expect(recC.planId).toBe(plan2Id);
    expect(recC.discountAmount).toBe(7200);
    expect(recC.finalPayableAmount).toBe(40800);
    discountCId = recC.id;

    // Verify In-App Notifications were dispatched individually to each member
    const notifsA = await Notification.find({ recipientId: memberAId });
    expect(notifsA.length).toBeGreaterThan(0);
    expect(notifsA[0].type).toBe("MEMBER_DISCOUNT_OFFER");
    expect(notifsA[0].data.discountId).toBe(discountAId);
    expect(notifsA[0].data.discountAmount).toBe(1500);

    const notifsB = await Notification.find({ recipientId: memberBId });
    expect(notifsB.length).toBeGreaterThan(0);
    expect(notifsB[0].data.discountId).toBe(discountBId);
    expect(notifsB[0].data.discountAmount).toBe(2500);
  });

  // ── 3. Duplicate Assignment Prevention (No Stacking)
  test("POST /api/v1/member-discounts/bulk-assign — blocks duplicate active discount assignment on same plan", async () => {
    const res = await request(app)
      .post("/api/v1/member-discounts/bulk-assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        discounts: [
          {
            memberId: memberAId,
            planId: plan1Id,
            discountType: "percentage",
            discountValue: 20,
          },
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already has an active discount");
  });

  // ── 4. Member Data Isolation
  test("GET /api/v1/member-discounts/my-active — returns member's own active offer without leaking others", async () => {
    // Member A queries their active discounts
    const resA = await request(app)
      .get("/api/v1/member-discounts/my-active")
      .set("Authorization", `Bearer ${memberAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data).toHaveLength(1);
    expect(resA.body.data[0].id).toBe(discountAId);
    expect(resA.body.data[0].memberId).toBe(memberAId);
    expect(resA.body.data[0].discountAmount).toBe(1500);

    // Member A attempts to directly view Member B's discount by ID -> Forbidden (403)
    const resForbidden = await request(app)
      .get(`/api/v1/member-discounts/${discountBId}`)
      .set("Authorization", `Bearer ${memberAToken}`);

    expect(resForbidden.status).toBe(403);
  });

  // ── 5. Admin List & Search Filtering
  test("GET /api/v1/member-discounts — admin can filter by campaign, status, and search", async () => {
    const res = await request(app)
      .get(`/api/v1/member-discounts?campaignId=${assignedCampaignId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.discounts).toHaveLength(3);
    expect(res.body.data.total).toBe(3);

    // Filter by discountType = 'fixed'
    const resFixedOnly = await request(app)
      .get(`/api/v1/member-discounts?campaignId=${assignedCampaignId}&discountType=fixed`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(resFixedOnly.body.data.discounts).toHaveLength(1);
    expect(resFixedOnly.body.data.discounts[0].memberId).toBe(memberBId);
  });

  // ── 6. Admin Cancellation of Unused Discount
  test("PATCH /api/v1/member-discounts/:id/cancel — cancels unused discount and preserves audit trail", async () => {
    const res = await request(app)
      .patch(`/api/v1/member-discounts/${discountCId}/cancel`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Member requested postponement of annual renewal." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("Cancelled");
    expect(res.body.data.cancellationReason).toBe(
      "Member requested postponement of annual renewal."
    );

    // Verify discount is no longer returned in active member offers
    const discCInDb = await MemberDiscount.findOne({ id: discountCId });
    expect(discCInDb.status).toBe("Cancelled");
    expect(discCInDb.auditLogs.some((l) => l.action === "DISCOUNT_CANCELLED")).toBe(true);
  });

  // ── 7. Apply Discount to Next Eligible Payment & Server-Side Verification
  test("POST /api/v1/member-discounts/:id/checkout-link & verify-payment — applies discount to renewal, marks redeemed, and activates plan", async () => {
    // Member A initiates checkout for their discounted plan
    const checkoutRes = await request(app)
      .post(`/api/v1/member-discounts/${discountAId}/checkout-link`)
      .set("Authorization", `Bearer ${memberAToken}`);

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.data.paymentUrl).toBeDefined();
    expect(checkoutRes.body.data.amount).toBe(13500); // 15000 - 1500 = 13500
    const gatewayOrderId = checkoutRes.body.data.orderId;

    // Verify discount is in Payment Pending state
    const pendingDisc = await MemberDiscount.findOne({ id: discountAId });
    expect(pendingDisc.status).toBe("Payment Pending");

    // Simulate online payment verification
    const mockPaymentId = `pay_sim_${Date.now()}`;
    const verifyRes = await request(app)
      .post(`/api/v1/member-discounts/${discountAId}/verify-payment`)
      .send({
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: "simulated_success",
        mockPayment: true,
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.member).toBeDefined();
    expect(verifyRes.body.data.paymentBreakdown.originalAmount).toBe(15000);
    expect(verifyRes.body.data.paymentBreakdown.discountAmount).toBe(1500);
    expect(verifyRes.body.data.paymentBreakdown.finalPayableAmount).toBe(13500);

    // Verify discount is now marked REDEEMED
    const redeemedDisc = await MemberDiscount.findOne({ id: discountAId });
    expect(redeemedDisc.status).toBe("Redeemed");
    expect(redeemedDisc.timesUsed).toBe(1);
    expect(redeemedDisc.redeemedAt).toBeDefined();
    expect(redeemedDisc.appliedToInvoice.paymentId).toBe(mockPaymentId);

    // ── 8. Idempotency Check: Repeating Verification Cannot Redeem Twice
    const repeatVerify = await request(app)
      .post(`/api/v1/member-discounts/${discountAId}/verify-payment`)
      .send({
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: "simulated_success",
        mockPayment: true,
      });

    expect(repeatVerify.status).toBe(200);
    expect(repeatVerify.body.data.alreadyRedeemed).toBe(true);
  });
});
