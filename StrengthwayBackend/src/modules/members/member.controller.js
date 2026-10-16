"use strict";

const memberService = require("./member.service");
const { success, created, paginated } = require("../../shared/response");
const { parsePaginationParams, buildPaginationResult } = require("../../shared/pagination");

/**
 * Strips sensitive financial information for non-billing roles (e.g. Trainers).
 * Trainers can view member fitness profiles, schedule, and attendance, but not payment amounts or transaction receipts.
 */
function sanitizeMemberForRole(memberDoc, role) {
  if (!memberDoc) return memberDoc;
  const m = typeof memberDoc.toObject === "function" ? memberDoc.toObject() : { ...memberDoc };
  if (role === "trainer") {
    delete m.paymentAmount;
    delete m.paymentMethod;
    delete m.paymentDate;
    delete m.paymentNotes;
    delete m.transactionId;
    delete m.paymentDetails;
    delete m.paymentPlanId;
    if (m.membershipPlan && typeof m.membershipPlan === "object") {
      m.membershipPlan = { ...m.membershipPlan };
      delete m.membershipPlan.price;
      delete m.membershipPlan.formattedPrice;
    }
  }
  return m;
}

async function getAll(req, res, next) {
  try {
    const { page, pageSize, skip } = parsePaginationParams(req.query);
    const { status, includeDeleted, search } = req.query;

    const { data, total } = await memberService.getAll({
      page,
      pageSize,
      skip,
      status,
      includeDeleted: includeDeleted === "true" || includeDeleted === true,
      search: search?.trim() || "",
      scopedMemberIds: req.scopedMemberIds ?? null,
    });

    const userRole = req.user?.role;
    const sanitizedData = userRole === "trainer"
      ? data.map((m) => sanitizeMemberForRole(m, userRole))
      : data;

    return paginated(
      res,
      {
        data: sanitizedData,
        ...buildPaginationResult(total, page, pageSize),
      },
      "Members retrieved successfully."
    );
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const member = await memberService.getById(req.params.id);
    const sanitizedMember = sanitizeMemberForRole(member, req.user?.role);
    return success(res, sanitizedMember, "Member retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const member = await memberService.create(req.body);
    return created(res, member, "Member registered successfully.");
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const member = await memberService.update(req.params.id, req.body);
    return success(res, member, "Member updated successfully.");
  } catch (err) {
    next(err);
  }
}

async function softDelete(req, res, next) {
  try {
    const member = await memberService.softDelete(req.params.id);
    return success(res, member, "Member archived successfully.");
  } catch (err) {
    next(err);
  }
}

async function restore(req, res, next) {
  try {
    const member = await memberService.restore(req.params.id);
    return success(res, member, "Member restored successfully.");
  } catch (err) {
    next(err);
  }
}

async function permanentDelete(req, res, next) {
  try {
    const result = await memberService.permanentDelete(req.params.id);
    return success(res, result, "Member permanently deleted.");
  } catch (err) {
    next(err);
  }
}

async function toggleStatus(req, res, next) {
  try {
    const member = await memberService.toggleStatus(req.params.id);
    return success(res, member, `Member status changed to ${member.status}.`);
  } catch (err) {
    next(err);
  }
}

async function convertLead(req, res, next) {
  try {
    const member = await memberService.convertLead(req.params.id, req.body);
    return success(res, member, "Lead converted to Active member successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthTracking(req, res, next) {
  try {
    const { month } = req.query;
    const tracking = await memberService.getMemberMonthTracking(req.params.id, month);
    if (tracking?.member) {
      tracking.member = sanitizeMemberForRole(tracking.member, req.user?.role);
    }
    return success(res, tracking, "Member month tracking retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function recordContact(req, res, next) {
  try {
    const member = await memberService.recordContact(req.params.id, req.body);
    return success(res, member, "Contact details recorded successfully.");
  } catch (err) {
    next(err);
  }
}

async function archiveInquiry(req, res, next) {
  try {
    const member = await memberService.archiveInquiry(req.params.id, req.body?.reason);
    return success(res, member, "Inquiry moved to archived.");
  } catch (err) {
    next(err);
  }
}

async function renewMembership(req, res, next) {
  try {
    const result = await memberService.renewMembership(req.params.id, req.body);
    return success(res, result, "Membership renewed successfully with adjustment deduction.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  softDelete,
  restore,
  permanentDelete,
  toggleStatus,
  convertLead,
  recordContact,
  archiveInquiry,
  getMonthTracking,
  renewMembership,
};

