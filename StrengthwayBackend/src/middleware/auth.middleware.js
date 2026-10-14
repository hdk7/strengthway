"use strict";

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { UnauthorizedError } = require("../shared/apiError");
const User = require("../modules/auth/user.model");

// In-memory cache for user account status to avoid redundant DB queries on every HTTP request
// Map<userId, { user: object, cachedAt: number }>
const userStatusCache = new Map();
const USER_CACHE_TTL_MS = 10000; // 10 seconds TTL for fast updates

/**
 * Invalidates the cached user status so changes (like deactivation) take effect immediately.
 * @param {string} userId
 */
function invalidateUserStatusCache(userId) {
  if (userId) {
    userStatusCache.delete(userId.toString());
  } else {
    userStatusCache.clear();
  }
}

/**
 * authenticate — Protects routes that require a valid JWT and an active account.
 *
 * Security checks:
 * 1. Verifies Bearer token presence and JWT cryptographic validity.
 * 2. Validates that the account still exists in the database.
 * 3. Rejects deactivated or disabled accounts (isActive === false) immediately.
 * 4. Refreshes req.user with up-to-date role, trainerId, and memberId.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError(
        "Authentication required. Please provide a valid Bearer token."
      )
    );
  }

  const token = authHeader.split(" ")[1];

  if (!token || token.trim() === "") {
    return next(new UnauthorizedError("Authentication token is missing."));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Check account status (cached with 10s TTL or fetched fresh)
    const now = Date.now();
    const cached = userStatusCache.get(payload.id);

    let activeUser = null;
    if (cached && now - cached.cachedAt < USER_CACHE_TTL_MS) {
      activeUser = cached.user;
    } else {
      activeUser = await User.findById(payload.id).select(
        "_id email role name trainerId memberId isActive"
      );
      if (activeUser) {
        userStatusCache.set(payload.id, {
          user: activeUser,
          cachedAt: now,
        });
      }
    }

    // Verify account exists
    if (!activeUser) {
      return next(
        new UnauthorizedError("User account no longer exists. Access revoked.")
      );
    }

    // Verify account is active (prevents deactivated users from accessing protected APIs)
    if (!activeUser.isActive) {
      return next(
        new UnauthorizedError(
          "Your account has been deactivated. Please contact the administrator."
        )
      );
    }

    // Attach fresh user identity to req.user
    req.user = {
      id: activeUser._id.toString(),
      email: activeUser.email,
      role: activeUser.role,
      name: activeUser.name,
      trainerId: activeUser.trainerId || null,
      memberId: activeUser.memberId || null,
      isActive: true,
      iat: payload.iat,
      exp: payload.exp,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError("Your session has expired. Please log in again.")
      );
    }
    if (err.name === "JsonWebTokenError") {
      return next(new UnauthorizedError("Invalid authentication token."));
    }
    return next(err);
  }
}

/**
 * optionalAuth — Attaches user to req if a valid token is present and active,
 * but does NOT block requests without a token.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select(
        "_id email role name trainerId memberId isActive"
      );
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
          trainerId: user.trainerId || null,
          memberId: user.memberId || null,
          isActive: true,
        };
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  invalidateUserStatusCache,
};
