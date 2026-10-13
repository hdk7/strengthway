"use strict";

const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sessionId: {
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
    batchName: {
      type: String,
      trim: true,
      default: "",
    },
    className: {
      type: String,
      trim: true,
      default: "",
    },
    classNumber: {
      type: Number,
      default: 1,
    },
    sessionDate: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    timing: {
      type: String,
      trim: true,
      default: "",
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
      default: "",
    },
    sessionSummary: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    memberPerformance: {
      type: String,
      trim: true,
      default: "",
    },
    observations: {
      type: String,
      trim: true,
      default: "",
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUBMITTED"],
      default: "SUBMITTED",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedBy: {
      type: String,
      trim: true,
      default: "",
    },
    lastUpdatedRole: {
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

// Compound index to guarantee only 1 note per trainer per scheduled session
sessionNoteSchema.index({ sessionId: 1, trainerId: 1 }, { unique: true });
sessionNoteSchema.index({ batchId: 1, sessionDate: 1 });
sessionNoteSchema.index({ sessionDate: 1, status: 1 });

module.exports = mongoose.model("SessionNote", sessionNoteSchema);
