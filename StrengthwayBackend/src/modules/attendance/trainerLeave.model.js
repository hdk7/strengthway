"use strict";

const mongoose = require("mongoose");
const { TRAINER_LEAVE_STATUS } = require("../../shared/constants");

const trainerLeaveSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    trainerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    trainerName: {
      type: String,
      required: true,
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ["REGULAR", "EMERGENCY"],
      default: "REGULAR",
      index: true,
    },
    requestedStartDate: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    requestedEndDate: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    totalRequestedDays: {
      type: Number,
      required: true,
      min: 1,
    },
    approvedStartDate: {
      type: String, // YYYY-MM-DD
      default: null,
      trim: true,
    },
    approvedEndDate: {
      type: String, // YYYY-MM-DD
      default: null,
      trim: true,
    },
    totalApprovedDays: {
      type: Number,
      default: 0,
    },
    leaveStartDate: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    leaveEndDate: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    submittedOn: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    actualNoticeDays: {
      type: Number,
      default: 0,
    },
    requiredNoticeDays: {
      type: Number,
      default: 0,
    },
    tierLabel: {
      type: String,
      trim: true,
      default: "",
    },
    isNoticeCompliant: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowPolicyOverride: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(TRAINER_LEAVE_STATUS),
      default: TRAINER_LEAVE_STATUS.PENDING,
      index: true,
    },
    adminDecision: {
      type: String,
      enum: ["PENDING", "APPROVED", "DENIED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    reviewedBy: {
      type: String,
      trim: true,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    policyComplianceResult: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    annualLeaveCalculation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    affectedBatchIds: {
      type: [String],
      default: [],
    },
    auditLogs: {
      type: [
        {
          action: { type: String, required: true },
          actor: { type: String, default: "System" },
          timestamp: { type: Date, default: Date.now },
          remarks: { type: String, default: "" },
          details: { type: mongoose.Schema.Types.Mixed, default: {} },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

trainerLeaveSchema.index({ trainerId: 1, leaveStartDate: 1 });
trainerLeaveSchema.index({ status: 1, leaveStartDate: 1 });

module.exports = mongoose.model("TrainerLeave", trainerLeaveSchema);
