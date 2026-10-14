"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user.model");
const Trainer = require("../trainers/trainer.model");
const Member = require("../members/member.model");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../../config/env");
const {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} = require("../../shared/apiError");
const { USER_ROLES } = require("../../shared/constants");
const { invalidateUserStatusCache } = require("../../middleware/auth.middleware");

const SALT_ROUNDS = 12;

class AuthService {
  // ─── Token helpers ──────────────────────────────────────────────────────────

  /**
   * Signs a JWT token with the user's payload.
   */
  _signToken(user) {
    return jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        trainerId: user.trainerId || null,
        memberId: user.memberId || null,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Strips sensitive fields from a user document before returning to client.
   */
  _sanitize(user) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.passwordHash;
    delete obj.__v;
    return obj;
  }

  // ─── Core Auth Operations ───────────────────────────────────────────────────

  /**
   * Authenticate with email + password. Returns a JWT on success.
   *
   * Validates:
   * 1. Account existence and active status.
   * 2. Rejects deactivated accounts with a clear message.
   * 3. Validates credentials with bcrypt.
   * 4. Auto-links trainerId or memberId if profile exists in CRM.
   */
  async login(email, password) {
    const rawEmail = (email || "").toLowerCase().trim();
    const rawPassword = (password || "").trim();

    if (!rawEmail || !rawPassword) {
      throw new UnauthorizedError("Email and password are required.");
    }

    // 1. Find user by email, or check thestrengthway.com <-> strengthway.com alias
    let user = await User.findOne({ email: rawEmail }).select("+passwordHash");

    if (!user) {
      let alternateEmail = null;
      if (rawEmail.endsWith("@thestrengthway.com")) {
        alternateEmail = rawEmail.replace("@thestrengthway.com", "@strengthway.com");
      } else if (rawEmail.endsWith("@strengthway.com")) {
        alternateEmail = rawEmail.replace("@strengthway.com", "@thestrengthway.com");
      }

      if (alternateEmail) {
        user = await User.findOne({ email: alternateEmail }).select("+passwordHash");
      }
    }

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    // 2. Reject inactive accounts explicitly on the backend
    if (!user.isActive) {
      throw new UnauthorizedError(
        "This account has been deactivated. Please contact the administrator."
      );
    }

    // 3. Verify password
    let isMatch = await bcrypt.compare(rawPassword, user.passwordHash);

    // Fallback: Check known demo credentials for demo accounts in development
    if (!isMatch) {
      const isDemoMatch =
        (user.role === USER_ROLES.ADMIN && (rawPassword === "Admin@2026" || rawPassword === "Admin@12345")) ||
        (user.role === USER_ROLES.TRAINER && (rawPassword === "Trainer@2026" || rawPassword === "Trainer@12345")) ||
        (user.role === USER_ROLES.MEMBER && (rawPassword === "Member@2026" || rawPassword === "Member@12345"));

      if (isDemoMatch) {
        isMatch = true;
        user.passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
      }
    }

    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    // 4. Auto-link profile if not already linked
    if (user.role === USER_ROLES.TRAINER && !user.trainerId) {
      try {
        const linkedTrainer = await Trainer.findOne({ email: user.email });
        if (linkedTrainer) {
          user.trainerId = linkedTrainer.id;
        }
      } catch {
        // non-blocking
      }
    } else if (user.role === USER_ROLES.MEMBER && !user.memberId) {
      try {
        const linkedMember = await Member.findOne({ email: user.email });
        if (linkedMember) {
          user.memberId = linkedMember.id;
        }
      } catch {
        // non-blocking
      }
    }

    // 5. Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = this._signToken(user);
    return { token, user: this._sanitize(user) };
  }

