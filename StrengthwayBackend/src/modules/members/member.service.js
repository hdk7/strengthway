"use strict";

const memberRepository = require("./member.repository");
const planService = require("../membership-plans/plan.service");
const batchService = require("../batches/batch.service");
const {
  generateMemberId,
  generateTransactionId,
  generateReceiptNumber,
} = require("../../shared/idGenerator");
const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../shared/apiError");
const { MEMBER_STATUS } = require("../../shared/constants");
const { calculateBmi, calculateMembershipDates } = require("../../shared/dateUtils");
const {
  buildPhysicalStats,
  buildEmergencyContact,
  resolveMemberPlanAndPayment,
  resolveMemberBatchAndSchedule,
} = require("./member.helpers");
const { buildMemberConversionPayload } = require("./memberConversion.helper");
const { getMemberMonthTracking } = require("./memberTracking.service");

class MemberService {
  async getAll({
    page = 1,
    pageSize = 10,
    skip = 0,
    status,
    includeDeleted = false,
    search = "",
    scopedMemberIds = null,
  } = {}) {
    const filter = {};

    // RBAC Scope: When provided, restricts query strictly to authorized member IDs
    if (scopedMemberIds !== null && Array.isArray(scopedMemberIds)) {
      filter.id = { $in: scopedMemberIds };
    }

    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    if (status && status !== "All") {
      if (status === "Archived") {
        filter.isDeleted = true;
      } else {
        filter.status = status;
        filter.isDeleted = false;
      }
    }

    if (search && search.trim() !== "") {
      const cleanSearch = search.trim();
      filter.$or = [
        { firstName: { $regex: cleanSearch, $options: "i" } },
        { lastName: { $regex: cleanSearch, $options: "i" } },
        { email: { $regex: cleanSearch, $options: "i" } },
        { mobile: { $regex: cleanSearch, $options: "i" } },
        { id: { $regex: cleanSearch, $options: "i" } },
      ];
    }

    return memberRepository.findAll({ filter, skip, limit: pageSize });
  }

  async getById(id) {
    const member = await memberRepository.findById(id);
    if (!member) {
      throw new NotFoundError(`Member with ID "${id}" not found.`);
    }
    return member;
  }

