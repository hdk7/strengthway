"use strict";

/**
 * Centralized RBAC Permission Registry
 * ====================================
 * Single source of truth for all modules and granular actions supported
 * across Strengthway backend and frontend.
 */

const MODULES = {
  DASHBOARD: "dashboard",
  MEMBERS: "members",
  BATCHES: "batches",
  CLASSES: "classes",
  ATTENDANCE: "attendance",
  PAYMENTS: "payments",
  ENROLLMENTS: "enrollments",
  REPORTS: "reports",
  INQUIRIES: "inquiries",
  MASTERS: "masters",
  SETTINGS: "settings",
};

const ACTIONS = {
  VIEW: "view",
  VIEW_ASSIGNED: "view_assigned",
  VIEW_OWN: "view_own",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  MARK_ATTENDANCE: "mark_attendance",
  LOG_NOTES: "log_notes",
  EXPORT: "export",
  MANAGE_ROLES: "manage_roles",
};

/**
 * Comprehensive catalog of all available permissions by module
 * Used by the Admin UI to render the permissions matrix
 */
const PERMISSION_DEFINITIONS = [
  {
    module: MODULES.DASHBOARD,
    label: "Dashboard & Analytics",
    description: "Operational metrics, daily class roster, and quick actions",
    actions: [
      { id: ACTIONS.VIEW, label: "View Dashboard", description: "Access the role-tailored dashboard screen" },
    ],
  },
  {
    module: MODULES.MEMBERS,
    label: "Members Directory",
    description: "Gym athletes, enrollment dossiers, and fitness profiles",
    actions: [
      { id: ACTIONS.VIEW, label: "View All Members", description: "Browse the full member roster and directories" },
      { id: ACTIONS.VIEW_ASSIGNED, label: "View Assigned Members", description: "View only athletes enrolled in assigned batches" },
      { id: ACTIONS.CREATE, label: "Register New Member", description: "Add and enroll new athletes into the gym" },
      { id: ACTIONS.EDIT, label: "Edit Member Profiles", description: "Modify athlete vitals, contacts, and personal data" },
      { id: ACTIONS.DELETE, label: "Archive / Delete Member", description: "Soft-delete or permanently remove athletes" },
    ],
  },
  {
    module: MODULES.BATCHES,
    label: "Batch Schedules",
    description: "Operating batch slots, room allocations, and capacity",
    actions: [
      { id: ACTIONS.VIEW, label: "View All Batches", description: "Inspect all operating time slots and schedules" },
      { id: ACTIONS.VIEW_ASSIGNED, label: "View Assigned Batches", description: "Access only batches where assigned as coach/athlete" },
      { id: ACTIONS.CREATE, label: "Create Batches", description: "Configure new batch times and capacity" },
      { id: ACTIONS.EDIT, label: "Edit Batches", description: "Update batch timings, faculty coaches, and room" },
      { id: ACTIONS.DELETE, label: "Delete Batches", description: "Remove operating batches" },
    ],
  },
  {
    module: MODULES.CLASSES,
    label: "Class Curriculum & Sessions",
    description: "Training programs, daily workouts, and session conduction logs",
    actions: [
      { id: ACTIONS.VIEW, label: "View Class Curriculum", description: "Inspect scheduled workout routines and timetable" },
      { id: ACTIONS.EDIT, label: "Edit Class Syllabus", description: "Modify master class subjects and workout splits" },
      { id: ACTIONS.LOG_NOTES, label: "Log Session Notes", description: "Record daily coach notes and athlete performance feedback" },
    ],
  },
  {
    module: MODULES.ATTENDANCE,
    label: "Biometric Attendance & Logs",
    description: "Daily roll-call, member punch status, and trainer shift tracking",
    actions: [
      { id: ACTIONS.VIEW, label: "View Attendance Grid", description: "Inspect monthly attendance records and registers" },
      { id: ACTIONS.VIEW_OWN, label: "View Own Attendance", description: "View personal punch history and consistency rate" },
      { id: ACTIONS.MARK_ATTENDANCE, label: "Mark Member Attendance", description: "Record daily present/absent roll call for athletes" },
      { id: ACTIONS.EDIT, label: "Edit Past Logs", description: "Modify historical attendance check-in stamps" },
    ],
  },
  {
    module: MODULES.PAYMENTS,
    label: "Payments & Financials",
    description: "Membership fee receipts, dues collection, and trainer payroll",
    actions: [
      { id: ACTIONS.VIEW, label: "View All Financials", description: "Inspect full gym revenue, collections, and dues" },
      { id: ACTIONS.VIEW_OWN, label: "View Own Receipts", description: "Access own subscription receipts or coach payouts" },
      { id: ACTIONS.CREATE, label: "Collect / Record Payments", description: "Generate receipts and mark membership fees as paid" },
      { id: ACTIONS.EXPORT, label: "Export Tax & Invoices", description: "Download financial summaries and accounting CSVs" },
    ],
  },
  {
    module: MODULES.INQUIRIES,
    label: "Inquiries & Leads Pipeline",
    description: "Trial bookings, prospective leads, and conversion records",
    actions: [
      { id: ACTIONS.VIEW, label: "View Inquiries", description: "Browse leads and trial workout requests" },
      { id: ACTIONS.CREATE, label: "Add Inquiry", description: "Log a new prospective client inquiry" },
      { id: ACTIONS.EDIT, label: "Contact & Convert Leads", description: "Record follow-ups and convert leads to active members" },
      { id: ACTIONS.DELETE, label: "Archive Inquiries", description: "Dismiss inactive leads" },
    ],
  },
  {
    module: MODULES.REPORTS,
    label: "Reports & Analytics",
    description: "Attendance trends, capacity utilization, and member retention",
    actions: [
      { id: ACTIONS.VIEW, label: "View Analytics", description: "Access operational reports and performance metrics" },
      { id: ACTIONS.EXPORT, label: "Export Reports", description: "Download analytics data to Excel or PDF" },
    ],
  },
  {
    module: MODULES.MASTERS,
    label: "Master Data Configurations",
    description: "Membership pricing plans, holiday lists, and attendance policies",
    actions: [
      { id: ACTIONS.VIEW, label: "View Master Configs", description: "Read-only access to gym fee templates and policies" },
      { id: ACTIONS.EDIT, label: "Manage Master Configs", description: "Create or edit plans, fee rules, and holiday calendars" },
    ],
  },
  {
    module: MODULES.SETTINGS,
    label: "System Settings & RBAC",
    description: "Facility configuration, role permissions, and audit logs",
    actions: [
      { id: ACTIONS.VIEW, label: "View System Settings", description: "Inspect facility metadata and configuration" },
      { id: ACTIONS.MANAGE_ROLES, label: "Manage Roles & Permissions", description: "Configure trainer and member access matrices" },
    ],
  },
];