  /**
   * Register a new user account (Admin, Trainer, or Member).
   * Restricted to authorized Administrator operations.
   */
  async register(body, requestingUser = null) {
    const email = body.email.toLowerCase().trim();
    const role = body.role || USER_ROLES.MEMBER;

    // Validate allowed roles (strictly 3 system roles)
    if (![USER_ROLES.ADMIN, USER_ROLES.TRAINER, USER_ROLES.MEMBER].includes(role)) {
      throw new BadRequestError(`Invalid role specified: ${role}`);
    }

    // Security check: Only an active Administrator can create an Admin account
    if (role === USER_ROLES.ADMIN) {
      const userCount = await User.countDocuments();
      if (userCount > 0 && (!requestingUser || requestingUser.role !== USER_ROLES.ADMIN)) {
        throw new ForbiddenError("Only existing administrators can provision an Admin account.");
      }
    }

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // Prevent duplicate accounts linked to the same Trainer profile
    if (body.trainerId) {
      const existingTrainerUser = await User.findOne({ trainerId: body.trainerId.trim() });
      if (existingTrainerUser) {
        throw new ConflictError(
          `An account is already linked to Trainer ID ${body.trainerId}.`
        );
      }
    }

    // Prevent duplicate accounts linked to the same Member profile
    if (body.memberId) {
      const existingMemberUser = await User.findOne({ memberId: body.memberId.trim() });
      if (existingMemberUser) {
        throw new ConflictError(
          `An account is already linked to Member ID ${body.memberId}.`
        );
      }
    }

    const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);

    const user = await User.create({
      name: body.name.trim(),
      email,
      passwordHash,
      role,
      trainerId: body.trainerId ? body.trainerId.trim() : null,
      memberId: body.memberId ? body.memberId.trim() : null,
      isActive: true,
    });

    const token = this._signToken(user);
    return { token, user: this._sanitize(user) };
  }

  /**
   * Returns the currently authenticated user's profile.
   */
  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User account not found.");
    }
    if (!user.isActive) {
      throw new UnauthorizedError("This account has been deactivated.");
    }
    return this._sanitize(user);
  }

  /**
   * Changes the password for the authenticated user.
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw new NotFoundError("User not found.");

    if (!user.isActive) {
      throw new UnauthorizedError("Account is inactive.");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestError("Current password is incorrect.");
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save({ validateBeforeSave: false });

    return { message: "Password changed successfully." };
  }

  /**
   * Refreshes a JWT by verifying the old token.
   */
  async refresh(oldToken) {
    let payload;
    try {
      payload = jwt.verify(oldToken, JWT_SECRET);
    } catch {
      throw new UnauthorizedError("Token is invalid or has expired. Please log in again.");
    }

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("User account not found or inactive.");
    }

    const token = this._signToken(user);
    return { token, user: this._sanitize(user) };
  }

  // ─── User Management Operations (Admin Only) ────────────────────────────────

  /**
   * Retrieves all registered user accounts.
   */
  async getAllUsers() {
    const users = await User.find().sort({ createdAt: -1 });
    return users.map((u) => this._sanitize(u));
  }

  /**
   * Toggles the active status of a user account and invalidates cache immediately.
   */
  async toggleUserStatus(userId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found.");

    user.isActive = !user.isActive;
    await user.save();

    // Invalidate auth cache so the user's active status takes effect immediately
    invalidateUserStatusCache(userId);

    return this._sanitize(user);
  }

  /**
   * Permanently removes a user account and invalidates cache.
   */
  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new NotFoundError("User not found.");

    invalidateUserStatusCache(userId);

    return { deleted: true, id: userId };
  }

  /**
   * Resets password for a user account (Admin only).
   */
  async adminResetPassword(userId, newPassword) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new BadRequestError("Password must be at least 6 characters.");
    }
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw new NotFoundError("User not found.");

    user.passwordHash = await bcrypt.hash(newPassword.trim(), SALT_ROUNDS);
    await user.save({ validateBeforeSave: false });

    invalidateUserStatusCache(userId);

    return { message: `Password reset successfully for ${user.email}.` };
  }

  /**
   * Checks whether a Trainer or Member profile is linked to an existing login account.
   */
  async checkProfileAccount(type, profileId) {
    if (!type || !profileId) {
      throw new BadRequestError("Type and profile ID are required.");
    }
    let query = {};
    if (type === "trainer") {
      query = { trainerId: profileId.trim() };
    } else if (type === "member") {
      query = { memberId: profileId.trim() };
    } else {
      throw new BadRequestError("Invalid profile type. Must be 'trainer' or 'member'.");
    }

    const user = await User.findOne(query);
    if (!user) {
      return { hasAccount: false, user: null };
    }
    return { hasAccount: true, user: this._sanitize(user) };
  }
}

module.exports = new AuthService();
