"use strict";

const memberDiscountRepository = require("./memberDiscount.repository");
const memberRepository = require("../members/member.repository");
const planService = require("../membership-plans/plan.service");
const notificationService = require("../notifications/notification.service");
const {
  generateMemberDiscountId,
  generateDiscountCampaignId,
} = require("../../shared/idGenerator");
const {
  MEMBER_DISCOUNT_STATUS,
  DISCOUNT_TYPES,
} = require("../../shared/constants");
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require("../../shared/apiError");

class MemberDiscountService {
  /**
   * Calculates discount amounts and final payable amount given a plan and discount config.
   * Enforces backend price integrity.
   */
  async calculateDiscount({ planId, discountType, discountValue }) {
    const plan = await planService.getById(planId);
    if (!plan) {
      throw new NotFoundError(`Membership plan "${planId}" not found.`);
    }

    const standardPrice = Number(plan.price);
    const value = Number(discountValue);

    if (isNaN(value) || value <= 0) {
      throw new ValidationError("Discount value must be a positive number.");
    }

    let discountAmount = 0;

    if (discountType === DISCOUNT_TYPES.PERCENTAGE) {
      if (value > 100) {
        throw new ValidationError("Percentage discount cannot exceed 100%.");
      }
      discountAmount = Math.round((standardPrice * value) / 100);
    } else if (discountType === DISCOUNT_TYPES.FIXED) {
      if (value > standardPrice) {
        throw new ValidationError(
          `Fixed discount (₹${value.toLocaleString(
            "en-IN"
          )}) cannot exceed the standard plan price (₹${standardPrice.toLocaleString(
            "en-IN"
          )}).`
        );
      }
      discountAmount = Math.round(value);
    } else {
      throw new ValidationError(
        "Invalid discount type. Must be 'percentage' or 'fixed'."
      );
    }

    const finalPayableAmount = Math.max(0, standardPrice - discountAmount);

    return {
      standardPrice,
      discountType,
      discountValue: value,
      discountAmount,
      finalPayableAmount,
      plan: {
        id: plan.id,
        name: plan.name,
        durationMonths: plan.durationMonths || 1,
        price: standardPrice,
      },
    };
  }

  /**
   * Preview discount calculations for a batch of members before final submission.
   */
  async previewCalculations(items = []) {
    const results = [];
    for (const item of items) {
      try {
        const calc = await this.calculateDiscount({
          planId: item.planId,
          discountType: item.discountType,
          discountValue: item.discountValue,
        });
        results.push({
          memberId: item.memberId,
          planId: item.planId,
          ...calc,
          valid: true,
        });
      } catch (err) {
        results.push({
          memberId: item.memberId,
          planId: item.planId,
          valid: false,
          error: err.message,
        });
      }
    }
    return results;
  }

