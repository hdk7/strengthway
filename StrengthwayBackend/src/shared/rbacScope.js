"use strict";

const Batch = require("../modules/batches/batch.model");
const Member = require("../modules/members/member.model");
const Session = require("../modules/schedules/session.model");
const { USER_ROLES } = require("./constants");
const { ForbiddenError, UnauthorizedError } = require("./apiError");

/**
 * RbacScope
 * =========
 * Centralized service to calculate and enforce relationship-based scoping (ReBAC/ABAC)
 * for Gym CRM roles:
 *
 * - Admin: Full, unrestricted access to all entities.
 * - Trainer: Access scoped strictly to assigned batches, assigned members, own profile, own logs.
 * - Member: Access scoped strictly to own profile, own batch details, own attendance, own receipts.
 */
class RbacScope {
  /**
   * Retrieves all Batch IDs assigned to a specific trainer.
   * Checks both Batch.trainerIds array and Session.coachId.
   *
   * @param {string} trainerId - e.g. "TRN-101"
   * @returns {Promise<string[]>}
   */
  async getTrainerAssignedBatchIds(trainerId) {
    if (!trainerId) return [];

    const [batches, sessions] = await Promise.all([
      Batch.find({ trainerIds: trainerId }, { id: 1 }).lean(),
      Session.find(
        {
          $or: [
            { coachId: trainerId },
            { substituteCoachId: trainerId, substitutionStatus: { $ne: "CANCELLED" } },
          ],
        },
        { batchId: 1 }
      ).lean(),
    ]);

    const batchIdSet = new Set();
    batches.forEach((b) => {
      if (b.id) batchIdSet.add(b.id);
    });
    sessions.forEach((s) => {
      if (s.batchId) batchIdSet.add(s.batchId);
    });

    return Array.from(batchIdSet);
  }

  /**
   * Retrieves all Member IDs assigned to a specific trainer.
   * A member is assigned if they belong to a batch assigned to the trainer,
   * or are explicitly listed in batch.memberIds for a batch coached by the trainer.
   *
   * @param {string} trainerId - e.g. "TRN-101"
   * @returns {Promise<string[]>}
   */
  async getTrainerAssignedMemberIds(trainerId) {
    if (!trainerId) return [];

    const batchIds = await this.getTrainerAssignedBatchIds(trainerId);

    const [membersInBatches, batchesWithMembers] = await Promise.all([
      batchIds.length > 0
        ? Member.find(
            {
              $or: [
                { batchId: { $in: batchIds } },
                { "activeFlexAssignments.targetBatchId": { $in: batchIds } },
              ],
            },
            { id: 1 }
          ).lean()
        : [],
      Batch.find({ trainerIds: trainerId }, { memberIds: 1 }).lean(),
    ]);

    const memberIdSet = new Set();
    membersInBatches.forEach((m) => {
      if (m.id) memberIdSet.add(m.id);
    });
    batchesWithMembers.forEach((b) => {
      if (Array.isArray(b.memberIds)) {
        b.memberIds.forEach((mid) => {
          if (mid) memberIdSet.add(mid);
        });
      }
    });

    return Array.from(memberIdSet);
  }

  /**
   * Retrieves all Batch IDs associated with a specific member.
   * Includes their primary batch and any active flex assignments.
   *
   * @param {string} memberId - e.g. "MEM-2001"
   * @returns {Promise<string[]>}
   */
  async getMemberEnrolledBatchIds(memberId) {
    if (!memberId) return [];

    const idRegex = new RegExp(`^${memberId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i");

    const [member, batchesWithMember] = await Promise.all([
      Member.findOne(
        { $or: [{ id: idRegex }, { id: memberId }] },
        { batchId: 1, schedule: 1, activeFlexAssignments: 1 }
      ).lean(),
      Batch.find({ memberIds: { $in: [memberId, idRegex] } }, { id: 1 }).lean(),
    ]);

    const batchIdSet = new Set();
    if (member?.batchId) batchIdSet.add(member.batchId);
    if (member?.schedule?.batchId) batchIdSet.add(member.schedule.batchId);
    if (Array.isArray(member?.activeFlexAssignments)) {
      member.activeFlexAssignments.forEach((fa) => {
        if (fa.targetBatchId) batchIdSet.add(fa.targetBatchId);
      });
    }
    batchesWithMember.forEach((b) => {
      if (b.id) batchIdSet.add(b.id);
    });

    return Array.from(batchIdSet);
  }

  /**
   * Asserts whether the authenticated user has permission to view/interact
   * with the target member record.
   *
   * @param {object} user - req.user from JWT
   * @param {string} targetMemberId
   */
  async assertCanAccessMember(user, targetMemberId) {
    if (!user) {
      throw new UnauthorizedError("Authentication required.");
    }
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF) {
      return true;
    }

    if (user.role === USER_ROLES.MEMBER) {
      if (!user.memberId || user.memberId !== targetMemberId) {
        throw new ForbiddenError("Access denied. You can only view your own member profile.");
      }
      return true;
    }

    if (user.role === USER_ROLES.TRAINER) {
      const assignedIds = await this.getTrainerAssignedMemberIds(user.trainerId);
      if (!assignedIds.includes(targetMemberId)) {
        throw new ForbiddenError("Access denied. You can only view members assigned to your batches.");
      }
      return true;
    }

    throw new ForbiddenError("Access denied.");
  }

  /**
   * Asserts whether the authenticated user has permission to view
   * the target trainer profile.
   *
   * @param {object} user - req.user from JWT
   * @param {string} targetTrainerId
   */
  async assertCanAccessTrainer(user, targetTrainerId) {
    if (!user) {
      throw new UnauthorizedError("Authentication required.");
    }
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF) {
      return true;
    }

    if (user.role === USER_ROLES.TRAINER) {
      if (!user.trainerId || user.trainerId !== targetTrainerId) {
        throw new ForbiddenError("Access denied. You can only view your own trainer profile.");
      }
      return true;
    }

    // Members have no access to trainer profiles in CRM
    throw new ForbiddenError("Access denied. Members do not have access to trainer records in CRM.");
  }

  /**
   * Asserts whether the authenticated user has permission to view
   * the target batch details.
   *
   * @param {object} user - req.user from JWT
   * @param {string} targetBatchId
   */
  async assertCanAccessBatch(user, targetBatchId) {
    if (!user) {
      throw new UnauthorizedError("Authentication required.");
    }
    if (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF) {
      return true;
    }

    if (user.role === USER_ROLES.TRAINER) {
      const assignedBatches = await this.getTrainerAssignedBatchIds(user.trainerId);
      if (!assignedBatches.includes(targetBatchId)) {
        throw new ForbiddenError("Access denied. You can only view batches assigned to you.");
      }
      return true;
    }

    if (user.role === USER_ROLES.MEMBER) {
      const enrolledBatches = await this.getMemberEnrolledBatchIds(user.memberId);
      const cleanTarget = (targetBatchId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const isAllowed = enrolledBatches.some((b) => {
        const cleanB = (b || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return b === targetBatchId || cleanB === cleanTarget;
      });
      if (!isAllowed) {
        throw new ForbiddenError("Access denied. You can only view your own enrolled batch details.");
      }
      return true;
    }

    throw new ForbiddenError("Access denied.");
  }
}

module.exports = new RbacScope();
