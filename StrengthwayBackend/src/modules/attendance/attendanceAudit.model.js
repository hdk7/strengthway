"use strict";

const mongoose = require("mongoose");

const attendanceAuditSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    attendanceType: {
      type: String,
      enum: ["MEMBER", "TRAINER"],
      required: true,
      index: true,
    },
    recordId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    memberId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    trainerId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    batchId: {
      type: String,
      trim: true,
      default: "",
    },
    sessionId: {
      type: String,
      trim: true,
      default: "",
    },
    intervalId: {
      type: String,
      trim: true,
      default: "",
    },
    action: {
      type: String,
      enum: [
        "CHECK_IN",
        "CHECK_OUT",
        "AUTO_CHECKOUT",
        "SESSION_TRANSITION",
        "ADMIN_OVERRIDE",
        "CORRECTION",
        "STATUS_UPDATE",
        "BULK_MARK",
      ],
      required: true,
      index: true,
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: String,
      required: true,
      trim: true,
      default: "Admin",
    },
    performedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

attendanceAuditSchema.index({ attendanceType: 1, date: 1 });
attendanceAuditSchema.index({ memberId: 1, createdAt: -1 });
attendanceAuditSchema.index({ trainerId: 1, createdAt: -1 });
attendanceAuditSchema.index({ recordId: 1, createdAt: -1 });

module.exports = mongoose.model("AttendanceAudit", attendanceAuditSchema);
