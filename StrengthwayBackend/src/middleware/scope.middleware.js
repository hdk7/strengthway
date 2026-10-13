"use strict";

const rbacScope = require("../shared/rbacScope");
const { USER_ROLES } = require("../shared/constants");
const { ForbiddenError, UnauthorizedError } = require("../shared/apiError");

/**
 * Middleware: Scopes collection query for GET /api/v1/members
 */
async function scopeMemberQuery(req, res, next) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.STAFF) {
      req.scopedMemberIds = null;
      return next();
    }

    if (req.user.role === USER_ROLES.TRAINER) {
      const assignedIds = await rbacScope.getTrainerAssignedMemberIds(req.user.trainerId);
      req.scopedMemberIds = assignedIds;
      return next();
    }

    if (req.user.role === USER_ROLES.MEMBER) {
      req.scopedMemberIds = req.user.memberId ? [req.user.memberId] : [];
      return next();
    }

    return next(new ForbiddenError("Access denied."));
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Guards individual member record access (GET /api/v1/members/:id)
 */
async function scopeMemberDoc(req, res, next) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    // Support "me" alias
    if (req.params.id === "me") {
      if (req.user.role === USER_ROLES.MEMBER && req.user.memberId) {
        req.params.id = req.user.memberId;
      } else {
        return next(new ForbiddenError("Only member accounts have a personal member profile."));
      }
    }

    await rbacScope.assertCanAccessMember(req.user, req.params.id);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Scopes collection query for GET /api/v1/trainers
 */
async function scopeTrainerQuery(req, res, next) {
  try {
    // Unauthenticated public request (marketing / portfolio website)
    if (!req.user) {
      req.scopedTrainerIds = null;
      return next();
    }

    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.STAFF) {
      req.scopedTrainerIds = null;
      return next();
    }

    if (req.user.role === USER_ROLES.TRAINER) {
      req.scopedTrainerIds = req.user.trainerId ? [req.user.trainerId] : [];
      return next();
    }

    if (req.user.role === USER_ROLES.MEMBER) {
      return next(new ForbiddenError("Access denied. Members do not have access to trainer management."));
    }

    return next(new ForbiddenError("Access denied."));
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Guards individual trainer record access (GET /api/v1/trainers/:id)
 */
async function scopeTrainerDoc(req, res, next) {
  try {
    // Unauthenticated public request (marketing / portfolio trainer profile)
    if (!req.user) {
      return next();
    }

    // Support "me" alias
    if (req.params.id === "me") {
      if (req.user.role === USER_ROLES.TRAINER && req.user.trainerId) {
        req.params.id = req.user.trainerId;
      } else {
        return next(new ForbiddenError("Only trainer accounts have a personal trainer profile."));
      }
    }

    await rbacScope.assertCanAccessTrainer(req.user, req.params.id);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Scopes collection query for GET /api/v1/batches
 */
async function scopeBatchQuery(req, res, next) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    if (req.user.role === USER_ROLES.ADMIN || req.user.role === USER_ROLES.STAFF) {
      req.scopedBatchIds = null;
      return next();
    }

    if (req.user.role === USER_ROLES.TRAINER) {
      const assignedBatches = await rbacScope.getTrainerAssignedBatchIds(req.user.trainerId);
      req.scopedBatchIds = assignedBatches;
      return next();
    }

    if (req.user.role === USER_ROLES.MEMBER) {
      const enrolledBatches = await rbacScope.getMemberEnrolledBatchIds(req.user.memberId);
      req.scopedBatchIds = enrolledBatches;
      return next();
    }

    return next(new ForbiddenError("Access denied."));
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Guards individual batch record access (GET /api/v1/batches/:id)
 */
async function scopeBatchDoc(req, res, next) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required."));
    }

    await rbacScope.assertCanAccessBatch(req.user, req.params.id);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  scopeMemberQuery,
  scopeMemberDoc,
  scopeTrainerQuery,
  scopeTrainerDoc,
  scopeBatchQuery,
  scopeBatchDoc,
};
