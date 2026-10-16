"use strict";

const mongoose = require("mongoose");
const { ENROLLMENT_STATUS, DISCOUNT_TYPES, GENDER } = require("../../shared/constants");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: String,
      required: true,
      default: "Admin",
      trim: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const personalDetailsSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: "" },
    name: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    gender: { type: String, enum: GENDER, default: "Male" },
    dob: { type: String, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "Bengaluru" },
    state: { type: String, trim: true, default: "Karnataka" },
    pincode: { type: String, trim: true, default: "" },
    emergencyName: { type: String, trim: true, default: "" },
    emergencyPhone: { type: String, trim: true, default: "" },
    emergencyRelation: { type: String, trim: true, default: "Other" },
    bio: { type: String, trim: true, default: "" },
    photo: { type: String, default: null },
    photoName: { type: String, default: null },
  },
  { _id: false }
);

const membershipPlanSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    formattedPrice: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    formattedStart: { type: String, trim: true },
    formattedEnd: { type: String, trim: true },
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    originalPrice: { type: Number, required: true, min: 0 },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPES),
      default: DISCOUNT_TYPES.NONE,
    },
    discountValue: { type: Number, default: 0, min: 0 },
    discountReason: { type: String, trim: true, default: "" },
    discountAmount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "Pending Payment",
        "Paid",
        "Partially Paid",
        "Payment Failed",
        "Payment Expired",
        "Cancelled",
      ],
      default: "Pending Payment",
      index: true,
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date, default: null },
    paymentGateway: {
      type: String,
      enum: ["Razorpay", "Simulated", "Cash", "UPI", "Card", "None"],
      default: "Razorpay",
    },
    gatewayOrderId: { type: String, default: "" },
    gatewayPaymentId: { type: String, default: "" },
    gatewaySignature: { type: String, default: "" },
    paymentLink: {
      linkId: { type: String, default: "" },
      url: { type: String, default: "" },
      shortUrl: { type: String, default: "" },
      expiresAt: { type: Date, default: null },
      status: { type: String, default: "Created" },
    },
  },
  { _id: false }
);

const whatsappStatusSchema = new mongoose.Schema(
  {
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    messageId: { type: String, default: null },
    deliveryStatus: {
      type: String,
      enum: [
        "None",
        "Pending",
        "Sent",
        "Delivered",
        "Read",
        "Failed",
        "Simulated",
      ],
      default: "None",
    },
    resendCount: { type: Number, default: 0 },
    lastResentAt: { type: Date, default: null },
    lastDeliveredAt: { type: Date, default: null },
    messageContent: { type: String, default: "" },
    whatsappWebUrl: { type: String, default: "" },
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    inquiryId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    personalDetails: {
      type: personalDetailsSchema,
      required: true,
    },
    membershipPlan: {
      type: membershipPlanSnapshotSchema,
      required: true,
    },
    batchId: {
      type: String,
      trim: true,
      default: "",
    },
    batchName: {
      type: String,
      trim: true,
      default: "",
    },
    batchTiming: {
      type: String,
      trim: true,
      default: "",
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["PAYMENT_LINK", "OFFLINE_CASH", "OFFLINE_UPI", "CARD"],
      default: "PAYMENT_LINK",
    },
    status: {
      type: String,
      enum: Object.values(ENROLLMENT_STATUS),
      default: ENROLLMENT_STATUS.PENDING_PAYMENT,
      index: true,
    },
    invoice: {
      type: invoiceSchema,
      required: true,
    },
    whatsappStatus: {
      type: whatsappStatusSchema,
      default: () => ({}),
    },
    convertedMemberId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
    auditLogs: {
      type: [auditLogSchema],
      default: [],
    },
    createdBy: {
      type: String,
      trim: true,
      default: "Admin",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
enrollmentSchema.index({ status: 1, isDeleted: 1 });
enrollmentSchema.index({ inquiryId: 1, status: 1 });
enrollmentSchema.index({ "personalDetails.email": 1 });
enrollmentSchema.index({ "personalDetails.mobile": 1 });
enrollmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
