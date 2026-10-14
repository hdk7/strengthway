"use strict";

const mongoose = require("mongoose");
const { USER_ROLES } = require("../../shared/constants");
const { MODULES } = require("../../shared/permissions");

const permissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: [USER_ROLES.TRAINER, USER_ROLES.MEMBER, USER_ROLES.STAFF],
    },
    permissions: {
      type: Map,
      of: [String],
      default: () => new Map(),
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedByName: {
      type: String,
      default: "System Administrator",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        // Convert Map to plain object for clean API response
        if (ret.permissions instanceof Map) {
          ret.permissions = Object.fromEntries(ret.permissions);
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("RolePermission", permissionSchema);