/**
 * Standard factory defaults for Trainer role
 */
const DEFAULT_TRAINER_PERMISSIONS = {
  [MODULES.DASHBOARD]: [ACTIONS.VIEW],
  [MODULES.MEMBERS]: [ACTIONS.VIEW_ASSIGNED],
  [MODULES.BATCHES]: [ACTIONS.VIEW_ASSIGNED],
  [MODULES.CLASSES]: [ACTIONS.VIEW, ACTIONS.LOG_NOTES],
  [MODULES.ATTENDANCE]: [ACTIONS.VIEW, ACTIONS.VIEW_OWN],
  [MODULES.PAYMENTS]: [ACTIONS.VIEW_OWN],
  [MODULES.INQUIRIES]: [],
  [MODULES.REPORTS]: [ACTIONS.VIEW],
  [MODULES.MASTERS]: [],
  [MODULES.SETTINGS]: [],
};

/**
 * Standard factory defaults for Member role
 */
const DEFAULT_MEMBER_PERMISSIONS = {
  [MODULES.DASHBOARD]: [ACTIONS.VIEW],
  [MODULES.MEMBERS]: [ACTIONS.VIEW_OWN],
  [MODULES.BATCHES]: [ACTIONS.VIEW_ASSIGNED],
  [MODULES.CLASSES]: [],
  [MODULES.ATTENDANCE]: [ACTIONS.VIEW_OWN],
  [MODULES.PAYMENTS]: [ACTIONS.VIEW_OWN],
  [MODULES.INQUIRIES]: [],
  [MODULES.REPORTS]: [ACTIONS.VIEW],
  [MODULES.MASTERS]: [],
  [MODULES.SETTINGS]: [],
};

module.exports = {
  MODULES,
  ACTIONS,
  PERMISSION_DEFINITIONS,
  DEFAULT_TRAINER_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
};
