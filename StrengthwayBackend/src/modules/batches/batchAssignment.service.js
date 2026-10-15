"use strict";

const batchRepository = require("./batch.repository");
const memberRepository = require("../members/member.repository");
const BatchAssignment = require("./batchAssignment.model");
const BatchAudit = require("./batchAudit.model");
const Member = require("../members/member.model");
const batchValidationService = require("./batchValidation.service");
const {
  generateAssignmentId,
  generateAssignmentTransactionId,
  generateBatchAuditId,
} = require("../../shared/idGenerator");
const {
  ASSIGNMENT_TYPE,
  ASSIGNMENT_STATUS,
  BATCH_AUDIT_ACTION,
  BATCH_AUDIT_ROLE,
} = require("../../shared/constants");
const { NotFoundError, BadRequestError } = require("../../shared/apiError");

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

class BatchAssignmentService {
  /**
   * 1. Permanently transfers a member to a new primary batch.
   * - Records previous batch in member's batchHistory.
   * - Unenrolls member from previous batch and decrements pax count.
   * - Enrolls member in new batch and increments pax count.
   * - Updates primary batchId, batchName, batchTiming, assignedBatch, schedule.
   * - Stores an immutable BatchAssignment record with unique transaction ID.
   * - Creates linked audit logs in BOTH the source and target batches referencing transaction ID.
   */
  async executePermanentTransfer({
    memberId,
    targetBatchId,
    effectiveDate,
    reason = "Permanent batch transfer",
    transferredBy = "Admin",
  }) {
    const validated = await batchValidationService.validatePermanentTransfer({
      memberId,
      targetBatchId,
      effectiveDate,
      reason,
    });

    const { member, targetBatch, currentBatch } = validated;
    const assignmentId = generateAssignmentId();
    const transactionId = generateAssignmentTransactionId("TRF");
    const sourceBatchId = currentBatch ? currentBatch.id : (member.batchId || "UNASSIGNED");
    const sourceBatchName = currentBatch ? currentBatch.name : (member.batchName || "Unassigned");
    const sourceTiming = currentBatch ? currentBatch.timingLabel : (member.batchTiming || "");

    // 1. Prepare history entry of the previous batch
    const historyEntry = {
      assignmentId,
      transactionId,
      type: ASSIGNMENT_TYPE.PERMANENT_TRANSFER,
      batchId: sourceBatchId,
      batchName: sourceBatchName,
      batchTiming: sourceTiming,
      sourceBatchId,
      sourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      selectedDays: currentBatch && Array.isArray(currentBatch.daysList) ? currentBatch.daysList : [],
      startDate: member.registeredAt
        ? new Date(member.registeredAt).toISOString().slice(0, 10)
        : effectiveDate,
      endDate: effectiveDate,
      reason: reason || "Permanent batch transfer",
      transferredAt: new Date(),
      transferredBy: transferredBy || "Admin",
      status: "COMPLETED",
    };

    // 2. Unenroll from current batch
    if (member.batchId && member.batchId !== targetBatch.id) {
      await batchRepository.removeMember(member.batchId, member.id).catch(() => null);
    }

    // 3. Enroll into target batch
    await batchRepository.addMember(targetBatch.id, member.id);

    // 4. Cancel/complete any active flex assignments to avoid conflicts
    const activeFlexList = Array.isArray(member.activeFlexAssignments) ? member.activeFlexAssignments : [];
    if (activeFlexList.length > 0) {
      const activeFlexIds = activeFlexList.map((f) => f.assignmentId);
      await BatchAssignment.updateMany(
        { id: { $in: activeFlexIds }, status: { $in: [ASSIGNMENT_STATUS.ACTIVE, ASSIGNMENT_STATUS.SCHEDULED] } },
        {
          $set: {
            status: ASSIGNMENT_STATUS.CANCELLED,
            cancelledAt: new Date(),
            rejoinReason: `Superseded by permanent transfer to ${targetBatch.name}`,
          },
        }
      );
    }

    // 5. Update member document
    const updatedMember = await Member.findOneAndUpdate(
      { id: member.id },
      {
        $set: {
          batchId: targetBatch.id,
          batchName: targetBatch.name,
          batchTiming: targetBatch.timingLabel,
          assignedBatch: targetBatch.name,
          schedule: {
            batchId: targetBatch.id,
            batchName: targetBatch.name,
            batchTiming: targetBatch.timingLabel,
            daysLabel: targetBatch.daysLabel,
            daysPattern: targetBatch.daysPattern,
          },
          activeFlexAssignments: [],
        },
        $push: { batchHistory: historyEntry },
      },
      { returnDocument: "after", lean: true }
    );

    // 5b. Sync Pax and MemberIds for both batches now that member document has transitioned
    if (sourceBatchId && sourceBatchId !== targetBatch.id) {
      await batchRepository.syncPaxCount(sourceBatchId).catch(() => null);
    }
    await batchRepository.syncPaxCount(targetBatch.id).catch(() => null);

    // 6. Create immutable BatchAssignment document
    const assignment = await BatchAssignment.create({
      id: assignmentId,
      transactionId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      assignmentType: ASSIGNMENT_TYPE.PERMANENT_TRANSFER,
      sourceBatchId,
      sourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      selectedDays: targetBatch.daysList || [],
      startDate: effectiveDate,
      endDate: null,
      status: ASSIGNMENT_STATUS.COMPLETED,
      completedAt: new Date(),
      reason,
      transferredBy,
      metadata: {
        previousTiming: sourceTiming,
        newTiming: targetBatch.timingLabel,
      },
    });

    // 7. Create linked audit logs in BOTH the source and target batches
    const sourceAuditId = generateBatchAuditId();
    const targetAuditId = generateBatchAuditId();

    const sourceAudit = await BatchAudit.create({
      id: sourceAuditId,
      transactionId,
      assignmentId,
      batchId: sourceBatchId,
      batchRole: BATCH_AUDIT_ROLE.SOURCE,
      actionType: BATCH_AUDIT_ACTION.TRANSFER_OUT,
      assignmentType: ASSIGNMENT_TYPE.PERMANENT_TRANSFER,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      sourceBatchId,
      sourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      effectiveDate,
      startDate: effectiveDate,
      endDate: null,
      selectedDays: targetBatch.daysList || [],
      status: "Transferred Out",
      reason,
      performedBy: transferredBy,
      performedAt: new Date(),
      relatedAuditId: targetAuditId,
      metadata: {
        newBatchTiming: targetBatch.timingLabel,
      },
    });

    const targetAudit = await BatchAudit.create({
      id: targetAuditId,
      transactionId,
      assignmentId,
      batchId: targetBatch.id,
      batchRole: BATCH_AUDIT_ROLE.TARGET,
      actionType: BATCH_AUDIT_ACTION.TRANSFER_IN,
      assignmentType: ASSIGNMENT_TYPE.PERMANENT_TRANSFER,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      sourceBatchId,
      sourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      effectiveDate,
      startDate: effectiveDate,
      endDate: null,
      selectedDays: targetBatch.daysList || [],
      status: "Transferred In",
      reason,
      performedBy: transferredBy,
      performedAt: new Date(),
      relatedAuditId: sourceAuditId,
      metadata: {
        previousBatchTiming: sourceTiming,
      },
    });

    return {
      success: true,
      transactionId,
      assignment: assignment.toObject ? assignment.toObject() : assignment,
      member: updatedMember,
      targetBatch,
      sourceAudit: sourceAudit.toObject ? sourceAudit.toObject() : sourceAudit,
      targetAudit: targetAudit.toObject ? targetAudit.toObject() : targetAudit,
    };
  }