  /**
   * Assigns individual discounts to multiple members in a single bulk operation.
   * Each member can have their own independent plan, discount type, and value.
   */
  async assignBulkDiscounts({
    campaignName = "",
    discounts = [],
    notifyMembers = true,
    adminUser = { name: "Admin" },
  }) {
    if (!Array.isArray(discounts) || discounts.length === 0) {
      throw new ValidationError(
        "Please provide at least one member discount configuration."
      );
    }

    const campaignId = generateDiscountCampaignId();
    const resolvedCampaignName =
      (campaignName && campaignName.trim()) ||
      `Individual Member Concession — ${new Date().toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })}`;

    const year = new Date().getFullYear();
    let currentSuffix = await memberDiscountRepository.getMaxIdSuffix(year);

    const discountRecordsToInsert = [];
    const createdNotifications = [];

    // Process each member individually
    for (const item of discounts) {
      const member = await memberRepository.findById(item.memberId);
      if (!member) {
        throw new NotFoundError(
          `Member with ID "${item.memberId}" was not found.`
        );
      }

      // Check for an existing active, unredeemed discount for this member + plan
      const existingActive =
        await memberDiscountRepository.findActiveByMemberIdAndPlan(
          item.memberId,
          item.planId
        );
      if (existingActive) {
        throw new ConflictError(
          `Member ${member.fullName || member.firstName} (${member.id}) already has an active discount (${existingActive.id}) for plan "${existingActive.planName}". Please cancel or redeem the existing offer before assigning a new one.`
        );
      }

      // Calculate backend price & discount amount
      const calc = await this.calculateDiscount({
        planId: item.planId,
        discountType: item.discountType,
        discountValue: item.discountValue,
      });

      currentSuffix += 1;
      const discountId = generateMemberDiscountId(currentSuffix, year);

      let parsedExpiryDate = null;
      if (item.expiryDate) {
        parsedExpiryDate = new Date(item.expiryDate);
        if (isNaN(parsedExpiryDate.getTime())) {
          throw new ValidationError(
            `Invalid expiry date provided for member ${member.id}.`
          );
        }
        if (parsedExpiryDate <= new Date()) {
          throw new ValidationError(
            `Expiry date for member ${member.id} must be in the future.`
          );
        }
      }

      const initialStatus = notifyMembers
        ? MEMBER_DISCOUNT_STATUS.NOTIFIED
        : MEMBER_DISCOUNT_STATUS.ASSIGNED;

      const initialAuditLogs = [
        {
          action: "DISCOUNT_ASSIGNED",
          performedBy: adminUser?.name || "Admin",
          performedAt: new Date(),
          details: {
            campaignId,
            planId: calc.plan.id,
            planName: calc.plan.name,
            standardPrice: calc.standardPrice,
            discountType: calc.discountType,
            discountValue: calc.discountValue,
            discountAmount: calc.discountAmount,
            finalPayableAmount: calc.finalPayableAmount,
            expiryDate: parsedExpiryDate,
            notifyMembers,
          },
          notes: `Assigned ${
            calc.discountType === "percentage"
              ? calc.discountValue + "%"
              : "₹" + calc.discountValue
          } discount on plan ${calc.plan.name}. Final payable: ₹${
            calc.finalPayableAmount
          }.`,
        },
      ];

      let notificationInfo = {
        status: "PENDING",
        id: null,
        sentAt: null,
      };

      if (notifyMembers) {
        try {
          const notif = await notificationService.createNotification({
            recipientId: member.id,
            recipientRole: "member",
            title: `Special Discount Offer: ₹${calc.discountAmount.toLocaleString(
              "en-IN"
            )} OFF on ${calc.plan.name}!`,
            message: `Exclusive offer for you! Enjoy a ${
              calc.discountType === "percentage"
                ? calc.discountValue + "%"
                : "₹" + calc.discountValue.toLocaleString("en-IN")
            } discount on the "${calc.plan.name}" membership. Standard: ₹${calc.standardPrice.toLocaleString(
              "en-IN"
            )}, Your Exclusive Price: ₹${calc.finalPayableAmount.toLocaleString(
              "en-IN"
            )}.${
              parsedExpiryDate
                ? " Offer expires on " +
                  parsedExpiryDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) +
                  "."
                : ""
            } This discount will apply to your immediate next membership renewal.`,
            type: "MEMBER_DISCOUNT_OFFER",
            data: {
              discountId,
              campaignId,
              planId: calc.plan.id,
              planName: calc.plan.name,
              standardPrice: calc.standardPrice,
              discountType: calc.discountType,
              discountValue: calc.discountValue,
              discountAmount: calc.discountAmount,
              finalPayableAmount: calc.finalPayableAmount,
              expiryDate: parsedExpiryDate,
              url: "/member/payments/members",
            },
          });

          notificationInfo = {
            status: "SENT",
            id: notif.id,
            sentAt: new Date(),
          };
          createdNotifications.push(notif);

          initialAuditLogs.push({
            action: "MEMBER_NOTIFIED",
            performedBy: "System Notification Service",
            performedAt: new Date(),
            details: { notificationId: notif.id },
            notes: `In-app login notification dispatched to ${member.fullName} (${member.id}).`,
          });
        } catch (notifErr) {
          console.warn(
            `[MemberDiscount] Failed to send notification to member ${member.id}:`,
            notifErr.message
          );
          notificationInfo.status = "FAILED";
        }
      }

      discountRecordsToInsert.push({
        id: discountId,
        campaignId,
        campaignName: resolvedCampaignName,
        memberId: member.id,
        memberName: member.fullName || `${member.firstName} ${member.lastName || ""}`.trim(),
        memberEmail: member.email,
        memberMobile: member.mobile,
        planId: calc.plan.id,
        planName: calc.plan.name,
        planDurationMonths: calc.plan.durationMonths,
        standardPrice: calc.standardPrice,
        discountType: calc.discountType,
        discountValue: calc.discountValue,
        discountAmount: calc.discountAmount,
        finalPayableAmount: calc.finalPayableAmount,
        expiryDate: parsedExpiryDate,
        applicationRule: item.applicationRule || "NEXT_PAYMENT_ONLY",
        usageLimit: 1,
        timesUsed: 0,
        status: initialStatus,
        notificationStatus: notificationInfo.status,
        notificationId: notificationInfo.id,
        notificationSentAt: notificationInfo.sentAt,
        assignedBy: {
          id: adminUser?.id || "",
          name: adminUser?.name || "Admin",
          email: adminUser?.email || "",
        },
        assignedAt: new Date(),
        auditLogs: initialAuditLogs,
      });
    }

    // Insert all discount records atomically
    const createdDiscounts = await memberDiscountRepository.createMany(
      discountRecordsToInsert
    );

    return {
      campaignId,
      campaignName: resolvedCampaignName,
      totalAssigned: createdDiscounts.length,
      discounts: createdDiscounts,
      notificationsSent: createdNotifications.length,
    };
  }

