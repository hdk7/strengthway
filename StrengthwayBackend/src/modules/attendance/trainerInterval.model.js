"use strict";

const mongoose = require("mongoose");
const { ATTENDANCE_STATUS, ATTENDANCE_EXCEPTION_TYPE } = require("../../shared/constants");

const sessionOverlapSchema = new mongoose.Schema(
  {
    sessionId: { type: String, trim: true, default: "" },
    batchId: { type: String, trim: true, default: "" },
    batchName: { type: String, trim: true, default: "" },
    className: { type: String, trim: true, default: "" },
    startTime: { type: String, trim: true, default: "" },
    endTime: { type: String, trim: true, default: "" },
    scheduledDurationMinutes: { type: Number, default: 60 },
    overlapMinutes: { type: Number, default: 0 },
    status: { type: String, default: "PRESENT" },
    remarks: { type: String, trim: true, default: "" },
    isSubstituted: { type: Boolean, default: false },
    substituteTrainerId: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const trainerIntervalSchema = new mongoose.Schema(
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
      type: String, // YYYY-MM
      required: true,
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
    checkInTime: {
      type: String,
      required: true,
      trim: true,
    },
    checkOutTime: {
      type: String,
      trim: true,
      default: "",
    },
    // Total physical presence duration from recorded timestamps (checkOutTime - checkInTime)
    actualDurationMinutes: {
      type: Number,
      default: 0,
    },
    // Combined teaching duration during scheduled sessions, excluding off-schedule time
    totalTeachingDurationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
      index: true,
    },
    isContinuous: {
      type: Boolean,
      default: false,
      index: true,
    },
    sessionIds: {
      type: [String],
      default: [],
      index: true,
    },
    batchIds: {
      type: [String],
      default: [],
    },
    sessionOverlaps: {
      type: [sessionOverlapSchema],
      default: [],
    },
    checkoutBy: {
      type: String,
      enum: ["TRAINER", "SYSTEM", "ADMIN", ""],
      default: "",
    },
    consecutiveSessionId: {
      type: String,
      trim: true,
      default: "",
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
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    markedBy: {
      type: String,
      trim: true,
      default: "System",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

trainerIntervalSchema.index({ date: 1, trainerId: 1 });
trainerIntervalSchema.index({ trainerId: 1, monthYear: 1 });
trainerIntervalSchema.index({ date: 1, trainerId: 1, checkInTime: 1 }, { unique: true });

module.exports = mongoose.model("TrainerInterval", trainerIntervalSchema);
