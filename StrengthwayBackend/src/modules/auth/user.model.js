"use strict";

/**
 * Admin User model.
 * Stores gym admin credentials. Passwords are stored as bcrypt hashes.
 * A default admin is created by the auth seed / register endpoint in dev.
 */

const mongoose = require("mongoose");
const { USER_ROLES } = require("../../shared/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.ADMIN,
      index: true,
    },
    trainerId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    memberId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("User", userSchema);
