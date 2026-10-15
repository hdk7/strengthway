"use strict";

const mongoose = require("mongoose");
const { SUBSTITUTION_REASON, SUBSTITUTION_STATUS, SUBSTITUTION_ACTION } = require("../../shared/constants");

const batchSubstituteAuditSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
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
      required: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sessionDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startTime: {
      type: String,
      trim: true,
      default: "",
    },
    endTime: {
      type: String,
      trim: true,
      default: "",
    },
    timing: {
      type: String,
      trim: true,
      default: "",
    },
    classNumber: {
      type: Number,
      default: 1,
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    originalTrainerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalTrainerName: {
      type: String,
      required: true,
      trim: true,
    },
    substituteTrainerId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    substituteTrainerName: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      default: "Leave",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    actionType: {
      type: String,
      enum: Object.values(SUBSTITUTION_ACTION),
      required: true,
      index: true,
    },
    substitutionStatus: {
      type: String,
      enum: ["Scheduled", "Active", "Completed", "Cancelled", "None", "Proceeded Without Substitute"],
      default: "Scheduled",
      index: true,
    },
    performedBy: {
      type: String,
      trim: true,
      default: "Admin",
    },
    performedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    previousDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    idempotencyKey: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

batchSubstituteAuditSchema.index({ batchId: 1, performedAt: -1 });
batchSubstituteAuditSchema.index({ sessionId: 1, performedAt: -1 });
batchSubstituteAuditSchema.index({ idempotencyKey: 1 });

module.exports = mongoose.model("BatchSubstituteAudit", batchSubstituteAuditSchema);