  /**
   * 2. Creates a temporary flexible assignment for specific days.
   * - Does NOT remove member from their primary home batch.
   * - Stores flex pass in member's activeFlexAssignments.
   * - Stores BatchAssignment record of type TEMPORARY_FLEX with transaction ID.
   * - Sets initial status (SCHEDULED if startDate > today, otherwise ACTIVE).
   * - Creates linked audit logs in BOTH the source and target batches.
   */
  async createFlexibleAssignment({
    memberId,
    sourceBatchId,
    targetBatchId,
    selectedDays,
    startDate,
    endDate = null,
    reason = "Temporary flexible pass",
    transferredBy = "Admin",
  }) {
    const validated = await batchValidationService.validateFlexibleAssignment({
      memberId,
      sourceBatchId,
      targetBatchId,
      selectedDays,
      startDate,
      endDate,
      reason,
    });

    const { member, targetBatch, currentBatch } = validated;
    const assignmentId = generateAssignmentId();
    const transactionId = generateAssignmentTransactionId("FLX");

    const todayStr = new Date().toISOString().slice(0, 10);
    const initialStatus = startDate > todayStr
      ? ASSIGNMENT_STATUS.SCHEDULED
      : ASSIGNMENT_STATUS.ACTIVE;
    const statusLabel = initialStatus === ASSIGNMENT_STATUS.SCHEDULED ? "Scheduled" : "Active";

    const effectiveDays = validated.selectedDays || targetBatch.daysList || [];
    const effSourceBatchId = currentBatch ? currentBatch.id : (member.batchId || "UNASSIGNED");
    const effSourceBatchName = currentBatch ? currentBatch.name : (member.batchName || "Unassigned");

    const flexEntry = {
      assignmentId,
      transactionId,
      sourceBatchId: effSourceBatchId,
      sourceBatchName: effSourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      targetBatchTiming: targetBatch.timingLabel,
      selectedDays: effectiveDays,
      startDate,
      endDate: endDate || null,
      reason: reason || "Flexible attendance pass",
      status: initialStatus,
    };

    // Update member's active flex passes
    const updatedMember = await Member.findOneAndUpdate(
      { id: member.id },
      {
        $push: { activeFlexAssignments: flexEntry },
      },
      { returnDocument: "after", lean: true }
    );

    // Create BatchAssignment document
    const assignment = await BatchAssignment.create({
      id: assignmentId,
      transactionId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      sourceBatchId: effSourceBatchId,
      sourceBatchName: effSourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      selectedDays: effectiveDays,
      startDate,
      endDate: endDate || null,
      status: initialStatus,
      reason,
      transferredBy,
      metadata: {
        primaryBatchId: member.batchId,
        primaryBatchName: member.batchName,
      },
    });

    // Create linked audit logs in BOTH the source and target batches
    const sourceAuditId = generateBatchAuditId();
    const targetAuditId = generateBatchAuditId();

    const sourceAudit = await BatchAudit.create({
      id: sourceAuditId,
      transactionId,
      assignmentId,
      batchId: effSourceBatchId,
      batchRole: BATCH_AUDIT_ROLE.SOURCE,
      actionType: initialStatus === ASSIGNMENT_STATUS.SCHEDULED
        ? BATCH_AUDIT_ACTION.FLEX_OUT_SCHEDULED
        : BATCH_AUDIT_ACTION.FLEX_ACTIVATED,
      assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      sourceBatchId: effSourceBatchId,
      sourceBatchName: effSourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      effectiveDate: startDate,
      startDate,
      endDate: endDate || null,
      selectedDays: effectiveDays,
      status: statusLabel,
      reason,
      performedBy: transferredBy,
      performedAt: new Date(),
      relatedAuditId: targetAuditId,
      metadata: {
        targetBatchTiming: targetBatch.timingLabel,
      },
    });

    const targetAudit = await BatchAudit.create({
      id: targetAuditId,
      transactionId,
      assignmentId,
      batchId: targetBatch.id,
      batchRole: BATCH_AUDIT_ROLE.TARGET,
      actionType: initialStatus === ASSIGNMENT_STATUS.SCHEDULED
        ? BATCH_AUDIT_ACTION.FLEX_IN_SCHEDULED
        : BATCH_AUDIT_ACTION.FLEX_ACTIVATED,
      assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      sourceBatchId: effSourceBatchId,
      sourceBatchName: effSourceBatchName,
      targetBatchId: targetBatch.id,
      targetBatchName: targetBatch.name,
      effectiveDate: startDate,
      startDate,
      endDate: endDate || null,
      selectedDays: effectiveDays,
      status: statusLabel,
      reason,
      performedBy: transferredBy,
      performedAt: new Date(),
      attendanceCount: 0,
      relatedAuditId: sourceAuditId,
      metadata: {
        sourceBatchTiming: currentBatch ? currentBatch.timingLabel : "",
      },
    });

    return {
      success: true,
      transactionId,
      assignment: assignment.toObject ? assignment.toObject() : assignment,
      member: updatedMember,
      targetBatch,
      sourceAudit: sourceAudit.toObject ? sourceAudit.toObject() : sourceAudit,
      targetAudit: targetAudit.toObject ? targetAudit.toObject() : targetAudit,
    };
  }

