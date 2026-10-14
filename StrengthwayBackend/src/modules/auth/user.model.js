"use strict";

/**
 * User Identity Model
 * ===================
 * Stores authentication credentials for the three supported system roles:
 * - admin:   System Administrator with full facility management authority
 * - trainer: Faculty Coach linked to a Trainer profile via trainerId
 * - member:  Gym Athlete linked to a Member profile via memberId
 *
 * Passwords are saved as bcrypt hashes.
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
      enum: [USER_ROLES.ADMIN, USER_ROLES.TRAINER, USER_ROLES.MEMBER],
      default: USER_ROLES.MEMBER,
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
      index: true,
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
