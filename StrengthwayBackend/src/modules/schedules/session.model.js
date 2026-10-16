"use strict";

const mongoose = require("mongoose");
const { SESSION_STATUS } = require("../../shared/constants");

const sessionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    masterScheduleId: {
      type: String,
      required: false,
      trim: true,
      default: "",
      index: true,
    },
    masterScheduleName: {
      type: String,
      trim: true,
      default: "",
    },
    masterClassItemId: {
      type: String,
      trim: true,
      default: "",
    },
    classId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    classNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    weekNumber: {
      type: Number,
      default: 1,
    },
    dayOfWeek: {
      type: String,
      trim: true,
      default: "Monday",
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
    coachId: {
      type: String,
      trim: true,
      default: "TRN-101",
    },
    coachName: {
      type: String,
      trim: true,
      default: "Assigned Coach",
    },
    originalCoachId: {
      type: String,
      trim: true,
      default: "",
    },
    originalCoachName: {
      type: String,
      trim: true,
      default: "",
    },
    substituteCoachId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    substituteCoachName: {
      type: String,
      trim: true,
      default: "",
    },
    isSubstituted: {
      type: Boolean,
      default: false,
      index: true,
    },
    substitutionReason: {
      type: String,
      enum: ["Leave", "Absent", "Emergency", "Other", "LEAVE", "ABSENT", "EMERGENCY", "OTHER", "None", "NONE", ""],
      default: "",
    },
    substitutionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    substitutionStatus: {
      type: String,
      enum: ["NONE", "SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"],
      default: "NONE",
      index: true,
    },
    substitutionAssignedBy: {
      type: String,
      trim: true,
      default: "",
    },
    substitutionAssignedAt: {
      type: Date,
      default: null,
    },
    substitutionCancelledBy: {
      type: String,
      trim: true,
      default: "",
    },
    substitutionCancelledAt: {
      type: Date,
      default: null,
    },
    substitutionCancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    sessionDate: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    displayDate: {
      type: String,
      trim: true,
      default: "",
    },
    startTime: {
      type: String,
      trim: true,
      default: "06:00 AM",
    },
    endTime: {
      type: String,
      trim: true,
      default: "07:00 AM",
    },
    timing: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    beginnerWorkouts: {
      type: String,
      trim: true,
      default: "",
    },
    intermediateWorkouts: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.SCHEDULED,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    capacity: {
      type: Number,
      default: 28,
    },
    attendedCount: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    isCancelled: {
      type: Boolean,
      default: false,
      index: true,
    },
    cancellationId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      trim: true,
      default: "",
    },
    rescheduledToDate: {
      type: String,
      trim: true,
      default: "",
    },
    isRescheduled: {
      type: Boolean,
      default: false,
      index: true,
    },
    rescheduledFromDate: {
      type: String,
      trim: true,
      default: "",
    },
    rescheduledFromSessionId: {
      type: String,
      trim: true,
      default: "",
    },
    originalSessionDate: {
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

sessionSchema.index({ masterScheduleId: 1, batchId: 1, classNumber: 1 });
sessionSchema.index(
  { batchId: 1, sessionDate: 1 },
  { unique: true, partialFilterExpression: { sessionDate: { $type: "string", $gt: "" } } }
);
sessionSchema.index({ batchId: 1, classId: 1 });

module.exports = mongoose.model("Session", sessionSchema);
