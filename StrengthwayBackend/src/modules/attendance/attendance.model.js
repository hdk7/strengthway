"use strict";

const mongoose = require("mongoose");
const { ATTENDANCE_STATUS, ATTENDANCE_EXCEPTION_TYPE } = require("../../shared/constants");

const attendanceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    monthYear: {
      type: String, // YYYY-MM for fast month-wise index scan
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
    batchName: {
      type: String,
      trim: true,
      default: "",
    },
    sessionId: {
      type: String,
      trim: true,
      default: "",
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
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
      index: true,
    },
    // Flag if attending via a flexible / temporary batch pass
    isFlexAttendance: {
      type: Boolean,
      default: false,
      index: true,
    },
    originalPrimaryBatchId: {
      type: String,
      trim: true,
      default: "",
    },
    assignmentId: {
      type: String,
      trim: true,
      default: "",
    },
    checkInTime: {
      type: String,
      trim: true,
      default: "",
    },
    checkOutTime: {
      type: String,
      trim: true,
      default: "",
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    checkoutBy: {
      type: String,
      enum: ["MEMBER", "SYSTEM", "ADMIN", ""],
      default: "",
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    isException: {
      type: Boolean,
      default: false,
      index: true,
    },
    exceptionType: {
      type: String,
      enum: Object.values(ATTENDANCE_EXCEPTION_TYPE),
      default: ATTENDANCE_EXCEPTION_TYPE.NONE,
      index: true,
    },
    exceptionFlags: {
      isLate: { type: Boolean, default: false },
      isEarlyDeparture: { type: Boolean, default: false },
      missingCheckout: { type: Boolean, default: false },
      autoCheckout: { type: Boolean, default: false },
      requiresReview: { type: Boolean, default: false },
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    trainerId: {
      type: String,
      trim: true,
      default: "",
    },
    markedBy: {
      type: String,
      trim: true,
      default: "Coach",
    },
    notes: {
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

// Compound indexes for fast month-wise, batch-wise, and member-wise reporting
attendanceSchema.index({ batchId: 1, monthYear: 1, date: 1 });
attendanceSchema.index({ memberId: 1, monthYear: 1 });

// Enforce at most one attendance record per member per calendar day at database level
attendanceSchema.index({ date: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