  /**
   * 3. Cancels or revokes an active/scheduled flexible assignment.
   */
  async revokeFlexibleAssignment(assignmentId, reason = "Revoked by admin", revokedBy = "Admin") {
    const mongoose = require("mongoose");
    const orConditions = [
      { id: assignmentId },
      { transactionId: assignmentId },
      {
        memberId: assignmentId,
        assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
        status: { $in: [ASSIGNMENT_STATUS.ACTIVE, ASSIGNMENT_STATUS.SCHEDULED] },
      },
    ];
    if (mongoose.isValidObjectId(assignmentId)) {
      orConditions.push({ _id: assignmentId });
    }

    const assignment = await BatchAssignment.findOne({ $or: orConditions });
    if (!assignment) {
      throw new NotFoundError(`Batch assignment with ID "${assignmentId}" not found.`);
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    assignment.status = ASSIGNMENT_STATUS.REVOKED;
    assignment.cancelledAt = now;
    assignment.isRejoined = true;
    assignment.rejoinedAt = now;
    assignment.rejoinReason = reason;
    assignment.metadata = {
      ...assignment.metadata,
      revokedAt: now,
      revocationReason: reason,
      revokedBy,
    };
    await assignment.save();

    // Pull from activeFlexAssignments in member document and record into batchHistory
    await Member.findOneAndUpdate(
      { id: assignment.memberId },
      {
        $pull: {
          activeFlexAssignments: {
            $or: [
              { assignmentId: assignment.id },
              ...(assignment.transactionId ? [{ transactionId: assignment.transactionId }] : []),
              { targetBatchId: assignment.targetBatchId },
            ],
          },
        },
        $push: {
          batchHistory: {
            assignmentId: assignment.id,
            transactionId: assignment.transactionId,
            type: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
            batchId: assignment.targetBatchId,
            batchName: assignment.targetBatchName,
            sourceBatchId: assignment.sourceBatchId,
            sourceBatchName: assignment.sourceBatchName,
            targetBatchId: assignment.targetBatchId,
            targetBatchName: assignment.targetBatchName,
            selectedDays: assignment.selectedDays,
            startDate: assignment.startDate,
            endDate: todayStr,
            reason: `Revoked: ${reason}`,
            transferredAt: now,
            transferredBy: revokedBy,
            rejoinedAt: now,
            rejoinReason: reason,
            status: "REVOKED",
          },
        },
      }
    );

    // Update both source and target audit records
    if (assignment.transactionId) {
      await BatchAudit.updateMany(
        { transactionId: assignment.transactionId },
        {
          $set: {
            status: "Cancelled",
            rejoinedAt: now,
            rejoinReason: reason,
            actionType: BATCH_AUDIT_ACTION.FLEX_CANCELLED,
          },
        }
      );
    }

    return {
      success: true,
      id: assignment.id,
      transactionId: assignment.transactionId,
      status: ASSIGNMENT_STATUS.REVOKED,
      revokedAt: now,
      rejoinedAt: now,
    };
  }

  /**
   * 4. Automatic Rejoining and Expiration Engine (Idempotent).
   * - Restores original batch when flex period ends.
   * - Activates SCHEDULED assignments when startDate arrives.
   * - Updates audit logs in both source and target batches.
   * - Safe to run repeatedly during cron, on startup, or on demand.
   */
  async processExpiredFlexAssignments(referenceDateStr = null) {
    const todayStr = referenceDateStr || new Date().toISOString().slice(0, 10);
    const now = new Date();

    let activatedCount = 0;
    let rejoinedCount = 0;

    // 1. Activate scheduled assignments whose startDate has arrived
    const scheduledAssignments = await BatchAssignment.find({
      assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      status: ASSIGNMENT_STATUS.SCHEDULED,
      startDate: { $lte: todayStr },
      $or: [{ endDate: null }, { endDate: { $gte: todayStr } }],
    });

    for (const asg of scheduledAssignments) {
      asg.status = ASSIGNMENT_STATUS.ACTIVE;
      await asg.save();

      // Update Member active flex entry
      await Member.updateOne(
        { id: asg.memberId, "activeFlexAssignments.assignmentId": asg.id },
        { $set: { "activeFlexAssignments.$.status": ASSIGNMENT_STATUS.ACTIVE } }
      );

      // Update Audit Logs
      if (asg.transactionId) {
        await BatchAudit.updateMany(
          { transactionId: asg.transactionId },
          {
            $set: {
              status: "Active",
              actionType: BATCH_AUDIT_ACTION.FLEX_ACTIVATED,
            },
          }
        );
      }
      activatedCount++;
    }

    // 2. Complete and automatically rejoin members whose flex endDate has passed
    const expiredAssignments = await BatchAssignment.find({
      assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      status: { $in: [ASSIGNMENT_STATUS.ACTIVE, ASSIGNMENT_STATUS.SCHEDULED] },
      endDate: { $ne: null, $lt: todayStr },
    });

    for (const asg of expiredAssignments) {
      asg.status = ASSIGNMENT_STATUS.COMPLETED;
      asg.completedAt = now;
      asg.isRejoined = true;
      asg.rejoinedAt = now;
      asg.rejoinReason = "Flex period ended - automatically returned to original batch";
      await asg.save();

      // Fetch member to record batch history
      const member = await Member.findOne({ id: asg.memberId });
      if (member) {
        // Remove from active flex passes
        await Member.updateOne(
          { id: asg.memberId },
          {
            $pull: {
              activeFlexAssignments: {
                $or: [
                  { assignmentId: asg.id },
                  ...(asg.transactionId ? [{ transactionId: asg.transactionId }] : []),
                  { targetBatchId: asg.targetBatchId },
                ],
              },
            },
            $push: {
              batchHistory: {
                assignmentId: asg.id,
                transactionId: asg.transactionId,
                type: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
                batchId: asg.targetBatchId,
                batchName: asg.targetBatchName,
                sourceBatchId: asg.sourceBatchId || member.batchId,
                sourceBatchName: asg.sourceBatchName || member.batchName,
                targetBatchId: asg.targetBatchId,
                targetBatchName: asg.targetBatchName,
                selectedDays: asg.selectedDays,
                startDate: asg.startDate,
                endDate: asg.endDate,
                reason: `Completed flex pass. Returned to home batch ${member.batchName || ""}`.trim(),
                transferredAt: now,
                transferredBy: "System (Auto-Rejoin)",
                rejoinedAt: now,
                rejoinReason: "Flex period ended - automatically rejoined home batch",
                status: "COMPLETED",
              },
            },
          }
        );
      }

      // Update Audit Logs in both batches
      if (asg.transactionId || asg.id) {
        const auditOr = [];
        if (asg.transactionId) auditOr.push({ transactionId: asg.transactionId });
        if (asg.id) auditOr.push({ assignmentId: asg.id });

        await BatchAudit.updateMany(
          { $or: auditOr },
          {
            $set: {
              status: ASSIGNMENT_STATUS.COMPLETED,
              rejoinedAt: now,
              rejoinReason: "Flex period ended - automatically returned to original batch",
              actionType: BATCH_AUDIT_ACTION.MEMBER_REJOINED,
              "metadata.completedAt": now,
            },
          }
        );
      }

      rejoinedCount++;
    }

    return {
      success: true,
      referenceDate: todayStr,
      activatedCount,
      rejoinedCount,
      totalProcessed: activatedCount + rejoinedCount,
    };
  }

  /**
   * 5. Increments attendance count on target batch audit log when flex attendance is recorded.
   */
  async recordFlexAttendanceCount(assignmentId) {
    if (!assignmentId) return;
    await BatchAudit.updateOne(
      {
        assignmentId,
        batchRole: BATCH_AUDIT_ROLE.TARGET,
        assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      },
      {
        $inc: { attendanceCount: 1 },
      }
    ).catch(() => null);
  }

  /**
   * 6. Retrieves batch audit history with filters (member, date range, assignment type, status, role).
   */
  async getBatchAuditLogs(batchId, query = {}) {
    // Run lazy expiration check to ensure statuses are up-to-date
    await this.processExpiredFlexAssignments().catch(() => null);

    const filter = { batchId };

    if (query.memberId) {
      filter.memberId = query.memberId;
    }

    if (query.assignmentType && query.assignmentType !== "ALL" && query.assignmentType !== "All") {
      filter.assignmentType = query.assignmentType;
    }

    if (query.status && query.status !== "ALL" && query.status !== "All") {
      filter.status = new RegExp(`^${query.status}$`, "i");
    }

    if (query.role && query.role !== "ALL" && query.role !== "All") {
      filter.batchRole = query.role.toUpperCase();
    }

    if (query.transactionId) {
      filter.transactionId = query.transactionId;
    }

    if (query.startDate) {
      filter.startDate = { $gte: query.startDate };
    }

    if (query.endDate) {
      filter.endDate = { $lte: query.endDate };
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { memberName: new RegExp(s, "i") },
        { memberId: new RegExp(s, "i") },
        { reason: new RegExp(s, "i") },
        { transactionId: new RegExp(s, "i") },
        { sourceBatchName: new RegExp(s, "i") },
        { targetBatchName: new RegExp(s, "i") },
      ];
    }

    const logs = await BatchAudit.find(filter).sort({ performedAt: -1, createdAt: -1 }).lean();

    return {
      batchId,
      totalCount: logs.length,
      logs,
    };
  }

