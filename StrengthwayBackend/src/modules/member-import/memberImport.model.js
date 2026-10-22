"use strict";

const mongoose = require("mongoose");

const memberImportErrorSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number, required: true },
    identifier: { type: String, default: "" },
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    reason: { type: String, required: true },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const memberImportHistorySchema = new mongoose.Schema(
  {
    importId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    adminId: { type: String, default: "" },
    adminName: { type: String, default: "Admin" },
    adminEmail: { type: String, default: "" },
    sourceFilename: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    totalRows: { type: Number, default: 0 },
    createdCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdMemberIds: { type: [String], default: [] },
    updatedMemberIds: { type: [String], default: [] },
    skippedMemberIds: { type: [String], default: [] },
    errors: { type: [memberImportErrorSchema], default: [] },
    status: {
      type: String,
      enum: ["COMPLETED", "PARTIAL", "FAILED"],
      default: "COMPLETED",
    },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
    versionKey: false,
    suppressReservedKeysWarning: true,
  }
);

memberImportHistorySchema.index({ createdAt: -1 });

const memberImportConfigSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    googleFormUrl: {
      type: String,
      default: "https://docs.google.com/forms/d/e/1FAIpQLScP_StrengthWayMemberRegistrationTemplate/viewform",
      trim: true,
    },
    googleSheetUrl: { type: String, default: "", trim: true },
    customMappings: { type: Map, of: String, default: {} },
    instructions: { type: String, default: "" },
    updatedBy: { type: String, default: "Admin" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const MemberImportHistory = mongoose.model(
  "MemberImportHistory",
  memberImportHistorySchema
);

const MemberImportConfig = mongoose.model(
  "MemberImportConfig",
  memberImportConfigSchema
);

module.exports = {
  MemberImportHistory,
  MemberImportConfig,
};
