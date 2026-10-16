"use strict";

const mongoose = require("mongoose");
const { TRAINER_LOG_STATUS, ATTENDANCE_EXCEPTION_TYPE } = require("../../shared/constants");

const trainerLogSchema = new mongoose.Schema(
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
    intervalId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    isContinuous: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TRAINER_LOG_STATUS),
      default: TRAINER_LOG_STATUS.CONDUCTED,
      index: true,
    },
    substituteTrainerId: {
      type: String,
      trim: true,
      default: null,
    },
    originalTrainerId: {
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
    scheduledStartTime: {
      type: String,
      trim: true,
      default: "",
    },
    scheduledEndTime: {
      type: String,
      trim: true,
      default: "",
    },
    scheduledDurationMinutes: {
      type: Number,
      default: 60,
    },
    actualPresenceMinutes: {
      type: Number,
      default: 60,
    },
    // Duration in minutes that the trainer was present during this scheduled session (teaching duration overlap)
    durationMinutes: {
      type: Number,
      default: 60,
    },
    checkoutBy: {
      type: String,
      enum: ["TRAINER", "SYSTEM", "ADMIN", ""],
      default: "",
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    transitionedFromSessionId: {
      type: String,
      trim: true,
      default: "",
    },
    transitionedToSessionId: {
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
    attendeesCount: {
      type: Number,
      default: 0,
    },
    markedBy: {
      type: String,
      trim: true,
      default: "System",
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

trainerLogSchema.index({ trainerId: 1, monthYear: 1 });
trainerLogSchema.index({ batchId: 1, monthYear: 1 });
trainerLogSchema.index({ date: 1, trainerId: 1, sessionId: 1 });
trainerLogSchema.index({ date: 1, trainerId: 1, batchId: 1 });

module.exports = mongoose.model("TrainerLog", trainerLogSchema);
