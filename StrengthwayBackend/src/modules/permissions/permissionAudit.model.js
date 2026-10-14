"use strict";

const mongoose = require("mongoose");

const permissionAuditSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: ["UPDATE", "RESET"],
      default: "UPDATE",
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changedByName: {
      type: String,
      default: "System Administrator",
    },
    changedByEmail: {
      type: String,
      default: "admin@thestrengthway.com",
    },
    changesSummary: {
      type: [String],
      default: [],
    },
    previousPermissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    newPermissions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("PermissionAudit", permissionAuditSchema);