  /**
   * 7. Retrieves complete batch assignment history and active flex passes for a member.
   */
  async getMemberAssignments(memberId) {
    const member = await memberRepository.findById(memberId);
    if (!member) {
      throw new NotFoundError(`Member with ID "${memberId}" not found.`);
    }

    // Run lazy expiration check
    await this.processExpiredFlexAssignments().catch(() => null);

    const assignments = await BatchAssignment.find({ memberId }).sort({ createdAt: -1 }).lean();
    const refreshedMember = await memberRepository.findById(memberId);

    return {
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`.trim(),
      primaryBatch: {
        batchId: refreshedMember.batchId || "",
        batchName: refreshedMember.batchName || "Unassigned",
        batchTiming: refreshedMember.batchTiming || "",
      },
      activeFlexAssignments: refreshedMember.activeFlexAssignments || [],
      batchHistory: refreshedMember.batchHistory || [],
      assignmentsLog: assignments,
    };
  }

  /**
   * 8. Resolves the effective batch for a member on any given calendar date.
   * If member has an active flex pass covering targetDate and the corresponding day of week,
   * returns target flex batch. Otherwise returns primary batch.
   */
  async getEffectiveBatchForMemberOnDate(memberId, targetDateStr) {
    const member = await memberRepository.findById(memberId);
    if (!member) return null;

    const dateObj = new Date(targetDateStr);
    const dayOfWeek = DAY_NAMES[dateObj.getDay()];

    // 1. Check permanent transfers history for retroactive dates
    const batchHistory = Array.isArray(member.batchHistory) ? member.batchHistory : [];
    const transferEntries = batchHistory
      .filter((h) => h.type === ASSIGNMENT_TYPE.PERMANENT_TRANSFER && h.startDate)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));

    for (const t of transferEntries) {
      if (t.startDate && targetDateStr < t.startDate) {
        return {
          batchId: t.batchId || t.sourceBatchId,
          batchName: t.batchName || t.sourceBatchName,
          batchTiming: t.batchTiming,
          isFlex: false,
          flexAssignmentId: null,
          primaryBatchId: t.batchId || t.sourceBatchId,
          primaryBatchName: t.batchName || t.sourceBatchName,
          dayOfWeek,
          isHistoricTransfer: true,
        };
      }
    }

    // 2. Check active flex passes
    const flexPasses = Array.isArray(member.activeFlexAssignments)
      ? member.activeFlexAssignments
      : [];

    const activeFlex = flexPasses.find((fp) => {
      if (fp.status !== ASSIGNMENT_STATUS.ACTIVE) return false;
      const flexDays = Array.isArray(fp.selectedDays) && fp.selectedDays.length > 0
        ? fp.selectedDays
        : DAY_NAMES;
      if (!flexDays.includes(dayOfWeek)) return false;
      if (fp.startDate && fp.startDate > targetDateStr) return false;
      if (fp.endDate && fp.endDate < targetDateStr) return false;
      return true;
    });

    if (activeFlex) {
      return {
        batchId: activeFlex.targetBatchId,
        batchName: activeFlex.targetBatchName,
        batchTiming: activeFlex.targetBatchTiming,
        isFlex: true,
        flexAssignmentId: activeFlex.assignmentId,
        transactionId: activeFlex.transactionId,
        primaryBatchId: member.batchId,
        primaryBatchName: member.batchName,
        dayOfWeek,
      };
    }

    return {
      batchId: member.batchId,
      batchName: member.batchName,
      batchTiming: member.batchTiming,
      isFlex: false,
      flexAssignmentId: null,
      transactionId: null,
      primaryBatchId: member.batchId,
      primaryBatchName: member.batchName,
      dayOfWeek,
    };
  }

  /**
   * 9. Resolves all effective attendees for a batch on any target date.
   * - Primary members attending normally.
   * - Inbound flex members whose flex pass routes them into this batch on this date.
   * - Highlights primary members who are flexed OUT to another batch on this date.
   */
  async getBatchEffectiveAttendeesForDate(batchId, targetDateStr) {
    const batch = await batchRepository.findById(batchId);
    if (!batch) {
      throw new NotFoundError(`Batch "${batchId}" not found.`);
    }

    const dateObj = new Date(targetDateStr);
    const dayOfWeek = DAY_NAMES[dateObj.getDay()];

    // 1. Primary members
    const primaryMembers = await Member.find({
      batchId,
      isDeleted: false,
      status: { $ne: "Archived" },
    }).lean();

    // 2. Inbound flex members (primary batch != batchId, but flex into batchId today)
    const flexAssignments = await BatchAssignment.find({
      targetBatchId: batchId,
      status: ASSIGNMENT_STATUS.ACTIVE,
      assignmentType: ASSIGNMENT_TYPE.TEMPORARY_FLEX,
      startDate: { $lte: targetDateStr },
      $or: [{ endDate: null }, { endDate: { $gte: targetDateStr } }],
    }).lean();

    // Filter assignments that match day of week (or all days if not specified)
    const activeTodayFlex = flexAssignments.filter((f) => {
      const days = Array.isArray(f.selectedDays) && f.selectedDays.length > 0
        ? f.selectedDays
        : DAY_NAMES;
      return days.includes(dayOfWeek);
    });

    const flexInMemberIds = activeTodayFlex.map((f) => f.memberId);
    const flexInMembers = flexInMemberIds.length > 0
      ? await Member.find({ id: { $in: flexInMemberIds }, isDeleted: false }).lean()
      : [];

    // Map attendees with statuses
    const attendees = [];

    // Process primary members
    for (const m of primaryMembers) {
      // Check if flexed out today
      const flexOutPass = (m.activeFlexAssignments || []).find((fp) => {
        const fpDays = Array.isArray(fp.selectedDays) && fp.selectedDays.length > 0
          ? fp.selectedDays
          : DAY_NAMES;
        return (
          fp.status === ASSIGNMENT_STATUS.ACTIVE &&
          fpDays.includes(dayOfWeek) &&
          (!fp.startDate || fp.startDate <= targetDateStr) &&
          (!fp.endDate || fp.endDate >= targetDateStr) &&
          fp.targetBatchId !== batchId
        );
      });

      attendees.push({
        memberId: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        email: m.email,
        mobile: m.mobile,
        photo: m.photo || null,
        isPrimaryAttendee: true,
        isFlexIn: false,
        isFlexOut: Boolean(flexOutPass),
        flexDestination: flexOutPass ? flexOutPass.targetBatchName : null,
        flexDestinationId: flexOutPass ? flexOutPass.targetBatchId : null,
      });
    }

    // Process flex-in members
    for (const m of flexInMembers) {
      const pass = activeTodayFlex.find((f) => f.memberId === m.id);
      attendees.push({
        memberId: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        email: m.email,
        mobile: m.mobile,
        photo: m.photo || null,
        isPrimaryAttendee: false,
        isFlexIn: true,
        isFlexOut: false,
        flexFromBatchId: m.batchId,
        flexFromBatchName: m.batchName,
        assignmentId: pass ? pass.id : "",
        transactionId: pass ? pass.transactionId : "",
      });
    }

    return {
      batchId: batch.id,
      batchName: batch.name,
      targetDate: targetDateStr,
      dayOfWeek,
      totalAttendeesCount: attendees.filter((a) => !a.isFlexOut).length,
      maxPax: batch.maxPax || 25,
      attendees,
    };
  }

  /**
   * 10. Computes real-time capacity and occupancy metrics for a batch on any date.
   */
  async calculateBatchCapacityOnDate(batchId, targetDateStr) {
    const attendeesInfo = await this.getBatchEffectiveAttendeesForDate(batchId, targetDateStr);
    const maxPax = attendeesInfo.maxPax;
    const effectivePax = attendeesInfo.totalAttendeesCount;
    const spotsRemaining = Math.max(0, maxPax - effectivePax);
    const occupancyPercent = maxPax > 0 ? Math.min(100, Math.round((effectivePax / maxPax) * 100)) : 0;

    return {
      batchId: attendeesInfo.batchId,
      batchName: attendeesInfo.batchName,
      date: targetDateStr,
      dayOfWeek: attendeesInfo.dayOfWeek,
      maxPax,
      effectivePax,
      spotsRemaining,
      occupancyPercent,
      isFull: effectivePax >= maxPax,
    };
  }
}

module.exports = new BatchAssignmentService();
