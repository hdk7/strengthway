"use strict";

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    recipientId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["admin", "trainer", "member", "all"],
      default: "all",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "LEAVE_APPROVED",
        "LEAVE_DENIED",
        "LEAVE_REQUESTED",
        "SUBSTITUTE_ASSIGNED",
        "GENERAL",
      ],
      default: "GENERAL",
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