  async create(body) {
    // 1. Uniqueness checks
    const existingEmail = await memberRepository.findByEmail(body.email);
    if (existingEmail) {
      throw new ConflictError(
        `A member with email "${body.email}" already exists.`,
      );
    }

    const existingMobile = await memberRepository.findByMobile(body.mobile);
    if (existingMobile) {
      throw new ConflictError(
        `A member with mobile number "${body.mobile}" already exists.`,
      );
    }

    // 2. ID Generation
    const maxSuffix = await memberRepository.getMaxIdSuffix();
    const id = body.id || generateMemberId(maxSuffix);

    // 3. BMI & physical stats
    const stats = buildPhysicalStats(body);
    const physicalStats = {
      height: stats.height,
      weight: stats.weight,
      bmi: stats.bmi,
      bloodGroup: stats.bloodGroup,
    };

    // 4. Emergency contact
    const emergencyContact = buildEmergencyContact(body);

    // 5. Membership plan & payment snapshot
    const { membershipPlan, paymentDetails } =
      await resolveMemberPlanAndPayment(body, planService);

    // 6. Batch lookup & schedule
    const { schedule, batchId, batchName, batchTiming, assignedBatch } =
      await resolveMemberBatchAndSchedule(body, null, batchService);

    // 7. Member payload
    const rawFullName = (body.fullName || "").trim();
    const nameParts = rawFullName ? rawFullName.split(/\s+/) : [];
    const firstName = (body.firstName || nameParts[0] || "").trim();
    const lastName = (body.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0] || "")).trim();
    const fullName = rawFullName || `${firstName} ${lastName}`.trim();

    const newMemberData = {
      id,
      fullName,
      firstName,
      lastName,
      email: body.email.toLowerCase().trim(),
      mobile: body.mobile.trim(),
      gender: body.gender,
      dob: body.dob,
      instagramProfileId: (body.instagramProfileId || body.instagram || "").trim(),
      height: stats.heightStr,
      weight: stats.weightStr,
      bloodGroup: body.bloodGroup || "",
      address: body.address || "",
      city: body.city || "",
      state: body.state || "",
      country: body.country || "India",
      pincode: body.pincode || "",
      photo: body.photo || body.photoUrl || null,
      photoName: body.photoName || null,
      bio: body.bio || "",
      status: body.status || MEMBER_STATUS.ACTIVE,
      isDeleted: false,
      deletedAt: null,
      batchId,
      batchName,
      batchTiming,
      assignedBatch,
      schedule,
      batchHistory:
        Array.isArray(body.batchHistory) && body.batchHistory.length > 0
          ? body.batchHistory
          : batchId
            ? [
                {
                  assignmentId: `ASG-${id}-INIT`,
                  type: "PRIMARY",
                  batchId,
                  batchName,
                  batchTiming,
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: null,
                  reason: "Initial enrollment",
                  transferredAt: new Date(),
                  transferredBy: "Admin",
                  status: "COMPLETED",
                },
              ]
            : [],
      activeFlexAssignments: Array.isArray(body.activeFlexAssignments)
        ? body.activeFlexAssignments
        : [],
      physicalStats,
      emergencyName: emergencyContact.name,
      emergencyPhone: emergencyContact.phone,
      emergencyRelation: emergencyContact.relation,
      emergencyContact,
      membershipPlan,
      paymentDetails,
      convertedAt: null,
      registeredAt: body.registeredAt
        ? new Date(body.registeredAt)
        : new Date(),
    };

    const saved = await memberRepository.create(newMemberData);

    // Auto-enroll member into batch
    if (batchId) {
      await batchService.enrollMember(batchId, id).catch(() => null);
    }

    return saved;
  }

  async update(id, body) {
    const existing = await this.getById(id);

    // Email conflict check if updated
    if (body.email && body.email.toLowerCase().trim() !== existing.email) {
      const emailConflict = await memberRepository.findByEmail(body.email);
      if (emailConflict && emailConflict.id !== id) {
        throw new ConflictError(
          `Email "${body.email}" is already used by another member.`,
        );
      }
    }

    // Mobile conflict check if updated
    if (body.mobile && body.mobile.trim() !== existing.mobile) {
      const mobileConflict = await memberRepository.findByMobile(body.mobile);
      if (mobileConflict && mobileConflict.id !== id) {
        throw new ConflictError(
          `Mobile number "${body.mobile}" is already used by another member.`,
        );
      }
    }

    const updates = { ...body };

    // Recompute physical stats if height/weight/bloodGroup updated
    const heightStr =
      body.height !== undefined
        ? String(body.height).replace(/\s*cm/i, "")
        : existing.height;
    const weightStr =
      body.weight !== undefined
        ? String(body.weight).replace(/\s*kg/i, "")
        : existing.weight;
    const bmiVal = calculateBmi(heightStr, weightStr);

    updates.physicalStats = {
      height: heightStr ? `${heightStr} cm` : "",
      weight: weightStr ? `${weightStr} kg` : "",
      bmi: bmiVal ? String(bmiVal) : existing.physicalStats?.bmi || "",
      bloodGroup: body.bloodGroup || existing.bloodGroup || "",
    };

    // Emergency contact merge
    const emergencyName =
      body.emergencyName ||
      body.emergencyContact?.name ||
      existing.emergencyContact?.name ||
      "";
    const emergencyPhone =
      body.emergencyPhone ||
      body.emergencyNumber ||
      body.emergencyContact?.phone ||
      existing.emergencyContact?.phone ||
      "";
    const emergencyRelation =
      body.emergencyRelation ||
      body.emergencyRelationship ||
      body.emergencyContact?.relation ||
      existing.emergencyContact?.relation ||
      "";

    updates.emergencyContact = {
      name: emergencyName,
      phone: emergencyPhone,
      relation: emergencyRelation,
    };
    updates.emergencyName = emergencyName;
    updates.emergencyPhone = emergencyPhone;
    updates.emergencyRelation = emergencyRelation;

    if (body.instagramProfileId !== undefined || body.instagram !== undefined) {
      updates.instagramProfileId = (body.instagramProfileId || body.instagram || "").trim();
    }

    if (body.fullName !== undefined) {
      const rawFullName = (body.fullName || "").trim();
      const nameParts = rawFullName ? rawFullName.split(/\s+/) : [];
      updates.fullName = rawFullName;
      if (!body.firstName && nameParts[0]) {
        updates.firstName = nameParts[0];
      }
      if (!body.lastName && nameParts.length > 1) {
        updates.lastName = nameParts.slice(1).join(" ");
      }
    }

    // Handle batch changes if batchId is being changed
    if (body.batchId !== undefined && body.batchId !== existing.batchId) {
      if (body.batchId) {
        try {
          const newBatch = await batchService.getById(body.batchId);
          if (newBatch) {
            updates.batchId = newBatch.id;
            updates.batchName = newBatch.name;
            updates.batchTiming = newBatch.timingLabel;
            updates.assignedBatch = newBatch.name;
            updates.schedule = {
              batchId: newBatch.id,
              batchName: newBatch.name,
              batchTiming: newBatch.timingLabel,
              daysLabel: newBatch.daysLabel,
              daysPattern: newBatch.daysPattern,
            };
            if (existing.batchId) {
              await batchService
                .unenrollMember(existing.batchId, id)
                .catch(() => null);
            }
            await batchService.enrollMember(body.batchId, id).catch(() => null);
          }
        } catch {
          // Fallback
        }
      } else {
        if (existing.batchId) {
          await batchService
            .unenrollMember(existing.batchId, id)
            .catch(() => null);
        }
        updates.batchId = "";
        updates.batchName = "";
        updates.batchTiming = "";
        updates.assignedBatch = "Unassigned";
        updates.schedule = null;
      }
    }

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }

    return memberRepository.updateById(id, updates);
  }

  async softDelete(id) {
    const existing = await this.getById(id);
    if (existing.isDeleted) {
      throw new ConflictError(`Member "${id}" is already archived.`);
    }

    const updated = await memberRepository.updateById(id, {
      isDeleted: true,
      deletedAt: new Date(),
      status: MEMBER_STATUS.ARCHIVED,
    });

    if (existing.batchId) {
      await batchService.unenrollMember(existing.batchId, id).catch(() => null);
    }

    return updated;
  }

  async restore(id) {
    const existing = await memberRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Member with ID "${id}" not found.`);
    }
    if (!existing.isDeleted) {
      throw new ConflictError(`Member "${id}" is not archived.`);
    }

    const updated = await memberRepository.updateById(id, {
      isDeleted: false,
      deletedAt: null,
      status: MEMBER_STATUS.ACTIVE,
    });

    if (existing.batchId) {
      await batchService.enrollMember(existing.batchId, id).catch(() => null);
    }

    return updated;
  }

  async permanentDelete(id) {
    const existing = await this.getById(id);
    if (existing.batchId) {
      await batchService.unenrollMember(existing.batchId, id).catch(() => null);
    }
    await memberRepository.deleteById(id);
    return { id: existing.id, deleted: true };
  }

  async toggleStatus(id) {
    const existing = await this.getById(id);
    const nextStatus =
      existing.status === MEMBER_STATUS.ACTIVE
        ? MEMBER_STATUS.INACTIVE
        : MEMBER_STATUS.ACTIVE;

    return memberRepository.updateById(id, { status: nextStatus });
  }

  async convertLead(id, body) {
    const existing = await this.getById(id);
    const convertibleStatuses = [
      MEMBER_STATUS.LEAD,
      MEMBER_STATUS.INQUIRY,
      MEMBER_STATUS.CONTACTED,
    ];
    if (!convertibleStatuses.includes(existing.status)) {
      throw new ConflictError(
        `Member "${id}" cannot be converted because current status is "${existing.status}" (must be "Inquiry", "Contacted", or "Lead").`,
      );
    }

    const plan = await planService.getById(body.paymentPlanId);
    const conversionPayload = await buildMemberConversionPayload({
      existing,
      plan,
      body,
      batchService,
    });

    return memberRepository.updateById(id, conversionPayload);
  }

  async recordContact(id, contactData) {
    const existing = await this.getById(id);
    if (
      existing.status === MEMBER_STATUS.ACTIVE ||
      existing.status === MEMBER_STATUS.CONVERTED
    ) {
      throw new ConflictError(
        `Member "${id}" is already active and converted.`,
      );
    }

    const contactNotes = contactData.contactNotes?.trim() || "";
    if (!contactNotes || contactNotes.length < 5) {
      throw new ValidationError(
        "Contact interaction notes must be at least 5 characters long.",
      );
    }

    const contactedBy = contactData.contactedBy?.trim() || "Admin";
    const contactMethod = contactData.contactMethod || "Phone Call";
    const contactedAt = contactData.contactedAt
      ? new Date(contactData.contactedAt)
      : new Date();

    const contactDetails = {
      contactedAt,
      contactMethod,
      contactNotes,
      contactedBy,
      followUpDate: contactData.followUpDate?.trim() || "",
      outcome: contactData.outcome?.trim() || "Interested - Converting Soon",
    };

    const currentHistory = Array.isArray(existing.statusHistory)
      ? existing.statusHistory
      : [];
    const historyEntry = {
      status: MEMBER_STATUS.CONTACTED,
      changedAt: new Date(),
      changedBy: contactedBy,
      notes: `Contact details recorded: ${contactNotes.slice(0, 100)}`,
    };

    let currentContactHistory = Array.isArray(existing.contactHistory) ? [...existing.contactHistory] : [];
    if (
      currentContactHistory.length === 0 &&
      existing.contactDetails &&
      existing.contactDetails.contactNotes
    ) {
      currentContactHistory.push(existing.contactDetails);
    }
    const updatedContactHistory = [contactDetails, ...currentContactHistory];

    return memberRepository.updateById(id, {
      status: MEMBER_STATUS.CONTACTED,
      contactDetails,
      contactHistory: updatedContactHistory,
      statusHistory: [...currentHistory, historyEntry],
    });
  }

  async archiveInquiry(id, reason = "") {
    const existing = await this.getById(id);
    if (
      existing.status === MEMBER_STATUS.ACTIVE ||
      existing.status === MEMBER_STATUS.CONVERTED
    ) {
      throw new ConflictError(
        `Member "${id}" is already active and converted.`,
      );
    }

    const currentHistory = Array.isArray(existing.statusHistory)
      ? existing.statusHistory
      : [];
    const historyEntry = {
      status: MEMBER_STATUS.ARCHIVED,
      changedAt: new Date(),
      changedBy: "Admin",
      notes: reason || "Inquiry moved to Archived after contact follow-up",
    };

    return memberRepository.updateById(id, {
      status: MEMBER_STATUS.ARCHIVED,
      isDeleted: true,
      deletedAt: new Date(),
      statusHistory: [...currentHistory, historyEntry],
    });
  }

  // ─── Month-Wise Tracking for Individual Member ──────────────────────────────
  async getMemberMonthTracking(id, yearMonth) {
    const member = await this.getById(id);
    return getMemberMonthTracking(member, yearMonth);
  }

  // ─── Membership Plan Renewal with Payment Adjustment Deduction ──────────────
  async renewMembership(id, renewalData = {}) {
    const now = new Date();
    const member = await memberRepository.findById(id);
    if (!member) throw new NotFoundError(`Member with ID "${id}" not found.`);

    const planId = renewalData.planId || renewalData.paymentPlanId || member.membershipPlan?.id;
    if (!planId) {
      throw new BadRequestError("A valid membership planId must be specified for renewal.");
    }

    const plan = await planService.getById(planId);
    if (!plan) throw new NotFoundError(`Membership plan "${planId}" not found.`);

    const originalAmount = Number(
      renewalData.amountPaid !== undefined
        ? renewalData.amountPaid
        : renewalData.paymentAmount !== undefined
          ? renewalData.paymentAmount
          : plan.price
    );
    let adjustmentAmount = 0;
    const creditsApplied = [];

    // Check for available cancellation adjustment credits
    if (
      renewalData.applyCredits !== false &&
      Array.isArray(member.membershipAdjustmentCredits) &&
      member.membershipAdjustmentCredits.length > 0
    ) {
      const availableCredits = member.membershipAdjustmentCredits.filter(
        (c) => c.status === "AVAILABLE"
      );
      const totalAvailable = availableCredits.reduce(
        (sum, c) => sum + (c.creditAmount || 0),
        0
      );

      if (totalAvailable > 0) {
        adjustmentAmount = Math.min(originalAmount, totalAvailable);
        let remainingToDeduct = adjustmentAmount;

        for (const cred of member.membershipAdjustmentCredits) {
          if (cred.status === "AVAILABLE" && remainingToDeduct > 0) {
            const deductThis = Math.min(cred.creditAmount, remainingToDeduct);
            cred.status = "APPLIED_TO_RENEWAL";
            cred.appliedToPayment = {
              invoiceNumber: renewalData.invoiceNumber || "",
              transactionId: renewalData.transactionId || "",
              originalAmount,
              adjustmentAmount: deductThis,
              finalPayableAmount: Math.max(0, originalAmount - adjustmentAmount),
              appliedAt: new Date(),
            };
            remainingToDeduct -= deductThis;
            creditsApplied.push({
              creditId: cred.creditId,
              amountApplied: deductThis,
            });
          }
        }
        member.totalAdjustmentCredit = Math.max(
          0,
          (member.totalAdjustmentCredit || 0) - adjustmentAmount
        );
      }
    }

    // Check for applicable member discount
    let discountAmount = 0;
    let appliedDiscountInfo = null;
    let discountToApply = null;

    try {
      const memberDiscountRepository = require("../discounts/memberDiscount.repository");
      const memberDiscountService = require("../discounts/memberDiscount.service");
      const { MEMBER_DISCOUNT_STATUS } = require("../../shared/constants");

      if (renewalData.discountId) {
        discountToApply = await memberDiscountRepository.findById(renewalData.discountId);
      } else {
        discountToApply = await memberDiscountRepository.findActiveByMemberIdAndPlan(member.id, plan.id);
      }

      if (discountToApply) {
        const isUnexpired = !discountToApply.expiryDate || new Date(discountToApply.expiryDate) > now;
        const isValidStatus = [
          MEMBER_DISCOUNT_STATUS.ASSIGNED,
          MEMBER_DISCOUNT_STATUS.NOTIFIED,
          MEMBER_DISCOUNT_STATUS.PAYMENT_PENDING,
        ].includes(discountToApply.status);

        if (isUnexpired && isValidStatus && discountToApply.planId === plan.id) {
          discountAmount = Number(discountToApply.discountAmount) || 0;
          appliedDiscountInfo = {
            discountId: discountToApply.id,
            campaignId: discountToApply.campaignId,
            discountType: discountToApply.discountType,
            discountValue: discountToApply.discountValue,
            discountAmount,
          };
        }
      }
    } catch {
      // Graceful fallback if discounts module is loading
    }

    const finalPayableAmount = Math.max(0, originalAmount - adjustmentAmount - discountAmount);
    const formattedPrice = `₹${finalPayableAmount.toLocaleString("en-IN")}`;

    // Determine start date: if current plan has not expired, chain renewal after current endDate
    let startDate = now;
    if (member.membershipPlan?.endDate) {
      const currentEnd = new Date(member.membershipPlan.endDate);
      if (currentEnd > now) {
        startDate = currentEnd;
      }
    }
    if (renewalData.startDate) {
      const specifiedStart = new Date(renewalData.startDate);
      if (!isNaN(specifiedStart.getTime())) startDate = specifiedStart;
    }

    const dates = calculateMembershipDates(plan.durationMonths || 1, startDate);
    const receiptNo = generateReceiptNumber();
    const transactionId =
      renewalData.transactionId?.trim() ||
      generateTransactionId(renewalData.paymentMethod || "UPI");

    member.membershipPlan = {
      id: plan.id,
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: finalPayableAmount,
      formattedPrice,
      startDate: new Date(dates.startDate),
      endDate: new Date(dates.endDate),
      formattedStart: dates.formattedStart,
      formattedEnd: dates.formattedEnd,
    };

    member.paymentDetails = {
      method: renewalData.paymentMethod || "UPI",
      amount: finalPayableAmount,
      formattedAmount: formattedPrice,
      transactionId,
      receiptNo,
      upiReference: renewalData.upiReference || "",
      invoiceNumber: renewalData.invoiceNumber || "",
      status: "Completed",
      paidAt: now,
      notes: `Renewed ${plan.name} (${plan.durationMonths} Mo). Original: ₹${originalAmount}, Discount: ₹${discountAmount}, Adjustment: ₹${adjustmentAmount}, Final: ₹${finalPayableAmount}.`,
      appliedDiscount: appliedDiscountInfo,
    };

    member.status = MEMBER_STATUS.ACTIVE;
    const updatedMember = await memberRepository.updateById(member.id, {
      membershipPlan: member.membershipPlan,
      paymentDetails: member.paymentDetails,
      membershipAdjustmentCredits: member.membershipAdjustmentCredits,
      totalAdjustmentCredit: member.totalAdjustmentCredit,
      status: MEMBER_STATUS.ACTIVE,
    });

    // Redeem discount if applied
    if (discountToApply && appliedDiscountInfo) {
      try {
        const memberDiscountService = require("../discounts/memberDiscount.service");
        await memberDiscountService.redeemDiscount({
          discountId: discountToApply.id,
          paymentId: renewalData.paymentId || transactionId,
          transactionId,
          amountPaid: finalPayableAmount,
          invoiceNumber: renewalData.invoiceNumber || receiptNo,
          upiReference: renewalData.upiReference || "",
          adminUser: renewalData.adminUser || { name: "Admin / System" },
        });
      } catch (err) {
        console.warn(`[MemberService] Discount redemption tracking warning:`, err.message);
      }
    }

    return {
      member: updatedMember || member,
      paymentBreakdown: {
        originalAmount,
        adjustmentAmount,
        discountAmount,
        appliedDiscount: appliedDiscountInfo,
        finalPayableAmount,
        formattedFinalPayable: formattedPrice,
        receiptNo,
        transactionId,
        creditsApplied,
        remainingCredits: member.totalAdjustmentCredit || 0,
        pendingSessionsCount: member.pendingSessionsCount || 0,
        planStartDate: dates.formattedStart,
        planEndDate: dates.formattedEnd,
      },
    };
  }
}

module.exports = new MemberService();
