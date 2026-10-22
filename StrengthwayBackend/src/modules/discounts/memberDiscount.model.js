"use strict";

const mongoose = require("mongoose");
const { MEMBER_DISCOUNT_STATUS, DISCOUNT_TYPES } = require("../../shared/constants");

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

const memberDiscountSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    campaignName: {
      type: String,
      trim: true,
      default: "Individual Member Discount Offer",
    },
    memberId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
      trim: true,
    },
    memberEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    memberMobile: {
      type: String,
      required: true,
      trim: true,
    },
    planId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planDurationMonths: {
      type: Number,
      default: 1,
      min: 1,
    },
    standardPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: [DISCOUNT_TYPES.PERCENTAGE, DISCOUNT_TYPES.FIXED],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },
    applicationRule: {
      type: String,
      enum: ["NEXT_PAYMENT_ONLY", "SINGLE_USE"],
      default: "NEXT_PAYMENT_ONLY",
    },
    usageLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    timesUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(MEMBER_DISCOUNT_STATUS),
      default: MEMBER_DISCOUNT_STATUS.ASSIGNED,
      index: true,
    },
    notificationStatus: {
      type: String,
      enum: ["PENDING", "SENT", "DELIVERED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    notificationId: {
      type: String,
      default: null,
      trim: true,
    },
    notificationSentAt: {
      type: Date,
      default: null,
    },
    assignedBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "Admin" },
      email: { type: String, default: "" },
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    appliedToInvoice: {
      invoiceNumber: { type: String, default: "", trim: true },
      paymentId: { type: String, default: "", trim: true },
      gatewayOrderId: { type: String, default: "", trim: true },
      transactionId: { type: String, default: "", trim: true },
      amountPaid: { type: Number, default: 0 },
      appliedAt: { type: Date, default: null },
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledBy: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    auditLogs: {
      type: [auditLogSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

memberDiscountSchema.index({ memberId: 1, planId: 1, status: 1 });
memberDiscountSchema.index({ campaignId: 1, createdAt: -1 });

module.exports = mongoose.model("MemberDiscount", memberDiscountSchema);
