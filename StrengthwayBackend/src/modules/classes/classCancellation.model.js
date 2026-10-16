"use strict";

const mongoose = require("mongoose");

const rescheduledSessionMappingSchema = new mongoose.Schema(
  {
    sessionId: { type: String, trim: true },
    classNumber: { type: Number },
    className: { type: String, trim: true },
    classId: { type: String, trim: true },
    originalDate: { type: String, trim: true },
    originalDay: { type: String, trim: true },
    newDate: { type: String, trim: true },
    newDay: { type: String, trim: true },
    isDisplaced: { type: Boolean, default: false },
  },
  { _id: false }
);

const affectedMemberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    mobile: { type: String, trim: true, default: "" },
    membershipPlanId: { type: String, trim: true, default: "" },
    membershipPlanName: { type: String, trim: true, default: "" },
    planPrice: { type: Number, default: 0 },
    durationMonths: { type: Number, default: 1 },
    perClassRate: { type: Number, default: 0 },
    cancelledClassesCount: { type: Number, default: 0 },
    adjustmentCredit: { type: Number, default: 0 },
    creditId: { type: String, trim: true, default: "" },
    willRenew: { type: Boolean, default: true },
    status: {
      type: String,
      enum: [
        "CREDITED_PENDING_RENEWAL",
        "CARRIED_FORWARD_NO_RENEWAL",
        "ADJUSTED_ON_PAYMENT",
      ],
      default: "CREDITED_PENDING_RENEWAL",
    },
  },
  { _id: false }
);

const classCancellationAuditSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    batchId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    batchName: {
      type: String,
      trim: true,
      default: "",
    },
    cancellationType: {
      type: String,
      enum: ["WEEKLY", "DATE_RANGE", "SPECIFIC_CLASSES"],
      required: true,
      default: "WEEKLY",
      index: true,
    },
    startDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledSessionIds: {
      type: [String],
      default: [],
    },
    cancelledDates: {
      type: [String],
      default: [],
    },
    cancelledCount: {
      type: Number,
      default: 0,
    },
    rescheduledMapping: {
      type: [rescheduledSessionMappingSchema],
      default: [],
    },
    displacedFutureSessionsCount: {
      type: Number,
      default: 0,
    },
    affectedMembers: {
      type: [affectedMemberSchema],
      default: [],
    },
    totalAdjustmentAmount: {
      type: Number,
      default: 0,
    },
    pricingPolicyApplied: {
      type: {
        type: String,
        default: "PROPORTIONAL_PER_CLASS",
      },
      baseMonthlySessions: {
        type: Number,
        default: 12,
      },
      calculatedPerClassRate: {
        type: Number,
        default: 0,
      },
    },
    performedBy: {
      type: String,
      required: true,
      trim: true,
      default: "Admin",
    },
    status: {
      type: String,
      enum: ["CONFIRMED", "REVERTED"],
      default: "CONFIRMED",
    },
    revertedAt: {
      type: Date,
      default: null,
    },
    revertedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

classCancellationAuditSchema.index({ batchId: 1, createdAt: -1 });
classCancellationAuditSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model(
  "ClassCancellationAudit",
  classCancellationAuditSchema
);
