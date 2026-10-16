"use strict";

/**
 * Application-wide enums and constants.
 *
 * All values are Object.freeze()'d to prevent accidental mutation.
 * These mirror the frontend's own implicit enums discovered in:
 *   - membersService.js  (status values, blood groups)
 *   - trainersService.js (status, gender)
 *   - batchesService.js  (days patterns)
 *   - membershipPlans.js (payment methods, plan status)
 */

// ─── Member Statuses ──────────────────────────────────────────────────────────
const MEMBER_STATUS = Object.freeze({
  ACTIVE:    "Active",
  INACTIVE:  "Inactive",
  LEAD:      "Lead",
  INQUIRY:   "Inquiry",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  ARCHIVED:  "Archived",
});

// ─── Trainer Statuses ─────────────────────────────────────────────────────────
const TRAINER_STATUS = Object.freeze({
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
});

// ─── Plan Statuses ────────────────────────────────────────────────────────────
const PLAN_STATUS = Object.freeze({
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
});

// ─── Batch Statuses ───────────────────────────────────────────────────────────
const BATCH_STATUS = Object.freeze({
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
});

// ─── Inquiry Statuses ─────────────────────────────────────────────────────────
const INQUIRY_STATUS = Object.freeze({
  INQUIRY:   "Inquiry",
  CONTACTED: "Contacted",
  CONVERTED: "Converted",
  ARCHIVED:  "Archived",
});

// ─── Demographic / Physical ───────────────────────────────────────────────────
const GENDER = Object.freeze(["Male", "Female", "Other"]);

const CONTACT_METHODS = Object.freeze([
  "Phone Call",
  "WhatsApp",
  "In-Person",
  "Email",
  "SMS",
]);

const BLOOD_GROUPS = Object.freeze([
  "A+", "A-",
  "B+", "B-",
  "AB+", "AB-",
  "O+", "O-",
]);

// ─── Batch Schedule Patterns ──────────────────────────────────────────────────
// MWF = Monday / Wednesday / Friday
// TTS = Tuesday / Thursday / Saturday
const DAYS_PATTERN = Object.freeze([
  "MWF",
  "TTS",
  "CUSTOM",
  "Mon - Fri",
  "Mon - Sat",
  "Daily",
  "Weekend",
]);

// ─── Payment ──────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = Object.freeze(["UPI", "Card", "NetBanking", "Cash"]);

const PAYMENT_STATUS = Object.freeze({
  COMPLETED: "Completed",
  PENDING:   "Pending",
  FAILED:    "Failed",
  REFUNDED:  "Refunded",
});

// ─── Enrollment & Conversion Statuses ─────────────────────────────────────────
const ENROLLMENT_STATUS = Object.freeze({
  CONTACTED:          "Contacted",
  ENROLLMENT_CREATED: "Enrollment Created",
  PENDING_PAYMENT:    "Pending Payment",
  PAYMENT_FAILED:     "Payment Failed",
  PAYMENT_EXPIRED:    "Payment Expired",
  PARTIALLY_PAID:     "Partially Paid",
  PAYMENT_VERIFIED:   "Payment Verified",
  CONVERTED:          "Converted",
  CANCELLED:          "Cancelled",
});

const DISCOUNT_TYPES = Object.freeze({
  NONE:       "none",
  FIXED:      "fixed",
  PERCENTAGE: "percentage",
});

// ─── ID Prefixes (matches frontend MEM-xxxx / TRN-xxx format) ─────────────────
const ID_PREFIXES = Object.freeze({
  MEMBER:      "MEM",
  TRAINER:     "TRN",
  BATCH:       "BATCH",
  PLAN:        "PLAN",
  INQUIRY:     "INQ",
  ENROLLMENT:  "ENR",
  INVOICE:     "INV",
  TXN:         "TXN",
  RECEIPT:          "TSW-REC",
  ASSIGNMENT:       "ASG",
  ATTENDANCE:       "ATT",
  ATTENDANCE_AUDIT: "ATAUD",
  TRAINER_INTERVAL: "TINT",
  TRAINER_LOG:      "TLOG",
  TRAINER_LEAVE:    "TLREQ",
  CLASS:            "CLS",
  SCHEDULE_HISTORY: "SCH-HIST",
  SESSION_NOTE:     "SNOTE",
  PORTFOLIO:        "PTF",
  BATCH_AUDIT:      "BAUD",
  BATCH_SUBSTITUTE_AUDIT: "BSUB",
});

