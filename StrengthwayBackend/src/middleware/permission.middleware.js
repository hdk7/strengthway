"use strict";

const { ForbiddenError, UnauthorizedError } = require("../shared/apiError");
const { USER_ROLES } = require("../shared/constants");
const permissionService = require("../modules/permissions/permission.service");

/**
 * Dynamic RBAC Permission Middleware Factory
 * ==========================================
 * Verifies that the authenticated user's role has permission to perform
 * the requested action on the target module.
 *
 * Rules:
 * 1. Admin role ALWAYS bypasses all checks (Super-Admin immutability).
 * 2. Non-admin roles are checked against the dynamic permission registry
 *    (cached in-memory, refreshed immediately on Admin edits).
 *
 * @param {string} moduleName - Module identifier (e.g. 'members', 'attendance', 'payments')
 * @param {...string} actions - One or more actions (e.g. 'view', 'edit', 'mark_attendance')
 * @returns {import('express').RequestHandler}
 */
function requirePermission(moduleName, ...actions) {
  return async (req, res, next) => {
    // 1. Must be authenticated
    if (!req.user) {
      return next(
        new UnauthorizedError("Authentication required before checking permissions.")
      );
    }

    const userRole = req.user.role;

    // 2. Super-Admin bypass rule (never lock out system administrators)
    if (userRole === USER_ROLES.ADMIN) {
      return next();
    }

    try {
      // 3. Fetch role permissions from cache
      const rolePerms = await permissionService.getRolePermissions(userRole);
      const allowedActions = rolePerms[moduleName] || [];

      // Check if user has at least one of the specified actions
      const hasAccess = actions.some((action) => allowedActions.includes(action));

      if (!hasAccess) {
        return next(
          new ForbiddenError(
            `Access Denied: Role '${userRole}' lacks permission for [${moduleName}:${actions.join("|")}]. Contact your gym administrator.`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Record-Level Access Restriction for Member Endpoints
 * Ensures members can ONLY access their own personal record, while Admins & Trainers have authorized access.
 *
 * @param {string} [idParamKey='id'] - The route param key holding the memberId
 */
function requireMemberSelfOrStaff(idParamKey = "id") {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    // Admins and Trainers with view_assigned permission can proceed
    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.TRAINER) {
      return next();
    }

    // Members can strictly access their own memberId
    if (req.user.role === USER_ROLES.MEMBER) {
      const targetMemberId = req.params[idParamKey] || req.body?.memberId;
      const myMemberId = req.user.memberId;

      if (!targetMemberId || !myMemberId || targetMemberId !== myMemberId) {
        return next(
          new ForbiddenError(
            "Access Denied: Athletes may only view or manage their own personal profile records."
          )
        );
      }
    }

    next();
  };
}

module.exports = {
  requirePermission,
  requireMemberSelfOrStaff,
};
