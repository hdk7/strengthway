export const DEFAULT_PERMISSION_DEFINITIONS = [
  {
    module: "dashboard",
    label: "Dashboard & Analytics",
    description: "Operational metrics, daily class roster, and quick actions",
    actions: [
      { id: "view", label: "View Dashboard", description: "Access the role-tailored dashboard screen" },
    ],
  },
  {
    module: "members",
    label: "Members Directory",
    description: "Gym athletes, enrollment dossiers, and fitness profiles",
    actions: [
      { id: "view", label: "View All Members", description: "Browse the full member roster and directories" },
      { id: "view_assigned", label: "View Assigned Members", description: "View only athletes enrolled in assigned batches" },
      { id: "create", label: "Register New Member", description: "Add and enroll new athletes into the gym" },
      { id: "edit", label: "Edit Member Profiles", description: "Modify athlete vitals, contacts, and personal data" },
      { id: "delete", label: "Archive / Delete Member", description: "Soft-delete or permanently remove athletes" },
    ],
  },
  {
    module: "batches",
    label: "Batch Schedules",
    description: "Operating batch slots, room allocations, and capacity",
    actions: [
      { id: "view", label: "View All Batches", description: "Inspect all operating time slots and schedules" },
      { id: "view_assigned", label: "View Assigned Batches", description: "Access only batches where assigned as coach/athlete" },
      { id: "create", label: "Create Batches", description: "Configure new batch times and capacity" },
      { id: "edit", label: "Edit Batches", description: "Update batch timings, faculty coaches, and room" },
      { id: "delete", label: "Delete Batches", description: "Remove operating batches" },
    ],
  },
  {
    module: "classes",
    label: "Class Curriculum & Sessions",
    description: "Training programs, daily workouts, and session conduction logs",
    actions: [
      { id: "view", label: "View Class Curriculum", description: "Inspect scheduled workout routines and timetable" },
      { id: "edit", label: "Edit Class Syllabus", description: "Modify master class subjects and workout splits" },
      { id: "log_notes", label: "Log Session Notes", description: "Record daily coach notes and athlete performance feedback" },
    ],
  },
  {
    module: "attendance",
    label: "Biometric Attendance & Logs",
    description: "Daily roll-call, member punch status, and trainer shift tracking",
    actions: [
      { id: "view", label: "View Attendance Grid", description: "Inspect monthly attendance records and registers" },
      { id: "view_own", label: "View Own Attendance", description: "View personal punch history and consistency rate" },
      { id: "mark_attendance", label: "Mark Member Attendance", description: "Record daily present/absent roll call for athletes" },
      { id: "edit", label: "Edit Past Logs", description: "Modify historical attendance check-in stamps" },
    ],
  },
  {
    module: "payments",
    label: "Payments & Financials",
    description: "Membership fee receipts, dues collection, and trainer payroll",
    actions: [
      { id: "view", label: "View All Financials", description: "Inspect full gym revenue, collections, and dues" },
      { id: "view_own", label: "View Own Receipts", description: "Access own subscription receipts or coach payouts" },
      { id: "create", label: "Collect / Record Payments", description: "Generate receipts and mark membership fees as paid" },
      { id: "export", label: "Export Tax & Invoices", description: "Download financial summaries and accounting CSVs" },
    ],
  },
  {
    module: "inquiries",
    label: "Inquiries & Leads Pipeline",
    description: "Trial bookings, prospective leads, and conversion records",
    actions: [
      { id: "view", label: "View Inquiries", description: "Browse leads and trial workout requests" },
      { id: "create", label: "Add Inquiry", description: "Log a new prospective client inquiry" },
      { id: "edit", label: "Contact & Convert Leads", description: "Record follow-ups and convert leads to active members" },
      { id: "delete", label: "Archive Inquiries", description: "Dismiss inactive leads" },
    ],
  },
  {
    module: "reports",
    label: "Reports & Analytics",
    description: "Attendance trends, capacity utilization, and member retention",
    actions: [
      { id: "view", label: "View Analytics", description: "Access operational reports and performance metrics" },
      { id: "export", label: "Export Reports", description: "Download analytics data to Excel or PDF" },
    ],
  },
  {
    module: "masters",
    label: "Master Data Configurations",
    description: "Membership pricing plans, holiday lists, and attendance policies",
    actions: [
      { id: "view", label: "View Master Configs", description: "Read-only access to gym fee templates and policies" },
      { id: "edit", label: "Manage Master Configs", description: "Create or edit plans, fee rules, and holiday calendars" },
    ],
  },
  {
    module: "settings",
    label: "System Settings & RBAC",
    description: "Facility configuration, role permissions, and audit logs",
    actions: [
      { id: "view", label: "View System Settings", description: "Inspect facility metadata and configuration" },
      { id: "manage_roles", label: "Manage Roles & Permissions", description: "Configure trainer and member access matrices" },
    ],
  },
];

export const DEFAULT_FALLBACK_ROLES = {
  trainer: {
    dashboard: ["view"],
    members: ["view_assigned"],
    batches: ["view_assigned"],
    classes: ["view", "log_notes"],
    attendance: ["view", "view_own"],
    payments: ["view_own"],
    inquiries: [],
    reports: ["view"],
    masters: [],
    settings: [],
  },
  member: {
    dashboard: ["view"],
    members: ["view_own"],
    batches: ["view_assigned"],
    classes: [],
    attendance: ["view_own"],
    payments: ["view_own"],
    inquiries: [],
    reports: ["view"],
    masters: [],
    settings: [],
  },
};