// ─── Pagination Defaults ──────────────────────────────────────────────────────
const PAGINATION = Object.freeze({
  DEFAULT_PAGE:      1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE:     5000,
});

// ─── User Roles (for auth & RBAC) ─────────────────────────────────────────────
const USER_ROLES = Object.freeze({
  ADMIN:   "admin",
  TRAINER: "trainer",
  MEMBER:  "member",
  STAFF:   "staff",
});

// ─── Emergency Relationship options (mirrors frontend dropdown) ───────────────
const EMERGENCY_RELATIONS = Object.freeze([
  "Spouse",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Friend",
  "Other",
]);

// ─── Schedule Statuses ────────────────────────────────────────────────────────
const SCHEDULE_STATUS = Object.freeze({
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
});

// ─── Class Program Statuses ───────────────────────────────────────────────────
const CLASS_STATUS = Object.freeze({
  ACTIVE:   "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
});

// ─── Schedule History Actions ────────────────────────────────────────────────
const SCHEDULE_CHANGE_ACTION = Object.freeze({
  ASSIGN_CLASSES:    "ASSIGN_CLASSES",
  SWAP_DATES:        "SWAP_DATES",
  REORDER:           "REORDER",
  EDIT_WORKOUT:      "EDIT_WORKOUT",
  REMOVE_CLASS:      "REMOVE_CLASS",
  UPDATE_CLASS:      "UPDATE_CLASS",
  RESTORE_CLASS:     "RESTORE_CLASS",
  CANCEL_RESCHEDULE: "CANCEL_RESCHEDULE",
  CANCEL_SESSION:    "CANCEL_SESSION",
});

// ─── Session Statuses ─────────────────────────────────────────────────────────
const SESSION_STATUS = Object.freeze({
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  TODAY:     "TODAY",
  CANCELLED: "CANCELLED",
});

// ─── Holiday Types ────────────────────────────────────────────────────────────
const HOLIDAY_TYPE = Object.freeze([
  "Public Holiday",
  "National Holiday",
  "Festival Holiday",
  "Facility Maintenance",
  "Special Event",
  "Other",
]);

// ─── Batch Assignment Types & Statuses ────────────────────────────────────────
const ASSIGNMENT_TYPE = Object.freeze({
  PRIMARY:            "PRIMARY",
  TEMPORARY_FLEX:     "TEMPORARY_FLEX",
  PERMANENT_TRANSFER: "PERMANENT_TRANSFER",
});

const ASSIGNMENT_STATUS = Object.freeze({
  SCHEDULED: "SCHEDULED",
  ACTIVE:    "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REVOKED:   "REVOKED",
  EXPIRED:   "EXPIRED",
});

// ─── Batch Audit Actions & Roles ──────────────────────────────────────────────
const BATCH_AUDIT_ACTION = Object.freeze({
  FLEX_INITIATED:     "FLEX_INITIATED",
  FLEX_OUT_SCHEDULED: "FLEX_OUT_SCHEDULED",
  FLEX_IN_SCHEDULED:  "FLEX_IN_SCHEDULED",
  FLEX_ACTIVATED:     "FLEX_ACTIVATED",
  FLEX_COMPLETED:     "FLEX_COMPLETED",
  FLEX_CANCELLED:     "FLEX_CANCELLED",
  MEMBER_REJOINED:    "MEMBER_REJOINED",
  TRANSFER_OUT:       "TRANSFER_OUT",
  TRANSFER_IN:        "TRANSFER_IN",
});

const BATCH_AUDIT_ROLE = Object.freeze({
  SOURCE: "SOURCE",
  TARGET: "TARGET",
});

// ─── Attendance Statuses ──────────────────────────────────────────────────────
const ATTENDANCE_STATUS = Object.freeze({
  PRESENT:     "PRESENT",
  ABSENT:      "ABSENT",
  LEAVE:       "LEAVE",
  ON_LEAVE:    "ON_LEAVE",
  LATE:        "LATE",
  EXCUSED:     "EXCUSED",
  CHECKED_IN:  "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
});

