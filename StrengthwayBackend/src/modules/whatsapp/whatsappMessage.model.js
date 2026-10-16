"use strict";

const mongoose = require("mongoose");

const deliveryHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "sent", "delivered", "read", "failed", "simulated"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const whatsappAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: String,
      required: true,
      default: "System",
      trim: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const whatsappMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    enrollmentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    inquiryId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    candidateName: {
      type: String,
      trim: true,
      default: "",
    },
    planName: {
      type: String,
      trim: true,
      default: "",
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    messageType: {
      type: String,
      enum: ["template", "text", "simulated"],
      default: "template",
    },
    templateName: {
      type: String,
      trim: true,
      default: "membership_payment_link",
    },
    language: {
      type: String,
      trim: true,
      default: "en_US",
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed", "simulated"],
      default: "pending",
      index: true,
    },
    deliveryHistory: {
      type: [deliveryHistorySchema],
      default: [],
    },
    failureReason: {
      type: String,
      trim: true,
      default: "",
    },
    errorCode: {
      type: String,
      trim: true,
      default: "",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    initiatedBy: {
      type: String,
      trim: true,
      default: "Admin",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    paymentLink: {
      type: String,
      trim: true,
      default: "",
    },
    messageContent: {
      type: String,
      default: "",
    },
    whatsappWebUrl: {
      type: String,
      default: "",
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    rawWebhookPayloads: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    auditLogs: {
      type: [whatsappAuditLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

whatsappMessageSchema.index({ createdAt: -1 });
whatsappMessageSchema.index({ status: 1, createdAt: -1 });
whatsappMessageSchema.index({ enrollmentId: 1, createdAt: -1 });

module.exports = mongoose.model("WhatsAppMessage", whatsappMessageSchema);