  /**
   * Retrieves all discounts with rich filtering, search, and pagination.
   */
  async getAll(query = {}) {
    const filter = {};

    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }
    if (query.planId && query.planId !== "ALL") {
      filter.planId = query.planId;
    }
    if (query.discountType && query.discountType !== "ALL") {
      filter.discountType = query.discountType;
    }
    if (query.campaignId) {
      filter.campaignId = query.campaignId;
    }
    if (query.memberId) {
      filter.memberId = query.memberId;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { id: { $regex: q, $options: "i" } },
        { campaignId: { $regex: q, $options: "i" } },
        { memberId: { $regex: q, $options: "i" } },
        { memberName: { $regex: q, $options: "i" } },
        { memberEmail: { $regex: q, $options: "i" } },
        { memberMobile: { $regex: q, $options: "i" } },
        { planName: { $regex: q, $options: "i" } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [discounts, total] = await Promise.all([
      memberDiscountRepository.findAll({ filter, skip, limit }),
      memberDiscountRepository.count(filter),
    ]);

    // Check expiry for active records and update if needed
    const now = new Date();
    for (const d of discounts) {
      if (
        d.status !== MEMBER_DISCOUNT_STATUS.REDEEMED &&
        d.status !== MEMBER_DISCOUNT_STATUS.CANCELLED &&
        d.status !== MEMBER_DISCOUNT_STATUS.EXPIRED &&
        d.expiryDate &&
        new Date(d.expiryDate) < now
      ) {
        d.status = MEMBER_DISCOUNT_STATUS.EXPIRED;
        memberDiscountRepository
          .updateById(d.id, {
            status: MEMBER_DISCOUNT_STATUS.EXPIRED,
            $push: {
              auditLogs: {
                action: "DISCOUNT_EXPIRED",
                performedBy: "System Expiry Worker",
                performedAt: now,
                notes: "Discount expired past its configured deadline.",
              },
            },
          })
          .catch(() => null);
      }
    }

    return {
      discounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a single discount record by ID.
   */
  async getById(id) {
    const discount = await memberDiscountRepository.findById(id);
    if (!discount) {
      throw new NotFoundError(`Member discount "${id}" was not found.`);
    }

    // Auto-expire check
    if (
      discount.status !== MEMBER_DISCOUNT_STATUS.REDEEMED &&
      discount.status !== MEMBER_DISCOUNT_STATUS.CANCELLED &&
      discount.status !== MEMBER_DISCOUNT_STATUS.EXPIRED &&
      discount.expiryDate &&
      new Date(discount.expiryDate) < new Date()
    ) {
      discount.status = MEMBER_DISCOUNT_STATUS.EXPIRED;
      await memberDiscountRepository.updateById(id, {
        status: MEMBER_DISCOUNT_STATUS.EXPIRED,
        $push: {
          auditLogs: {
            action: "DISCOUNT_EXPIRED",
            performedBy: "System Expiry Worker",
            performedAt: new Date(),
            notes: "Discount expired past its configured deadline.",
          },
        },
      });
    }

    return discount;
  }

  /**
   * Retrieves active, unredeemed discounts for a specific member.
   * Data isolation enforced: Member only sees their own discounts.
   */
  async getActiveDiscountsForMember(memberId, planId = null) {
    if (planId) {
      const active = await memberDiscountRepository.findActiveByMemberIdAndPlan(
        memberId,
        planId
      );
      return active ? [active] : [];
    }

    const discounts = await memberDiscountRepository.findAnyActiveForMember(
      memberId
    );
    return discounts || [];
  }

  /**
   * Cancels an unused, eligible member discount.
   * Completed invoices and historical records are never altered.
   */
  async cancelDiscount(id, { reason = "", adminUser = { name: "Admin" } }) {
    const discount = await this.getById(id);

    if (discount.status === MEMBER_DISCOUNT_STATUS.REDEEMED) {
      throw new ConflictError(
        "Cannot cancel an offer that has already been redeemed towards a completed membership payment."
      );
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.CANCELLED) {
      throw new ConflictError("This discount offer has already been cancelled.");
    }

    const cancellationReason = reason?.trim() || "Administrative concession withdrawal";

    const auditEntry = {
      action: "DISCOUNT_CANCELLED",
      performedBy: adminUser?.name || "Admin",
      performedAt: new Date(),
      details: { cancellationReason },
      notes: `Discount offer cancelled by ${adminUser?.name || "Admin"}. Reason: ${cancellationReason}`,
    };

    const updated = await memberDiscountRepository.updateById(id, {
      status: MEMBER_DISCOUNT_STATUS.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason,
      cancelledBy: {
        id: adminUser?.id || "",
        name: adminUser?.name || "Admin",
      },
      $push: { auditLogs: auditEntry },
    });

    return updated;
  }

  /**
   * Resends an in-app discount notification to the member.
   */
  async resendNotification(id, adminUser = { name: "Admin" }) {
    const discount = await this.getById(id);

    if (discount.status === MEMBER_DISCOUNT_STATUS.REDEEMED) {
      throw new ConflictError("Discount is already redeemed; notification cannot be resent.");
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.CANCELLED) {
      throw new ConflictError("Discount is cancelled; notification cannot be resent.");
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.EXPIRED) {
      throw new ConflictError("Discount is expired; notification cannot be resent.");
    }

    const notif = await notificationService.createNotification({
      recipientId: discount.memberId,
      recipientRole: "member",
      title: `Reminder: ₹${discount.discountAmount.toLocaleString("en-IN")} OFF on ${discount.planName}!`,
      message: `Don't miss out on your special concession of ${
        discount.discountType === "percentage"
          ? discount.discountValue + "%"
          : "₹" + discount.discountValue.toLocaleString("en-IN")
      } on ${discount.planName}. Your Exclusive Price: ₹${discount.finalPayableAmount.toLocaleString(
        "en-IN"
      )}.${
        discount.expiryDate
          ? " Valid until " +
            new Date(discount.expiryDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }) +
            "."
          : ""
      } Apply this offer to your next membership payment.`,
      type: "MEMBER_DISCOUNT_OFFER",
      data: {
        discountId: discount.id,
        campaignId: discount.campaignId,
        planId: discount.planId,
        planName: discount.planName,
        standardPrice: discount.standardPrice,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: discount.discountAmount,
        finalPayableAmount: discount.finalPayableAmount,
        expiryDate: discount.expiryDate,
        url: "/member/payments/members",
      },
    });

    const auditEntry = {
      action: "NOTIFICATION_RESENT",
      performedBy: adminUser?.name || "Admin",
      performedAt: new Date(),
      details: { notificationId: notif.id },
      notes: `Discount notification resent to ${discount.memberName} (${discount.memberId}).`,
    };

    const updated = await memberDiscountRepository.updateById(id, {
      status: MEMBER_DISCOUNT_STATUS.NOTIFIED,
      notificationStatus: "SENT",
      notificationId: notif.id,
      notificationSentAt: new Date(),
      $push: { auditLogs: auditEntry },
    });

    return updated;
  }

  /**
   * Applies the discount to a pending payment session (reserving the offer).
   */
  async markPaymentPending({ discountId, invoiceNumber, orderId, adminUser = { name: "System" } }) {
    const discount = await this.getById(discountId);

    if (discount.status === MEMBER_DISCOUNT_STATUS.REDEEMED) {
      throw new ConflictError("This discount has already been redeemed.");
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.CANCELLED) {
      throw new ConflictError("This discount has been cancelled.");
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.EXPIRED) {
      throw new ConflictError("This discount has expired.");
    }

    const auditEntry = {
      action: "APPLIED_TO_PENDING_PAYMENT",
      performedBy: adminUser?.name || "System",
      performedAt: new Date(),
      details: { invoiceNumber, orderId },
      notes: `Discount attached to checkout session / invoice ${invoiceNumber || "N/A"}.`,
    };

    return memberDiscountRepository.updateById(discountId, {
      status: MEMBER_DISCOUNT_STATUS.PAYMENT_PENDING,
      "appliedToInvoice.invoiceNumber": invoiceNumber || "",
      "appliedToInvoice.gatewayOrderId": orderId || "",
      "appliedToInvoice.appliedAt": new Date(),
      $push: { auditLogs: auditEntry },
    });
  }

  /**
   * Redeems the discount upon verified successful payment.
   * Strictly idempotent to protect against repeated webhooks and concurrent calls.
   */
  async redeemDiscount({
    discountId,
    paymentId,
    transactionId,
    amountPaid,
    invoiceNumber,
    upiReference = "",
    adminUser = { name: "Payment Gateway / Admin" },
  }) {
    const discount = await this.getById(discountId);

    // Idempotency guard: already redeemed
    if (discount.status === MEMBER_DISCOUNT_STATUS.REDEEMED) {
      return {
        alreadyRedeemed: true,
        discount,
      };
    }

    const auditEntry = {
      action: "DISCOUNT_REDEEMED",
      performedBy: adminUser?.name || "Payment Verification",
      performedAt: new Date(),
      details: {
        paymentId,
        transactionId,
        amountPaid,
        invoiceNumber,
        upiReference,
      },
      notes: `Discount successfully redeemed for payment ₹${amountPaid}. Invoice: ${
        invoiceNumber || "N/A"
      }.`,
    };

    const updated = await memberDiscountRepository.updateById(discountId, {
      status: MEMBER_DISCOUNT_STATUS.REDEEMED,
      timesUsed: 1,
      redeemedAt: new Date(),
      "appliedToInvoice.paymentId": paymentId || "",
      "appliedToInvoice.transactionId": transactionId || "",
      "appliedToInvoice.invoiceNumber": invoiceNumber || discount.appliedToInvoice?.invoiceNumber || "",
      "appliedToInvoice.amountPaid": amountPaid || discount.finalPayableAmount,
      "appliedToInvoice.appliedAt": new Date(),
      $push: { auditLogs: auditEntry },
    });

    return {
      alreadyRedeemed: false,
      discount: updated,
    };
  }

  /**
   * Releases a pending discount back to Notified / Assigned status if checkout fails or is abandoned.
   */
  async releasePendingDiscount(discountId, reason = "Payment session expired or failed") {
    const discount = await memberDiscountRepository.findById(discountId);
    if (!discount) return null;

    if (discount.status === MEMBER_DISCOUNT_STATUS.PAYMENT_PENDING) {
      const rollbackStatus = discount.notificationStatus === "SENT"
        ? MEMBER_DISCOUNT_STATUS.NOTIFIED
        : MEMBER_DISCOUNT_STATUS.ASSIGNED;

      const auditEntry = {
        action: "PAYMENT_ATTEMPT_RELEASED",
        performedBy: "System Payment Monitor",
        performedAt: new Date(),
        details: { reason },
        notes: `Discount restored to ${rollbackStatus}. Reason: ${reason}`,
      };

      return memberDiscountRepository.updateById(discountId, {
        status: rollbackStatus,
        $push: { auditLogs: auditEntry },
      });
    }

    return discount;
  }

  /**
   * Generates a checkout link for discounted membership renewal.
   */
  async generateDiscountCheckoutLink(id, adminUser = { name: "System" }) {
    const discount = await this.getById(id);

    if (discount.status === MEMBER_DISCOUNT_STATUS.REDEEMED) {
      throw new ConflictError("This discount has already been redeemed.");
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.CANCELLED) {
      throw new ConflictError("This discount offer has been cancelled.");
    }
    if (discount.status === MEMBER_DISCOUNT_STATUS.EXPIRED) {
      throw new ConflictError("This discount offer has expired.");
    }

    const paymentGatewayService = require("../enrollments/services/paymentGateway.service");
    const linkData = await paymentGatewayService.createPaymentLink({
      amount: discount.finalPayableAmount,
      referenceId: discount.id,
      description: `${discount.planName} Membership Renewal (Discount ₹${discount.discountAmount} OFF)`,
      customer: {
        name: discount.memberName,
        email: discount.memberEmail,
        contact: discount.memberMobile,
      },
    });

    await this.markPaymentPending({
      discountId: id,
      invoiceNumber: `INV-REN-${Date.now().toString().slice(-6)}`,
      orderId: linkData.orderId,
      adminUser,
    });

    return {
      discountId: discount.id,
      paymentUrl: linkData.url,
      orderId: linkData.orderId,
      linkId: linkData.linkId,
      amount: discount.finalPayableAmount,
      planName: discount.planName,
    };
  }

  /**
   * Verifies online signature and activates renewal with redeemed discount.
   */
  async verifyDiscountOnlinePayment(id, verifyData) {
    const discount = await this.getById(id);

    if (discount.status === MEMBER_DISCOUNT_STATUS.REDEEMED) {
      return {
        alreadyRedeemed: true,
        discount,
      };
    }

    const paymentGatewayService = require("../enrollments/services/paymentGateway.service");
    const orderId = verifyData.razorpay_order_id || discount.appliedToInvoice?.gatewayOrderId;
    const paymentId = verifyData.razorpay_payment_id || `pay_${Date.now()}`;
    const signature = verifyData.razorpay_signature || (verifyData.mockPayment ? "simulated_success" : "");

    const isValid = paymentGatewayService.verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      await this.releasePendingDiscount(id, "Cryptographic gateway signature verification failed");
      throw new ValidationError("Payment signature verification failed.");
    }

    // Call member renewal service with applied discount
    const memberService = require("../members/member.service");
    const renewalResult = await memberService.renewMembership(discount.memberId, {
      planId: discount.planId,
      discountId: discount.id,
      paymentMethod: "Razorpay / Online",
      transactionId: paymentId,
      paymentId,
      upiReference: verifyData.upiReference || "",
      adminUser: { name: "Online Payment Gateway" },
    });

    return {
      success: true,
      discountId: discount.id,
      paymentId,
      member: renewalResult.member,
      paymentBreakdown: renewalResult.paymentBreakdown,
    };
  }
}

module.exports = new MemberDiscountService();

