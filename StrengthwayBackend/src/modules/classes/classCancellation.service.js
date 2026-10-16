"use strict";

const Batch = require("../batches/batch.model");
const Session = require("../schedules/session.model");
const Member = require("../members/member.model");
const ClassCancellationAudit = require("./classCancellation.model");
const ScheduleHistory = require("./scheduleHistory.model");
const { generateBatchDates } = require("./batchSchedule.service");
const { BadRequestError, NotFoundError } = require("../../shared/apiError");
const { SESSION_STATUS, SCHEDULE_CHANGE_ACTION } = require("../../shared/constants");
const { generateScheduleHistoryId } = require("../../shared/idGenerator");

function generateCancellationId() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CAN-${ts}-${rand}`;
}

function generateCreditId() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `CRD-${ts}-${rand}`;
}

class ClassCancellationService {
  /**
   * 1. Simulate Cancellation & Rescheduling (Dry-run preview)
   * Calculates the exact date shifts, sequence preservation, affected members,
   * payment adjustment credits, and carry-forward entitlements WITHOUT mutating the database.
   */
  async simulateCancellation({
    batchId,
    cancellationType = "WEEKLY", // 'WEEKLY' | 'DATE_RANGE' | 'SPECIFIC_CLASSES'
    startDate,
    endDate,
    sessionIds = [],
    reason = "",
    notes = "",
    pricingPolicy = { policyType: "PROPORTIONAL_PER_CLASS", baseMonthlySessions: 12 },
  }) {
    if (!batchId) throw new BadRequestError("batchId is required.");
    if (!reason || !reason.trim()) {
      throw new BadRequestError("A valid cancellation reason is mandatory.");
    }

    const batch = await Batch.findOne({ id: batchId }).lean();
    if (!batch) throw new NotFoundError(`Batch "${batchId}" not found.`);

    // 1. Resolve date range and target sessions to cancel
    let resolvedStartDate = startDate;
    let resolvedEndDate = endDate;

    if (cancellationType === "WEEKLY") {
      if (!startDate) {
        throw new BadRequestError("startDate is required for weekly cancellation.");
      }
      const d = new Date(startDate);
      if (isNaN(d.getTime())) {
        throw new BadRequestError(`Invalid startDate: "${startDate}".`);
      }
      // Calculate Monday of the week and Sunday of the week
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day; // Monday is day 1
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      resolvedStartDate = monday.toISOString().slice(0, 10);
      resolvedEndDate = sunday.toISOString().slice(0, 10);
    } else if (cancellationType === "DATE_RANGE") {
      if (!startDate || !endDate) {
        throw new BadRequestError("Both startDate and endDate are required for date range cancellation.");
      }
      if (startDate > endDate) {
        throw new BadRequestError("startDate cannot be after endDate.");
      }
      resolvedStartDate = startDate;
      resolvedEndDate = endDate;
    } else if (cancellationType === "SPECIFIC_CLASSES") {
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        throw new BadRequestError("At least one sessionId must be specified.");
      }
    } else {
      throw new BadRequestError(`Unsupported cancellationType: "${cancellationType}".`);
    }

    // 2. Query target sessions to cancel
    let targetSessions = [];
    if (cancellationType === "SPECIFIC_CLASSES") {
      targetSessions = await Session.find({
        id: { $in: sessionIds },
        batchId,
      })
        .sort({ sessionDate: 1, classNumber: 1 })
        .lean();
    } else {
      targetSessions = await Session.find({
        batchId,
        sessionDate: { $gte: resolvedStartDate, $lte: resolvedEndDate },
        status: { $ne: SESSION_STATUS.CANCELLED },
      })
        .sort({ sessionDate: 1, classNumber: 1 })
        .lean();
    }

    if (targetSessions.length === 0) {
      throw new BadRequestError(
        `No scheduled sessions found in batch "${batch.name}" for the specified cancellation window (${resolvedStartDate} to ${resolvedEndDate}).`
      );
    }

    // Protection: Disallow cancelling already completed sessions or sessions with attendance recorded
    const completedOrAttended = targetSessions.filter(
      (s) => s.status === SESSION_STATUS.COMPLETED || (s.attendedCount && s.attendedCount > 0)
    );
    if (completedOrAttended.length > 0) {
      const dates = completedOrAttended.map((s) => s.sessionDate).join(", ");
      throw new BadRequestError(
        `Cannot cancel past or completed classes with existing attendance records: [${dates}].`
      );
    }

    // 3. Identify all scheduled sessions in this batch starting on or after the first cancelled date
    const firstCancelledDate = targetSessions[0].sessionDate;
    const lastCancelledDate = targetSessions[targetSessions.length - 1].sessionDate;

    // Rescheduling start date determination:
    let nextPeriodStartStr;
    if (cancellationType === "WEEKLY") {
      // Immediately following week (Monday after resolvedEndDate)
      const endD = new Date(resolvedEndDate);
      endD.setDate(endD.getDate() + 1);
      nextPeriodStartStr = endD.toISOString().slice(0, 10);
    } else if (cancellationType === "DATE_RANGE") {
      // Immediately following day after the period ends (e.g. 21st if cancelled 11th-20th)
      const endD = new Date(resolvedEndDate);
      endD.setDate(endD.getDate() + 1);
      nextPeriodStartStr = endD.toISOString().slice(0, 10);
    } else {
      // Next day after last cancelled class
      const endD = new Date(lastCancelledDate);
      endD.setDate(endD.getDate() + 1);
      nextPeriodStartStr = endD.toISOString().slice(0, 10);
    }

    // Fetch existing upcoming scheduled sessions on or after nextPeriodStartStr
    const existingFutureSessions = await Session.find({
      batchId,
      sessionDate: { $gte: nextPeriodStartStr },
      status: { $in: [SESSION_STATUS.SCHEDULED, SESSION_STATUS.TODAY] },
      attendedCount: 0,
    })
      .sort({ sessionDate: 1, classNumber: 1 })
      .lean();

    // The sequence of classes to be scheduled starting from nextPeriodStartStr:
    // First, the cancelled classes (preserving curriculum sequence)
    // Followed by any existing future scheduled classes (shifted forward)
    const cancelledClassPayloads = targetSessions.map((s) => ({
      originalSessionId: s.id,
      classNumber: s.classNumber,
      classId: s.classId,
      className: s.className || s.subject,
      subject: s.subject || s.className,
      message: s.message,
      beginnerWorkouts: s.beginnerWorkouts,
      intermediateWorkouts: s.intermediateWorkouts,
      coachId: s.coachId,
      coachName: s.coachName,
      originalDate: s.sessionDate,
      originalDay: s.dayOfWeek,
      isCancelledOriginal: true,
    }));

    const futureClassPayloads = existingFutureSessions.map((s) => ({
      originalSessionId: s.id,
      classNumber: s.classNumber,
      classId: s.classId,
      className: s.className || s.subject,
      subject: s.subject || s.className,
      message: s.message,
      beginnerWorkouts: s.beginnerWorkouts,
      intermediateWorkouts: s.intermediateWorkouts,
      coachId: s.coachId,
      coachName: s.coachName,
      originalDate: s.sessionDate,
      originalDay: s.dayOfWeek,
      isCancelledOriginal: false,
    }));

    const totalToSchedule = cancelledClassPayloads.length + futureClassPayloads.length;
    const combinedPayloads = [...cancelledClassPayloads, ...futureClassPayloads];

    // Generate batch operational dates starting from nextPeriodStartStr
    const operationalDates = await generateBatchDates(batch, nextPeriodStartStr, totalToSchedule);

    if (operationalDates.length < totalToSchedule) {
      throw new BadRequestError(
        `Unable to generate enough operational dates for batch "${batch.name}". Need ${totalToSchedule}, got ${operationalDates.length}.`
      );
    }

    // Map each payload to its new operational date
    const rescheduledMapping = [];
    const displacedSessions = [];

    for (let i = 0; i < combinedPayloads.length; i++) {
      const payload = combinedPayloads[i];
      const newSlot = operationalDates[i];
      const isDisplaced = !payload.isCancelledOriginal;

      const mappingItem = {
        sessionId: payload.originalSessionId,
        classNumber: i + (targetSessions[0]?.classNumber || 1),
        classId: payload.classId,
        className: payload.className,
        originalDate: payload.originalDate,
        originalDay: payload.originalDay,
        newDate: newSlot.date,
        newDay: newSlot.dayOfWeek,
        isDisplaced,
      };

      rescheduledMapping.push(mappingItem);
      if (isDisplaced) {
        displacedSessions.push(mappingItem);
      }
    }

    // 4. Calculate Membership Payment Adjustments & Carry-Forward Sessions
    const enrolledMembers = await Member.find({
      batchId: batch.id,
      isDeleted: false,
    }).lean();

    const baseMonthlySessions = pricingPolicy.baseMonthlySessions || 12;
    const cancelledCount = targetSessions.length;
    let totalAdjustmentAmount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const affectedMembers = enrolledMembers.map((member) => {
      const plan = member.membershipPlan;
      const planPrice = Number(plan?.price || member.paymentDetails?.amount || 2500);
      const durationMonths = Number(plan?.durationMonths || 1);

      // Per-class rate = planPrice / (durationMonths * baseMonthlySessions)
      const perClassRate = Math.round((planPrice / (durationMonths * baseMonthlySessions)) * 100) / 100;
      const adjustmentCredit = Math.round(perClassRate * cancelledCount);
      totalAdjustmentAmount += adjustmentCredit;

      // Determine renewal intent:
      // If member has already expired or plan ends in past or within 5 days, flag as potentially not renewing
      const planEndStr = plan?.endDate ? new Date(plan.endDate).toISOString().slice(0, 10) : "";
      const isExpiredOrEndingSoon = !planEndStr || planEndStr <= todayStr;
      const willRenew = !isExpiredOrEndingSoon;

      return {
        memberId: member.id,
        memberName: member.fullName || `${member.firstName} ${member.lastName || ""}`.trim(),
        email: member.email,
        mobile: member.mobile,
        membershipPlanId: plan?.id || "standard",
        membershipPlanName: plan?.name || "Standard Membership",
        planPrice,
        durationMonths,
        perClassRate,
        cancelledClassesCount: cancelledCount,
        adjustmentCredit,
        creditId: generateCreditId(),
        willRenew,
        status: willRenew ? "CREDITED_PENDING_RENEWAL" : "CARRIED_FORWARD_NO_RENEWAL",
        carryForwardSessionsCount: cancelledCount,
        currentPendingSessions: member.pendingSessionsCount || 0,
        newPendingSessionsTotal: (member.pendingSessionsCount || 0) + cancelledCount,
      };
    });

    return {
      batchId: batch.id,
      batchName: batch.name,
      cancellationType,
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      reason,
      notes,
      cancelledSessions: targetSessions.map((s) => ({
        id: s.id,
        classNumber: s.classNumber,
        className: s.className || s.subject,
        sessionDate: s.sessionDate,
        dayOfWeek: s.dayOfWeek,
        displayDate: s.displayDate,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      cancelledCount,
      rescheduledMapping,
      displacedSessions,
      displacedFutureSessionsCount: displacedSessions.length,
      affectedMembers,
      totalAdjustmentAmount,
      pricingPolicyApplied: {
        type: pricingPolicy.policyType || "PROPORTIONAL_PER_CLASS",
        baseMonthlySessions,
      },
      summary: {
        totalCancelled: cancelledCount,
        totalRescheduled: rescheduledMapping.filter((m) => !m.isDisplaced).length,
        totalDisplaced: displacedSessions.length,
        totalMembersAffected: affectedMembers.length,
        totalCredit: totalAdjustmentAmount,
      },
    };
  }

  /**
   * 2. Apply Cancellation & Rescheduling (Commit to DB)
   * Executes the schedule transformation, updates sessions, records member credits
   * and carry-forward sessions, and logs an immutable audit trail.
   */
  async applyCancellation({
    batchId,
    cancellationType = "WEEKLY",
    startDate,
    endDate,
    sessionIds = [],
    reason = "",
    notes = "",
    pricingPolicy = { policyType: "PROPORTIONAL_PER_CLASS", baseMonthlySessions: 12 },
    performedBy = "Admin",
  }) {
    // 1. Run simulation to validate and get complete shift mapping
    const simulation = await this.simulateCancellation({
      batchId,
      cancellationType,
      startDate,
      endDate,
      sessionIds,
      reason,
      notes,
      pricingPolicy,
    });

    const cancellationId = generateCancellationId();
    const now = new Date();

    // 2. Mark target cancelled sessions on their original dates
    const cancelledMapping = simulation.rescheduledMapping.filter((m) => !m.isDisplaced);
    const dateToRescheduledDate = new Map(
      cancelledMapping.map((m) => [m.originalDate, m.newDate])
    );

    for (const cancelledSession of simulation.cancelledSessions) {
      await Session.updateOne(
        { id: cancelledSession.id, batchId },
        {
          $set: {
            status: SESSION_STATUS.CANCELLED,
            isCancelled: true,
            cancellationId,
            cancellationReason: reason,
            cancelledAt: now,
            cancelledBy: performedBy,
            rescheduledToDate: dateToRescheduledDate.get(cancelledSession.sessionDate) || "",
          },
        }
      );
    }

    // 3. Apply the rescheduled & displaced classes to future dates
    // For each item in simulation.rescheduledMapping:
    // It has a newDate and newDay.
    // If a session already exists on newDate for this batch, update its curriculum payload.
    // If no session exists on newDate, create a new Session document!
    const batch = await Batch.findOne({ id: batchId }).lean();

    for (const item of simulation.rescheduledMapping) {
      // Find payload from the original session
      const originalSession = await Session.findOne({ id: item.sessionId }).lean();
      if (!originalSession) continue;

      const payload = {
        classId: originalSession.classId,
        className: originalSession.className || originalSession.subject,
        subject: originalSession.subject || originalSession.className,
        message: originalSession.message,
        beginnerWorkouts: originalSession.beginnerWorkouts,
        intermediateWorkouts: originalSession.intermediateWorkouts,
        classNumber: item.classNumber,
        dayOfWeek: item.newDay,
        displayDate: new Date(item.newDate).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        startTime: originalSession.startTime || batch.startTime || "06:00 AM",
        endTime: originalSession.endTime || batch.endTime || "07:00 AM",
        timing: originalSession.timing || batch.timingLabel || "",
        coachId: originalSession.coachId || (batch.trainerIds && batch.trainerIds[0]) || "",
        coachName: originalSession.coachName || batch.coachName || "Assigned Coach",
        status: SESSION_STATUS.SCHEDULED,
        isCancelled: false,
        isRescheduled: true,
        rescheduledFromDate: item.originalDate,
        rescheduledFromSessionId: item.sessionId,
        originalSessionDate: originalSession.originalSessionDate || item.originalDate,
      };

      const existingSlot = await Session.findOne({
        batchId,
        sessionDate: item.newDate,
      });

      if (existingSlot) {
        // Update the existing slot with the shifted class payload
        await Session.updateOne(
          { _id: existingSlot._id },
          { $set: payload }
        );
      } else {
        // Create a new session document for this newly added tail-end date
        const timestamp = Date.now().toString().slice(-6);
        const rand = Math.floor(100 + Math.random() * 900);
        const newSessionId = `SES-${timestamp}${rand}-${item.classNumber}`;

        await Session.create({
          id: newSessionId,
          batchId,
          batchName: batch.name,
          sessionDate: item.newDate,
          capacity: batch.maxPax || 28,
          attendedCount: 0,
          ...payload,
        });
      }
    }

    // 4. Update affected members: record payment adjustment credits and carry-forward pending sessions
    const cancelledDates = simulation.cancelledSessions.map((s) => s.sessionDate);
    const rescheduledDates = cancelledMapping.map((m) => m.newDate);

    for (const mem of simulation.affectedMembers) {
      const creditDoc = {
        creditId: mem.creditId,
        cancellationId,
        batchId: batch.id,
        batchName: batch.name,
        cancelledClassesCount: mem.cancelledClassesCount,
        perClassRate: mem.perClassRate,
        creditAmount: mem.adjustmentCredit,
        originalPlanPrice: mem.planPrice,
        reason,
        status: mem.willRenew ? "AVAILABLE" : "RETAINED_CARRIED_FORWARD",
        createdAt: now,
      };

      const carryForwardDoc = {
        cancellationId,
        batchId: batch.id,
        batchName: batch.name,
        classCount: mem.cancelledClassesCount,
        cancelledDates,
        rescheduledDates,
        reason,
        addedAt: now,
        expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days entitlement window
        status: "AVAILABLE",
      };

      await Member.updateOne(
        { id: mem.memberId },
        {
          $push: {
            membershipAdjustmentCredits: creditDoc,
            carryForwardSessions: carryForwardDoc,
          },
          $inc: {
            totalAdjustmentCredit: mem.adjustmentCredit,
            pendingSessionsCount: mem.cancelledClassesCount,
          },
        }
      );
    }

    // 5. Create immutable ClassCancellationAudit record
    const auditRecord = await ClassCancellationAudit.create({
      id: cancellationId,
      batchId: batch.id,
      batchName: batch.name,
      cancellationType,
      startDate: simulation.startDate,
      endDate: simulation.endDate,
      reason,
      notes,
      cancelledSessionIds: simulation.cancelledSessions.map((s) => s.id),
      cancelledDates,
      cancelledCount: simulation.cancelledCount,
      rescheduledMapping: simulation.rescheduledMapping,
      displacedFutureSessionsCount: simulation.displacedFutureSessionsCount,
      affectedMembers: simulation.affectedMembers,
      totalAdjustmentAmount: simulation.totalAdjustmentAmount,
      pricingPolicyApplied: simulation.pricingPolicyApplied,
      performedBy,
      status: "CONFIRMED",
    });

    // 6. Record in ScheduleHistory
    await ScheduleHistory.create({
      id: generateScheduleHistoryId(),
      batchId: batch.id,
      action: SCHEDULE_CHANGE_ACTION.CANCEL_SESSION || "CANCEL_RESCHEDULE",
      description: `Emergency Cancellation (${cancellationType}): ${simulation.cancelledCount} classes cancelled due to "${reason}". Rescheduled sequentially, shifting ${simulation.displacedFutureSessionsCount} upcoming classes forward. Total member adjustment credit: ₹${simulation.totalAdjustmentAmount.toLocaleString("en-IN")}.`,
      changeDetails: {
        cancellationId,
        cancellationType,
        startDate: simulation.startDate,
        endDate: simulation.endDate,
        cancelledDates,
        rescheduledDates,
        affectedMembersCount: simulation.affectedMembers.length,
        totalCredit: simulation.totalAdjustmentAmount,
      },
      performedBy,
      reason,
    });

    return {
      success: true,
      cancellationId,
      auditRecord,
      summary: simulation.summary,
    };
  }

  /**
   * 3. Get Batch Cancellation Audits
   */
  async getBatchCancellations(batchId, { page = 1, limit = 20 } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { batchId };

    const total = await ClassCancellationAudit.countDocuments(filter);
    const cancellations = await ClassCancellationAudit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      cancellations,
    };
  }

  /**
   * 4. Get Single Cancellation Audit Detail
   */
  async getCancellationById(id) {
    const cancellation = await ClassCancellationAudit.findOne({ id }).lean();
    if (!cancellation) {
      throw new NotFoundError(`Class cancellation audit "${id}" not found.`);
    }
    return cancellation;
  }

  /**
   * 5. Get Member Adjustment Credits and Carried Forward Sessions
   */
  async getMemberAdjustments(memberId) {
    const member = await Member.findOne({ id: memberId }).lean();
    if (!member) {
      throw new NotFoundError(`Member "${memberId}" not found.`);
    }

    const credits = member.membershipAdjustmentCredits || [];
    const availableCredits = credits.filter((c) => c.status === "AVAILABLE");
    const totalAvailableAmount = availableCredits.reduce((sum, c) => sum + (c.creditAmount || 0), 0);

    const carryForwardSessions = member.carryForwardSessions || [];
    const availableCarryForward = carryForwardSessions.filter((s) => s.status === "AVAILABLE");
    const totalPendingSessions = member.pendingSessionsCount || 0;

    return {
      memberId: member.id,
      memberName: member.fullName || `${member.firstName} ${member.lastName || ""}`.trim(),
      totalAdjustmentCredit: totalAvailableAmount,
      availableCredits,
      allCredits: credits,
      pendingSessionsCount: totalPendingSessions,
      carryForwardSessions: availableCarryForward,
      allCarryForwardSessions: carryForwardSessions,
    };
  }

  /**
   * 6. Apply Member Adjustment Credit to Renewal Payment
   * Calculates final payable amount after deduction:
   * originalAmount - eligibleAdjustment = finalPayableAmount
   */
  async applyAdjustmentToRenewal({
    memberId,
    renewalAmount,
    invoiceNumber = "",
    transactionId = "",
    performedBy = "Admin",
  }) {
    const member = await Member.findOne({ id: memberId });
    if (!member) {
      throw new NotFoundError(`Member "${memberId}" not found.`);
    }

    const availableCredits = (member.membershipAdjustmentCredits || []).filter(
      (c) => c.status === "AVAILABLE"
    );

    const totalAvailable = availableCredits.reduce((sum, c) => sum + (c.creditAmount || 0), 0);
    const originalAmount = Number(renewalAmount);

    if (totalAvailable <= 0) {
      return {
        originalAmount,
        adjustmentAmount: 0,
        finalPayableAmount: originalAmount,
        creditsApplied: [],
      };
    }

    // Deduction cannot exceed the renewal amount
    const deduction = Math.min(originalAmount, totalAvailable);
    const finalPayable = Math.max(0, originalAmount - deduction);

    // Update member credits status
    let remainingToDeduct = deduction;
    const creditsApplied = [];

    for (const cred of member.membershipAdjustmentCredits) {
      if (cred.status === "AVAILABLE" && remainingToDeduct > 0) {
        const thisDeduction = Math.min(cred.creditAmount, remainingToDeduct);
        cred.status = "APPLIED_TO_RENEWAL";
        cred.appliedToPayment = {
          invoiceNumber,
          transactionId,
          originalAmount,
          adjustmentAmount: thisDeduction,
          finalPayableAmount: finalPayable,
          appliedAt: new Date(),
        };
        remainingToDeduct -= thisDeduction;
        creditsApplied.push({
          creditId: cred.creditId,
          amountApplied: thisDeduction,
        });
      }
    }

    member.totalAdjustmentCredit = Math.max(0, (member.totalAdjustmentCredit || 0) - deduction);
    await member.save();

    return {
      originalAmount,
      adjustmentAmount: deduction,
      finalPayableAmount: finalPayable,
      creditsApplied,
      remainingCreditBalance: member.totalAdjustmentCredit,
    };
  }
}

module.exports = new ClassCancellationService();
