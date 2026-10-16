"use strict";

const enrollmentRepository = require("./enrollment.repository");
const inquiryRepository = require("../inquiries/inquiry.repository");
const planRepository = require("../membership-plans/plan.repository");
const memberRepository = require("../members/member.repository");
const batchRepository = require("../batches/batch.repository");
const paymentGatewayService = require("./services/paymentGateway.service");
const whatsappService = require("./services/whatsapp.service");

const {
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../../shared/apiError");
const {
  ENROLLMENT_STATUS,
  INQUIRY_STATUS,
  MEMBER_STATUS,
  DISCOUNT_TYPES,
} = require("../../shared/constants");
const {
  generateEnrollmentId,
  generateInvoiceNumber,
  generateMemberId,
  generateReceiptNumber,
  generateTransactionId,
} = require("../../shared/idGenerator");
const { calculateMembershipDates } = require("../../shared/dateUtils");

class EnrollmentService {
  /**
   * Returns list of enrollments with search, status filtering, and pagination.
   */
  async getAll({ status, search, skip = 0, limit = 50 } = {}) {
    const filter = { isDeleted: false };

    if (status && status !== "ALL" && status !== "All") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { id: regex },
        { "invoice.invoiceNumber": regex },
        { "personalDetails.firstName": regex },
        { "personalDetails.lastName": regex },
        { "personalDetails.email": regex },
        { "personalDetails.mobile": regex },
        { "membershipPlan.name": regex },
        { inquiryId: regex },
      ];
    }

    const [enrollments, total] = await Promise.all([
      enrollmentRepository.findAll({ filter, skip: Number(skip), limit: Number(limit) }),
      enrollmentRepository.count(filter),
    ]);

    return { data: enrollments, total };
  }

  /**
   * Retrieves an enrollment by its ID.
   */
  async getById(id) {
    const enrollment = await enrollmentRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundError(`Enrollment "${id}" not found.`);
    }
    return enrollment;
  }

  /**
   * Retrieves active enrollment linked to an inquiry.
   */
  async getInquiryEnrollment(inquiryId) {
    return enrollmentRepository.findActiveByInquiryId(inquiryId);
  }

  /**
   * Retrieves next available enrollment ID and invoice number.
   */
  async getNextIds() {
    const year = new Date().getFullYear();
    const [maxEnrollmentSuffix, maxInvoiceSuffix] = await Promise.all([
      enrollmentRepository.getMaxIdSuffix(year),
      enrollmentRepository.getMaxInvoiceSuffix(year),
    ]);

    return {
      enrollmentId: generateEnrollmentId(maxEnrollmentSuffix, year),
      invoiceNumber: generateInvoiceNumber(maxInvoiceSuffix, year),
    };
  }

  /**
   * Creates or updates an enrollment and generates an invoice and payment link.
   * Prevents duplicate enrollment / invoice creation if submitted multiple times.
   */
  async createEnrollment(body, adminUser = { name: "Admin", email: "admin@strengthway.com" }) {
    const inquiryId = body.inquiryId?.trim();
    if (!inquiryId) {
      throw new ValidationError("Inquiry ID is required to create an enrollment.");
    }

    // 1. Verify inquiry exists and has not already been converted
    const inquiry = await inquiryRepository.findById(inquiryId);
    if (!inquiry) {
      throw new NotFoundError(`Inquiry "${inquiryId}" not found.`);
    }
    if (inquiry.status === INQUIRY_STATUS.CONVERTED || inquiry.convertedMemberId) {
      throw new ConflictError(
        `Inquiry "${inquiryId}" has already been converted to an active Member (${inquiry.convertedMemberId}).`
      );
    }

    // 2. Verify selected membership plan
    const plan = await planRepository.findById(body.planId);
    if (!plan) {
      throw new NotFoundError(`Membership plan "${body.planId}" not found.`);
    }

    // 3. Strict backend-validated discount and pricing computation
    const originalPrice = Number(plan.price);
    const discountType = body.discountType || DISCOUNT_TYPES.NONE;
    const discountValue = Math.max(0, Number(body.discountValue || 0));
    const discountReason = (body.discountReason || "").trim();

    let discountAmount = 0;
    if (discountType === DISCOUNT_TYPES.PERCENTAGE) {
      if (discountValue > 100) {
        throw new ValidationError("Percentage discount cannot exceed 100%.");
      }
      discountAmount = Math.round((originalPrice * discountValue) / 100);
    } else if (discountType === DISCOUNT_TYPES.FIXED) {
      if (discountValue > originalPrice) {
        throw new ValidationError(
          `Fixed discount (₹${discountValue}) cannot exceed the plan price (₹${originalPrice}).`
        );
      }
      discountAmount = Math.min(originalPrice, discountValue);
    }

    const finalAmount = Math.max(0, originalPrice - discountAmount);

    // 4. Proposed start date & membership duration calculation
    const startDate = body.proposedStartDate ? new Date(body.proposedStartDate) : new Date();
    const dates = calculateMembershipDates(plan.durationMonths, startDate);

    // 5. Batch assignment details
    let batchName = "";
    let batchTiming = "";
    if (body.batchId) {
      try {
        const batch = await batchRepository.findById(body.batchId);
        if (batch) {
          batchName = batch.name;
          batchTiming = batch.timingLabel;
        }
      } catch {
        // Non-fatal
      }
    }

    // 6. Check for existing active/pending enrollment to prevent duplicate records
    const existingEnrollment = await enrollmentRepository.findActiveByInquiryId(inquiryId);
    const prevDetails = existingEnrollment?.personalDetails || {};

    const personalDetails = {
      firstName: (body.firstName || prevDetails.firstName || "").trim(),
      lastName: (body.lastName || prevDetails.lastName || "-").trim(),
      name: `${(body.firstName || prevDetails.firstName || "").trim()} ${(body.lastName || prevDetails.lastName || "").trim()}`.trim(),
      email: (body.email || prevDetails.email || "").trim().toLowerCase(),
      mobile: (body.mobile || prevDetails.mobile || "").trim(),
      gender: body.gender || prevDetails.gender || "Male",
      dob: body.dob || prevDetails.dob || "2000-01-01",
      address: body.address || prevDetails.address || "",
      city: body.city || prevDetails.city || "Bengaluru",
      state: body.state || prevDetails.state || "Karnataka",
      pincode: body.pincode || prevDetails.pincode || "",
      emergencyName: body.emergencyName || prevDetails.emergencyName || "",
      emergencyPhone: body.emergencyPhone || prevDetails.emergencyPhone || "",
      emergencyRelation: body.emergencyRelation || prevDetails.emergencyRelation || "Other",
      bio: body.bio || prevDetails.bio || "",
      photo: body.photo || prevDetails.photo || null,
      photoName: body.photoName || prevDetails.photoName || null,
    };

    const membershipPlanSnapshot = {
      id: plan.id,
      name: plan.name,
      durationMonths: plan.durationMonths,
      price: originalPrice,
      formattedPrice: `₹${originalPrice.toLocaleString("en-IN")}`,
      startDate: new Date(dates.startDate),
      endDate: new Date(dates.endDate),
      formattedStart: dates.formattedStart,
      formattedEnd: dates.formattedEnd,
    };

    const pricing = {
      originalPrice,
      discountType,
      discountValue,
      discountReason,
      discountAmount,
      finalAmount,
      paidAmount: 0,
      balanceAmount: finalAmount,
    };

    const year = new Date().getFullYear();
    const enrollmentId =
      existingEnrollment?.id ||
      generateEnrollmentId(await enrollmentRepository.getMaxIdSuffix(year), year);

    const invoiceNumber =
      existingEnrollment?.invoice?.invoiceNumber ||
      generateInvoiceNumber(await enrollmentRepository.getMaxInvoiceSuffix(year), year);

    // 7. Secure Payment Link Generation
    const paymentLinkData = await paymentGatewayService.createPaymentLink({
      amount: finalAmount,
      referenceId: enrollmentId,
      description: `${plan.name} Membership (${plan.durationMonths} Mo) — Strengthway Gym`,
      customer: {
        name: personalDetails.name,
        email: personalDetails.email,
        contact: personalDetails.mobile,
      },
    });

    // 8. WhatsApp Message Dispatch
    const whatsappData = await whatsappService.sendPaymentLink({
      toPhone: personalDetails.mobile,
      candidateName: personalDetails.name,
      planName: plan.name,
      durationMonths: plan.durationMonths,
      finalAmount,
      invoiceNumber,
      paymentLink: paymentLinkData.url,
      proposedStartDate: dates.startDate,
      enrollmentId,
      inquiryId,
      adminUser,
    });

    const invoice = {
      invoiceNumber,
      status: "Pending Payment",
      subtotal: originalPrice,
      discount: discountAmount,
      totalAmount: finalAmount,
      amountPaid: 0,
      dueAmount: finalAmount,
      issuedAt: existingEnrollment?.invoice?.issuedAt || new Date(),
      paidAt: null,
      paymentGateway: paymentLinkData.gateway,
      gatewayOrderId: paymentLinkData.orderId,
      paymentLink: {
        linkId: paymentLinkData.linkId,
        url: paymentLinkData.url,
        shortUrl: paymentLinkData.shortUrl,
        expiresAt: paymentLinkData.expiresAt,
        status: "Created",
      },
    };

    const initialAuditLogs = existingEnrollment ? existingEnrollment.auditLogs || [] : [];
    const auditEntry = {
      action: existingEnrollment ? "ENROLLMENT_UPDATED" : "ENROLLMENT_CREATED",
      performedBy: adminUser?.name || "Admin",
      performedAt: new Date(),
      details: {
        planId: plan.id,
        planName: plan.name,
        originalPrice,
        discountType,
        discountValue,
        discountAmount,
        finalAmount,
        invoiceNumber,
        paymentLink: paymentLinkData.url,
      },
      notes: existingEnrollment
        ? `Enrollment details refreshed for ${personalDetails.name}. Invoice ${invoiceNumber}.`
        : `Enrollment initiated for inquiry ${inquiryId}. Invoice ${invoiceNumber} created with status Pending Payment.`,
    };

    if (discountAmount > 0) {
      initialAuditLogs.push({
        action: "DISCOUNT_APPLIED",
        performedBy: adminUser?.name || "Admin",
        performedAt: new Date(),
        details: {
          discountType,
          discountValue,
          discountAmount,
          reason: discountReason || "Authorized promotional concession",
        },
        notes: `Concession of ₹${discountAmount} applied (${discountType} ${discountValue}). Reason: ${
          discountReason || "Admin authorized"
        }`,
      });
    }

    initialAuditLogs.push(auditEntry);

    const enrollmentPayload = {
      id: enrollmentId,
      inquiryId,
      personalDetails,
      membershipPlan: membershipPlanSnapshot,
      batchId: body.batchId || "",
      batchName,
      batchTiming,
      pricing,
      paymentMode: body.paymentMode || "PAYMENT_LINK",
      status: ENROLLMENT_STATUS.PENDING_PAYMENT,
      invoice,
      whatsappStatus: whatsappData,
      convertedMemberId: null,
      convertedAt: null,
      auditLogs: initialAuditLogs,
      createdBy: adminUser?.name || "Admin",
      isDeleted: false,
    };

    let savedEnrollment;
    if (existingEnrollment) {
      savedEnrollment = await enrollmentRepository.updateById(existingEnrollment.id, enrollmentPayload);
    } else {
      savedEnrollment = await enrollmentRepository.create(enrollmentPayload);
    }

    // Link enrollment to original inquiry
    await inquiryRepository.updateById(inquiryId, { enrollmentId: savedEnrollment.id });

    // 9. If immediate full offline payment was requested on form submit
    if (
      (body.paymentMode === "OFFLINE_CASH" || body.paymentMode === "OFFLINE_UPI") &&
      Number(body.offlinePaidAmount) > 0
    ) {
      return this.recordOfflinePayment(
        savedEnrollment.id,
        {
          amount: Number(body.offlinePaidAmount),
          paymentMethod: body.paymentMode === "OFFLINE_CASH" ? "Cash" : "UPI",
          transactionId: body.offlineTransactionId,
          receiptNotes: body.offlineNotes || "Collected at registration counter",
        },
        adminUser
      );
    }

    return savedEnrollment;
  }

  /**
   * Generates a Razorpay payment link (if active link does not already exist) and
   * dispatches the link to the customer's phone number via Meta's WhatsApp Cloud API.
   * Admin-only action (RBAC protected).
   */
  async generateAndSendPaymentLink(id, adminUser = { name: "Admin" }) {
    const enrollment = await this.getById(id);

    if (enrollment.status === ENROLLMENT_STATUS.CONVERTED || enrollment.invoice?.status === "Paid") {
      throw new ConflictError("Invoice for this enrollment is already paid and converted to Member.");
    }
    if (enrollment.status === ENROLLMENT_STATUS.CANCELLED) {
      throw new ConflictError("Cannot generate or send payment link for a cancelled enrollment.");
    }

    // 1. Check if a valid, unexpired Razorpay payment link already exists
    let paymentLinkData = enrollment.invoice?.paymentLink;
    const isLinkValid =
      paymentLinkData?.url &&
      paymentLinkData?.status === "Created" &&
      paymentLinkData?.expiresAt &&
      new Date(paymentLinkData.expiresAt).getTime() > Date.now();

    if (!isLinkValid) {
      // Generate new Razorpay payment link
      paymentLinkData = await paymentGatewayService.createPaymentLink({
        amount: enrollment.pricing.finalAmount,
        referenceId: enrollment.id,
        description: `${enrollment.membershipPlan.name} Membership (${enrollment.membershipPlan.durationMonths} Mo) — Strengthway Gym`,
        customer: {
          name: enrollment.personalDetails.name,
          email: enrollment.personalDetails.email,
          contact: enrollment.personalDetails.mobile,
        },
      });

      // Update invoice payment link details
      await enrollmentRepository.updateById(id, {
        "invoice.paymentGateway": paymentLinkData.gateway,
        "invoice.gatewayOrderId": paymentLinkData.orderId,
        "invoice.paymentLink": {
          linkId: paymentLinkData.linkId,
          url: paymentLinkData.url,
          shortUrl: paymentLinkData.shortUrl,
          expiresAt: paymentLinkData.expiresAt,
          status: "Created",
        },
      });
    }

    // 2. Validate customer recipient phone format
    const candidateMobile = enrollment.personalDetails.mobile;
    if (!candidateMobile) {
      throw new ValidationError("Candidate mobile phone number is missing from enrollment record.");
    }

    // 3. Dispatch payment link through official Meta WhatsApp Cloud API
    const whatsappResult = await whatsappService.sendPaymentLink({
      toPhone: candidateMobile,
      candidateName: enrollment.personalDetails.name,
      planName: enrollment.membershipPlan.name,
      durationMonths: enrollment.membershipPlan.durationMonths,
      finalAmount: enrollment.pricing.finalAmount,
      invoiceNumber: enrollment.invoice.invoiceNumber,
      paymentLink: paymentLinkData.url,
      proposedStartDate: enrollment.membershipPlan.startDate,
      enrollmentId: enrollment.id,
      inquiryId: enrollment.inquiryId,
      adminUser,
    });

    const resendCount = (enrollment.whatsappStatus?.resendCount || 0) + 1;
    const updatedWhatsappStatus = {
      ...whatsappResult,
      resendCount,
      lastResentAt: new Date(),
    };

    const auditEntry = {
      action: isLinkValid ? "PAYMENT_LINK_RESENT" : "PAYMENT_LINK_GENERATED_AND_SENT",
      performedBy: adminUser?.name || "Admin",
      performedAt: new Date(),
      details: {
        resendCount,
        sentTo: candidateMobile,
        invoiceNumber: enrollment.invoice.invoiceNumber,
        paymentLinkUrl: paymentLinkData.url,
        linkReused: Boolean(isLinkValid),
        whatsappMessageId: whatsappResult.messageId,
      },
      notes: isLinkValid
        ? `Payment link resent via WhatsApp to ${candidateMobile} (Attempt #${resendCount}). Reused active link.`
        : `New Razorpay payment link generated and sent via WhatsApp to ${candidateMobile}.`,
    };

    const updated = await enrollmentRepository.updateById(id, {
      whatsappStatus: updatedWhatsappStatus,
      $push: { auditLogs: auditEntry },
    });

    return updated;
  }

  /**
   * Resends the payment link through WhatsApp (delegates to generateAndSendPaymentLink).
   */
  async resendPaymentLink(id, adminUser = { name: "Admin" }) {
    return this.generateAndSendPaymentLink(id, adminUser);
  }

  /**
   * Records an offline Cash/UPI payment collection with full audit trail.
   * If total payable is met, automatically converts enrollment to active member.
   */
  async recordOfflinePayment(id, paymentData, adminUser = { name: "Admin" }) {
    const enrollment = await this.getById(id);

    if (enrollment.status === ENROLLMENT_STATUS.CONVERTED) {
      throw new ConflictError(
        `Enrollment "${id}" has already been converted to Active Member (${enrollment.convertedMemberId}).`
      );
    }
    if (enrollment.status === ENROLLMENT_STATUS.CANCELLED) {
      throw new ConflictError(`Enrollment "${id}" is cancelled. Cannot record payment.`);
    }

    const amount = Number(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new ValidationError("Payment collection amount must be a positive number.");
    }

    const currentPaid = Number(enrollment.pricing.paidAmount || 0);
    const finalAmount = Number(enrollment.pricing.finalAmount);
    const newPaidAmount = currentPaid + amount;

    if (newPaidAmount > finalAmount) {
      const balance = Math.max(0, finalAmount - currentPaid);
      throw new ValidationError(
        `Payment of ₹${amount} exceeds the outstanding dues of ₹${balance}.`
      );
    }

    const balanceAmount = Math.max(0, finalAmount - newPaidAmount);
    const isFullyPaid = newPaidAmount >= finalAmount;
    const paymentMethod = paymentData.paymentMethod || "Cash";
    const transactionId = paymentData.transactionId?.trim() || generateTransactionId(paymentMethod);
    const receiptNotes = paymentData.receiptNotes?.trim() || "";

    const invoiceStatus = isFullyPaid ? "Paid" : "Partially Paid";
    const enrollmentStatus = isFullyPaid
      ? ENROLLMENT_STATUS.PAYMENT_VERIFIED
      : ENROLLMENT_STATUS.PARTIALLY_PAID;

    const auditEntry = {
      action: "OFFLINE_PAYMENT_RECORDED",
      performedBy: adminUser?.name || "Admin",
      performedAt: new Date(),
      details: {
        amount,
        paymentMethod,
        transactionId,
        newPaidAmount,
        balanceAmount,
        isFullyPaid,
        receiptNotes,
      },
      notes: `Offline ${paymentMethod} payment of ₹${amount} recorded by ${
        adminUser?.name || "Admin"
      }. Status: ${invoiceStatus}.`,
    };

    const updatePayload = {
      "pricing.paidAmount": newPaidAmount,
      "pricing.balanceAmount": balanceAmount,
      "invoice.amountPaid": newPaidAmount,
      "invoice.dueAmount": balanceAmount,
      "invoice.status": invoiceStatus,
      "invoice.gatewayPaymentId": transactionId,
      status: enrollmentStatus,
    };

    if (isFullyPaid) {
      updatePayload["invoice.paidAt"] = new Date();
    }

    await enrollmentRepository.updateById(id, updatePayload);
    await enrollmentRepository.appendAuditLog(id, auditEntry);

    // If fully paid, finalize conversion to Member
    if (isFullyPaid) {
      const refreshedEnrollment = await this.getById(id);
      return this.convertEnrollmentToMember(refreshedEnrollment, {
        adminUser,
        paymentMethod,
        transactionId,
        receiptNotes,
      });
    }

    return this.getById(id);
  }

  /**
   * Verifies an online payment via gateway cryptographic signature.
   * If verified, automatically converts enrollment to active member.
   */
  async verifyOnlinePayment(id, verifyData, adminUser = { name: "System / Payment Gateway" }) {
    const enrollment = await this.getById(id);

    if (enrollment.status === ENROLLMENT_STATUS.CONVERTED) {
      return {
        message: "Enrollment is already verified and converted.",
        enrollment,
        memberId: enrollment.convertedMemberId,
      };
    }

    const orderId = verifyData.razorpay_order_id || enrollment.invoice.gatewayOrderId;
    const paymentId = verifyData.razorpay_payment_id || `pay_${Date.now()}`;
    const signature = verifyData.razorpay_signature || (verifyData.mockPayment ? "simulated_success" : "");

    const isValid = paymentGatewayService.verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      await enrollmentRepository.updateById(id, {
        status: ENROLLMENT_STATUS.PAYMENT_FAILED,
        "invoice.status": "Payment Failed",
      });

      await enrollmentRepository.appendAuditLog(id, {
        action: "PAYMENT_FAILED",
        performedBy: "Payment Gateway",
        performedAt: new Date(),
        details: { orderId, paymentId },
        notes: "Payment verification failed: Signature mismatch or invalid transaction token.",
      });

      throw new ValidationError(
        "Payment verification failed: Gateway signature could not be verified."
      );
    }

    // Mark verified
    const finalAmount = enrollment.pricing.finalAmount;
    await enrollmentRepository.updateById(id, {
      status: ENROLLMENT_STATUS.PAYMENT_VERIFIED,
      "pricing.paidAmount": finalAmount,
      "pricing.balanceAmount": 0,
      "invoice.status": "Paid",
      "invoice.amountPaid": finalAmount,
      "invoice.dueAmount": 0,
      "invoice.paidAt": new Date(),
      "invoice.gatewayPaymentId": paymentId,
      "invoice.gatewaySignature": signature,
    });

    await enrollmentRepository.appendAuditLog(id, {
      action: "PAYMENT_VERIFIED",
      performedBy: adminUser?.name || "Payment Gateway",
      performedAt: new Date(),
      details: { orderId, paymentId },
      notes: `Online payment of ₹${finalAmount} verified successfully.`,
    });

    const refreshedEnrollment = await this.getById(id);
    return this.convertEnrollmentToMember(refreshedEnrollment, {
      adminUser,
      paymentMethod: "Razorpay / Online",
      transactionId: paymentId,
    });
  }

  /**
   * Finalizes an enrollment into an active Member record.
   * Strictly enforces idempotency: never duplicates member records.
   */
  async convertEnrollmentToMember(
    enrollment,
    { adminUser, paymentMethod, transactionId, receiptNotes, upiReference } = {}
  ) {
    // 1. Idempotency guard: if already converted, return existing member
    if (enrollment.convertedMemberId) {
      const existingMember = await memberRepository.findById(enrollment.convertedMemberId);
      if (existingMember) {
        return {
          member: existingMember,
          enrollment,
          alreadyConverted: true,
          receiptNo: existingMember.paymentDetails?.receiptNo,
          invoiceNumber: enrollment.invoice?.invoiceNumber,
          upiReference: existingMember.paymentDetails?.upiReference || upiReference || "",
        };
      }
    }

    // 2. Check if a member already exists with the same inquiryId or email
    const existingByInquiry = await memberRepository.findById(enrollment.inquiryId);
    if (existingByInquiry) {
      await enrollmentRepository.updateById(enrollment.id, {
        status: ENROLLMENT_STATUS.CONVERTED,
        convertedMemberId: existingByInquiry.id,
        convertedAt: new Date(),
      });
      return {
        member: existingByInquiry,
        enrollment,
        alreadyConverted: true,
        receiptNo: existingByInquiry.paymentDetails?.receiptNo,
        invoiceNumber: enrollment.invoice?.invoiceNumber,
        upiReference: existingByInquiry.paymentDetails?.upiReference || upiReference || "",
      };
    }

    // 3. Generate Member ID & Receipt Number
    const currentMaxMemberSuffix = await memberRepository.getMaxIdSuffix();
    const memberId = generateMemberId(currentMaxMemberSuffix);
    const receiptNo = generateReceiptNumber();

    const plan = enrollment.membershipPlan;
    const startDate = plan.startDate ? new Date(plan.startDate) : new Date();
    const dates = calculateMembershipDates(plan.durationMonths, startDate);

    const paidAmount = enrollment.pricing.finalAmount;
    const formattedPrice = `₹${paidAmount.toLocaleString("en-IN")}`;

    // 4. Construct Member Dossier
    const memberPayload = {
      id: memberId,
      fullName: (
        enrollment.personalDetails.name ||
        `${enrollment.personalDetails.firstName} ${enrollment.personalDetails.lastName || ""}`
      ).trim(),
      firstName: enrollment.personalDetails.firstName,
      lastName: enrollment.personalDetails.lastName || "-",
      email: enrollment.personalDetails.email,
      mobile: enrollment.personalDetails.mobile,
      gender: enrollment.personalDetails.gender || "Male",
      dob: enrollment.personalDetails.dob || "2000-01-01",
      address: enrollment.personalDetails.address || "",
      city: enrollment.personalDetails.city || "Bengaluru",
      state: enrollment.personalDetails.state || "Karnataka",
      pincode: enrollment.personalDetails.pincode || "",
      emergencyName: enrollment.personalDetails.emergencyName || "",
      emergencyPhone: enrollment.personalDetails.emergencyPhone || "",
      emergencyRelation: enrollment.personalDetails.emergencyRelation || "Other",
      emergencyContact: {
        name: enrollment.personalDetails.emergencyName || "",
        phone: enrollment.personalDetails.emergencyPhone || "",
        relation: enrollment.personalDetails.emergencyRelation || "Other",
      },
      physicalStats: {
        height: "",
        weight: "",
        bmi: "",
        bloodGroup: "",
      },
      bio: enrollment.personalDetails.bio || "Enrolled via payment-first workflow.",
      photo: enrollment.personalDetails.photo || null,
      photoName: enrollment.personalDetails.photoName || null,
      status: MEMBER_STATUS.ACTIVE,
      registeredAt: new Date(),
      inquiryId: enrollment.inquiryId,
      membershipPlan: {
        id: plan.id,
        name: plan.name,
        durationMonths: plan.durationMonths,
        price: paidAmount,
        formattedPrice,
        startDate: new Date(dates.startDate),
        endDate: new Date(dates.endDate),
        formattedStart: dates.formattedStart,
        formattedEnd: dates.formattedEnd,
      },
      paymentDetails: {
        method: paymentMethod || enrollment.paymentMode || "UPI",
        amount: paidAmount,
        formattedAmount: formattedPrice,
        transactionId:
          transactionId ||
          enrollment.invoice.gatewayPaymentId ||
          generateTransactionId(),
        receiptNo,
        upiReference: upiReference || "",
        invoiceNumber: enrollment.invoice.invoiceNumber,
        status: "Completed",
        paidAt: enrollment.invoice.paidAt || new Date(),
        notes:
          receiptNotes ||
          `Paid for enrollment ${enrollment.id} (Invoice ${enrollment.invoice.invoiceNumber})`,
      },
      batchId: enrollment.batchId || "",
      batchName: enrollment.batchName || "",
      batchTiming: enrollment.batchTiming || "",
      assignedBatch: enrollment.batchName || "General Access",
      schedule: enrollment.batchId
        ? {
            batchId: enrollment.batchId,
            batchName: enrollment.batchName,
            batchTiming: enrollment.batchTiming,
          }
        : null,
      convertedAt: new Date(),
      statusHistory: [
        {
          status: MEMBER_STATUS.ACTIVE,
          changedAt: new Date(),
          changedBy: adminUser?.name || "Payment Verification System",
          notes: `Member successfully enrolled and activated with plan ${plan.name} upon verified payment.`,
        },
      ],
    };

    // 5. Create active Member record
    const createdMember = await memberRepository.create(memberPayload);

    // 6. Automatically enroll member in assigned batch capacity
    if (enrollment.batchId) {
      try {
        const batchService = require("../batches/batch.service");
        await batchService.enrollMember(enrollment.batchId, createdMember.id);
      } catch (batchErr) {
        console.warn(`[Enrollment] Auto-batch enrollment warning:`, batchErr.message);
      }
    }

    // 7. Update Enrollment status to Converted
    const conversionAudit = {
      action: "CONVERTED_TO_MEMBER",
      performedBy: adminUser?.name || "System",
      performedAt: new Date(),
      details: {
        memberId: createdMember.id,
        receiptNo,
        amount: paidAmount,
        transactionId: memberPayload.paymentDetails.transactionId,
        upiReference: upiReference || null,
      },
      notes: `Enrollment converted to active Member record (${createdMember.id}). Receipt ${receiptNo} issued.`,
    };

    const updatedEnrollment = await enrollmentRepository.updateById(enrollment.id, {
      status: ENROLLMENT_STATUS.CONVERTED,
      convertedMemberId: createdMember.id,
      convertedAt: new Date(),
      $push: { auditLogs: conversionAudit },
    });

    // 8. Update original Inquiry status to Converted
    try {
      const inquiryService = require("../inquiries/inquiry.service");
      await inquiryService.updateStatus(enrollment.inquiryId, INQUIRY_STATUS.CONVERTED, {
        convertedMemberId: createdMember.id,
        changedBy: adminUser?.name || "System",
        notes: `Converted to Active Member (${createdMember.id}) following verified enrollment payment.`,
      });
    } catch (inqErr) {
      console.warn("[Enrollment] Inquiry conversion status sync warning:", inqErr.message);
    }

    return {
      member: createdMember,
      enrollment: updatedEnrollment,
      receiptNo,
      invoiceNumber: enrollment.invoice.invoiceNumber,
      transactionId: memberPayload.paymentDetails.transactionId,
      upiReference: upiReference || "",
    };
  }

  /**
   * Cancels a pending enrollment.
   */
  async cancelEnrollment(id, reason = "", adminUser = { name: "Admin" }) {
    const enrollment = await this.getById(id);

    if (enrollment.status === ENROLLMENT_STATUS.CONVERTED) {
      throw new ConflictError("Cannot cancel an enrollment that has already been converted to a Member.");
    }

    const auditEntry = {
      action: "ENROLLMENT_CANCELLED",
      performedBy: adminUser?.name || "Admin",
      performedAt: new Date(),
      details: { reason },
      notes: `Enrollment cancelled by ${adminUser?.name || "Admin"}. Reason: ${reason || "Unspecified"}`,
    };

    return enrollmentRepository.updateById(id, {
      status: ENROLLMENT_STATUS.CANCELLED,
      "invoice.status": "Cancelled",
      $push: { auditLogs: auditEntry },
    });
  }

  /**
   * Handles incoming webhooks from Razorpay payment gateway.
   * Securely verifies HMAC signature and processes payment events idempotently.
   */
  async handleWebhook(payload, signature, rawBody) {
    if (!payload || !payload.event) {
      return { processed: false, reason: "Malformed webhook payload" };
    }

    // 1. Verify Razorpay webhook signature
    const isValidSignature = paymentGatewayService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn("[RazorpayWebhook] Invalid signature received. Webhook rejected.");
      throw new ValidationError("Invalid Razorpay webhook signature.");
    }

    const event = payload.event;
    const plinkEntity = payload.payload?.payment_link?.entity;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    // 2. Identify the target enrollment record
    const linkId = plinkEntity?.id;
    const referenceId =
      plinkEntity?.reference_id ||
      paymentEntity?.notes?.enrollmentId ||
      orderEntity?.notes?.enrollmentId;
    const orderId = paymentEntity?.order_id || orderEntity?.id || plinkEntity?.order_id;
    const invoiceRef =
      plinkEntity?.notes?.invoiceNumber ||
      paymentEntity?.notes?.invoiceNumber;

    let enrollment = null;
    if (linkId) {
      enrollment = await enrollmentRepository.findByPaymentLinkId(linkId);
    }
    if (!enrollment && referenceId) {
      enrollment =
        (await enrollmentRepository.findById(referenceId)) ||
        (await enrollmentRepository.findByInvoiceNumber(referenceId));
    }
    if (!enrollment && orderId) {
      enrollment = await enrollmentRepository.findByOrderId(orderId);
    }
    if (!enrollment && invoiceRef) {
      enrollment = await enrollmentRepository.findByInvoiceNumber(invoiceRef);
    }

    if (!enrollment) {
      return {
        processed: false,
        reason: "No matching enrollment found for webhook identifiers",
        identifiers: { linkId, referenceId, orderId },
      };
    }

    // 3. Idempotency guard: if already converted, safely return
    if (enrollment.status === ENROLLMENT_STATUS.CONVERTED) {
      return {
        processed: true,
        message: "Enrollment is already converted to an active Member record.",
        memberId: enrollment.convertedMemberId,
        enrollmentId: enrollment.id,
      };
    }

    // 4. Handle Specific Razorpay Events
    if (event === "payment_link.paid" || event === "payment.captured" || event === "order.paid") {
      const paymentId = paymentEntity?.id || plinkEntity?.id;
      const amountPaise =
        paymentEntity?.amount ||
        plinkEntity?.amount_paid ||
        plinkEntity?.amount ||
        0;
      const amountPaid = Math.round(Number(amountPaise) / 100);
      const currency = paymentEntity?.currency || "INR";
      const paymentMethod = paymentEntity?.method || "Razorpay / Online";
      const upiReference =
        paymentEntity?.acquirer_data?.upi_transaction_id ||
        paymentEntity?.acquirer_data?.rrn ||
        paymentEntity?.vpa ||
        "";
      const paymentDate = paymentEntity?.created_at
        ? new Date(paymentEntity.created_at * 1000)
        : new Date();

      const finalPayable = Number(enrollment.pricing.finalAmount);

      // Validate payment amount
      if (amountPaid >= finalPayable) {
        // Full payment verified
        await enrollmentRepository.updateById(enrollment.id, {
          status: ENROLLMENT_STATUS.PAYMENT_VERIFIED,
          "pricing.paidAmount": finalPayable,
          "pricing.balanceAmount": 0,
          "invoice.status": "Paid",
          "invoice.amountPaid": finalPayable,
          "invoice.dueAmount": 0,
          "invoice.paidAt": paymentDate,
          "invoice.gatewayPaymentId": paymentId,
          "invoice.gatewayOrderId": orderId || enrollment.invoice?.gatewayOrderId,
        });

        await enrollmentRepository.appendAuditLog(enrollment.id, {
          action: "PAYMENT_VERIFIED_WEBHOOK",
          performedBy: "Razorpay Webhook",
          performedAt: new Date(),
          details: {
            event,
            paymentId,
            orderId,
            amountPaid,
            currency,
            paymentMethod,
            upiReference,
          },
          notes: `Full payment of ₹${amountPaid} verified via Razorpay webhook (${event}). UTR/Ref: ${
            upiReference || "N/A"
          }.`,
        });

        const refreshed = await this.getById(enrollment.id);
        return this.convertEnrollmentToMember(refreshed, {
          adminUser: { name: "Razorpay Gateway Webhook" },
          paymentMethod,
          transactionId: paymentId,
          upiReference,
          receiptNotes: `Razorpay payment verified via webhook event ${event}. UTR: ${
            upiReference || "N/A"
          }`,
        });
      } else if (amountPaid > 0) {
        // Partial payment
        const remaining = Math.max(0, finalPayable - amountPaid);
        await enrollmentRepository.updateById(enrollment.id, {
          status: ENROLLMENT_STATUS.PARTIALLY_PAID,
          "pricing.paidAmount": amountPaid,
          "pricing.balanceAmount": remaining,
          "invoice.status": "Partially Paid",
          "invoice.amountPaid": amountPaid,
          "invoice.dueAmount": remaining,
          "invoice.gatewayPaymentId": paymentId,
        });

        await enrollmentRepository.appendAuditLog(enrollment.id, {
          action: "PARTIAL_PAYMENT_RECEIVED",
          performedBy: "Razorpay Webhook",
          performedAt: new Date(),
          details: { amountPaid, remaining, paymentId },
          notes: `Partial payment of ₹${amountPaid} received. Outstanding balance: ₹${remaining}.`,
        });

        return {
          processed: true,
          status: "Partially Paid",
          amountPaid,
          balanceAmount: remaining,
        };
      }
    }

    if (event === "payment.failed") {
      const errReason = paymentEntity?.error_description || "Razorpay transaction failed";
      await enrollmentRepository.updateById(enrollment.id, {
        status: ENROLLMENT_STATUS.PAYMENT_FAILED,
        "invoice.status": "Payment Failed",
      });

      await enrollmentRepository.appendAuditLog(enrollment.id, {
        action: "PAYMENT_FAILED",
        performedBy: "Razorpay Webhook",
        performedAt: new Date(),
        details: {
          errorCode: paymentEntity?.error_code,
          errorDescription: errReason,
        },
        notes: `Payment attempt failed via Razorpay: ${errReason}`,
      });

      return { processed: true, status: "Payment Failed", reason: errReason };
    }

    if (event === "payment_link.expired") {
      await enrollmentRepository.updateById(enrollment.id, {
        status: ENROLLMENT_STATUS.PAYMENT_EXPIRED,
        "invoice.paymentLink.status": "Expired",
      });

      await enrollmentRepository.appendAuditLog(enrollment.id, {
        action: "PAYMENT_LINK_EXPIRED",
        performedBy: "Razorpay Webhook",
        performedAt: new Date(),
        details: { linkId },
        notes: `Razorpay payment link ${linkId} expired.`,
      });

      return { processed: true, status: "Payment Expired" };
    }

    if (event === "payment_link.cancelled") {
      await enrollmentRepository.updateById(enrollment.id, {
        status: ENROLLMENT_STATUS.CANCELLED,
        "invoice.paymentLink.status": "Cancelled",
        "invoice.status": "Cancelled",
      });

      await enrollmentRepository.appendAuditLog(enrollment.id, {
        action: "PAYMENT_LINK_CANCELLED",
        performedBy: "Razorpay Webhook",
        performedAt: new Date(),
        details: { linkId },
        notes: `Razorpay payment link ${linkId} was cancelled.`,
      });

      return { processed: true, status: "Cancelled" };
    }

    return { processed: true, event, message: "Event ignored or non-actionable." };
  }
}

module.exports = new EnrollmentService();
