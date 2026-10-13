"use strict";

const { ForbiddenError, UnauthorizedError } = require("../shared/apiError");
const { USER_ROLES } = require("../shared/constants");

/**
 * Role-based access control (RBAC) middleware factory.
 *
 * Must be used AFTER authenticate() — it assumes req.user is already set.
 *
 * Usage:
 *   const { authenticate } = require("../middleware/auth.middleware");
 *   const { requireRole }  = require("../middleware/role.middleware");
 *
 *   // Require admin role
 *   router.delete("/:id", authenticate, requireRole("admin"), ctrl.permanentDelete);
 *
 *   // Allow either admin OR trainer
 *   router.get("/", authenticate, requireRole("admin", "trainer"), ctrl.list);
 *
 * Defined roles (from constants.js USER_ROLES):
 *   "admin"   — Full access across all modules
 *   "trainer" — Read-only access to assigned members, batches, classes, own logs
 *   "member"  — Read-only access to own profile, own schedule, own logs, own receipts
 *   "staff"   — Legacy staff role (admin-like limited access)
 *
 * @param {...string} roles - One or more allowed role strings
 * @returns {import('express').RequestHandler}
 */
function requireRole(...roles) {
  return (req, res, next) => {
    // Ensure authenticate() ran first
    if (!req.user) {
      return next(
        new UnauthorizedError("Authentication required before checking role.")
      );
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Access denied. This action requires role: [${roles.join(", ")}]. Your role: ${userRole}.`
        )
      );
    }

    next();
  };
}

/**
 * Shorthand guard for admin-only routes.
 */
const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Shorthand guard for admin or trainer routes.
 */
const requireTrainer = requireRole(USER_ROLES.ADMIN, USER_ROLES.TRAINER);

/**
 * Shorthand guard for admin or member routes.
 */
const requireMember = requireRole(USER_ROLES.ADMIN, USER_ROLES.MEMBER);

/**
 * Shorthand guard for admin or staff routes.
 */
const requireStaff = requireRole(USER_ROLES.ADMIN, USER_ROLES.STAFF);

module.exports = {
  requireRole,
  requireAdmin,
  requireTrainer,
  requireMember,
  requireStaff,
};
