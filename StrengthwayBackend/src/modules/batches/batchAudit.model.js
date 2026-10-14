"use strict";

const mongoose = require("mongoose");
const {
  BATCH_AUDIT_ACTION,
  BATCH_AUDIT_ROLE,
  ASSIGNMENT_TYPE,
} = require("../../shared/constants");

const batchAuditSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    assignmentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    batchId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    batchRole: {
      type: String,
      enum: Object.values(BATCH_AUDIT_ROLE),
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: Object.values(BATCH_AUDIT_ACTION),
      required: true,
      index: true,
    },
    assignmentType: {
      type: String,
      enum: Object.values(ASSIGNMENT_TYPE),
      required: true,
      index: true,
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
    sourceBatchId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    sourceBatchName: {
      type: String,
      trim: true,
      default: "",
    },
    targetBatchId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    targetBatchName: {
      type: String,
      trim: true,
      default: "",
    },
    effectiveDate: {
      type: String,
      trim: true,
      default: "",
    },
    startDate: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    endDate: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    selectedDays: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
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
    rejoinedAt: {
      type: Date,
      default: null,
    },
    rejoinReason: {
      type: String,
      trim: true,
      default: "",
    },
    attendanceCount: {
      type: Number,
      default: 0,
    },
    relatedAuditId: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for fast lookup by batch, transaction, member, and date
batchAuditSchema.index({ batchId: 1, createdAt: -1 });
batchAuditSchema.index({ transactionId: 1 });
batchAuditSchema.index({ memberId: 1, createdAt: -1 });
batchAuditSchema.index({ batchId: 1, assignmentType: 1, status: 1 });
batchAuditSchema.index({ batchId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("BatchAudit", batchAuditSchema);