// ─── Attendance Exception Types ───────────────────────────────────────────────
const ATTENDANCE_EXCEPTION_TYPE = Object.freeze({
  NONE:              "NONE",
  CHECKOUT_PENDING:  "CHECKOUT_PENDING",
  LATE:              "LATE",
  EARLY_DEPARTURE:   "EARLY_DEPARTURE",
  OUTSIDE_WINDOW:    "OUTSIDE_WINDOW",
  OVERRIDE:          "OVERRIDE",
  AUTO_CHECKOUT:     "AUTO_CHECKOUT",
  MISSED_TRANSITION: "MISSED_TRANSITION",
});

// ─── Trainer Log Statuses ─────────────────────────────────────────────────────
const TRAINER_LOG_STATUS = Object.freeze({
  CONDUCTED:  "CONDUCTED",
  PRESENT:    "PRESENT",
  SUBSTITUTE: "SUBSTITUTE",
  ABSENT:     "ABSENT",
  LEAVE:      "LEAVE",
});

// ─── Trainer Leave Request Statuses ───────────────────────────────────────────
const TRAINER_LEAVE_STATUS = Object.freeze({
  PENDING:   "PENDING",
  APPROVED:  "APPROVED",
  DENIED:    "DENIED",
  REJECTED:  "REJECTED",
  CANCELLED: "CANCELLED",
});

const TRAINER_LEAVE_TYPE = Object.freeze({
  REGULAR:   "REGULAR",
  EMERGENCY: "EMERGENCY",
});

// ─── Portfolio Sections & Statuses ───────────────────────────────────────────
const PORTFOLIO_SECTION = Object.freeze({
  TRAINING_SESSION: "TRAINING_SESSION",
  SESSION_CLIP:     "SESSION_CLIP",
  FEEDBACK_QUOTE:   "FEEDBACK_QUOTE",
  FEEDBACK_VIDEO:   "FEEDBACK_VIDEO",
  PHOTO:            "PHOTO",
  VIDEO:            "VIDEO",
});

const PORTFOLIO_STATUS = Object.freeze({
  ACTIVE:   "Active",
  INACTIVE: "Inactive",
});

// ─── Substitution Reasons & Statuses ──────────────────────────────────────────
const SUBSTITUTION_REASON = Object.freeze({
  LEAVE:     "Leave",
  ABSENT:    "Absent",
  EMERGENCY: "Emergency",
  OTHER:     "Other",
});

const SUBSTITUTION_STATUS = Object.freeze({
  NONE:      "NONE",
  SCHEDULED: "SCHEDULED",
  ACTIVE:    "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

const SUBSTITUTION_ACTION = Object.freeze({
  ASSIGNED:                     "ASSIGNED",
  MODIFIED:                     "MODIFIED",
  CANCELLED:                    "CANCELLED",
  PROCEEDED_WITHOUT_SUBSTITUTE: "PROCEEDED_WITHOUT_SUBSTITUTE",
});

module.exports = {
  MEMBER_STATUS,
  TRAINER_STATUS,
  PLAN_STATUS,
  BATCH_STATUS,
  INQUIRY_STATUS,
  SCHEDULE_STATUS,
  CLASS_STATUS,
  SCHEDULE_CHANGE_ACTION,
  SESSION_STATUS,
  HOLIDAY_TYPE,
  ASSIGNMENT_TYPE,
  ASSIGNMENT_STATUS,
  BATCH_AUDIT_ACTION,
  BATCH_AUDIT_ROLE,
  ATTENDANCE_STATUS,
  ATTENDANCE_EXCEPTION_TYPE,
  TRAINER_LOG_STATUS,
  TRAINER_LEAVE_STATUS,
  TRAINER_LEAVE_TYPE,
  PORTFOLIO_SECTION,
  PORTFOLIO_STATUS,
  SUBSTITUTION_REASON,
  SUBSTITUTION_STATUS,
  SUBSTITUTION_ACTION,
  GENDER,
  CONTACT_METHODS,
  BLOOD_GROUPS,
  DAYS_PATTERN,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  ENROLLMENT_STATUS,
  DISCOUNT_TYPES,
  ID_PREFIXES,
  PAGINATION,
  USER_ROLES,
  EMERGENCY_RELATIONS,
};



