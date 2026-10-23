/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  History,
  RotateCcw,
  Save,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LayoutDashboard,
  Inbox,
  Users,
  Dumbbell,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  BarChart3,
  Database,
  Settings,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  UserCheck,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPermissionsMatrix,
  updateRolePermissions,
  resetRolePermissions,
  getPermissionAuditLogs,
} from "@/lib/permissionsService";
import WhatsAppIntegrationSection from "./WhatsAppIntegrationSection";

/**
 * Standard StrengthWay Gym Modules Catalog
 * Tailored specifically for gym operations, faculties, athletes, and facility masters.
 */
const GYM_MATRIX_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard & Live Vitals",
    key: "key: dashboard",
    category: "CORE",
    icon: LayoutDashboard,
    supportedActions: ["visible", "view"],
  },
  {
    id: "inquiries",
    name: "Inquiries & Leads Pipeline",
    key: "key: inquiries",
    category: "GROWTH",
    icon: Inbox,
    supportedActions: ["visible", "create", "view", "edit", "delete"],
  },
  {
    id: "members",
    name: "Athletes Directory (Members)",
    key: "key: members",
    category: "ROSTER",
    icon: Users,
    supportedActions: ["visible", "create", "view", "edit", "delete", "export"],
  },
  {
    id: "trainers",
    name: "Coaching Faculty (Coaches)",
    key: "key: trainers",
    category: "STAFF",
    icon: Dumbbell,
    supportedActions: ["visible", "create", "view", "edit", "delete"],
  },
  {
    id: "batches",
    name: "Batch Schedules & Slots",
    key: "key: batches",
    category: "SCHEDULE",
    icon: CalendarDays,
    supportedActions: ["visible", "create", "view", "edit", "delete"],
  },
  {
    id: "classes",
    name: "Training Classes & Curriculum",
    key: "key: classes",
    category: "WORKOUT",
    icon: Dumbbell,
    supportedActions: ["visible", "create", "view", "edit", "special"],
    specialLabel: "Log Notes",
    specialKey: "log_notes",
  },
  {
    id: "attendance",
    name: "Biometric Attendance & Logs",
    key: "key: attendance",
    category: "OPERATIONS",
    icon: ClipboardCheck,
    supportedActions: ["visible", "view", "edit", "special", "export"],
    specialLabel: "Mark Roll-Call",
    specialKey: "mark_attendance",
  },
  {
    id: "payments",
    name: "Membership Payments & Dues",
    key: "key: payments",
    category: "FINANCE",
    icon: Wallet,
    supportedActions: ["visible", "create", "view", "edit", "export"],
  },
  {
    id: "reports",
    name: "Reports & Capacity Analytics",
    key: "key: reports",
    category: "INSIGHTS",
    icon: BarChart3,
    supportedActions: ["visible", "view", "export"],
  },
  {
    id: "masters",
    name: "Master Plans & Fee Config",
    key: "key: masters",
    category: "MASTER DATA",
    icon: Database,
    supportedActions: ["visible", "create", "view", "edit", "delete"],
  },
  {
    id: "settings",
    name: "Facility Settings & Security",
    key: "key: settings",
    category: "SYSTEM",
    icon: Settings,
    supportedActions: ["visible", "view", "edit"],
  },
];

/**
 * Standard Action Columns for StrengthWay Matrix
 */
const ACTION_COLUMNS = [
  { id: "visible", label: "VISIBLE", tooltip: "Show or hide module in the navigation sidebar" },
  { id: "create", label: "CREATE", tooltip: "Create or register new entries" },
  { id: "view", label: "VIEW", tooltip: "Inspect listings, directories, and detailed profiles" },
  { id: "edit", label: "EDIT", tooltip: "Modify existing records, schedules, or attributes" },
  { id: "delete", label: "DELETE", tooltip: "Archive or permanently delete entries" },
  { id: "special", label: "ACTION / LOG", tooltip: "Role action: Mark attendance roll-call or log session notes" },
  { id: "export", label: "EXPORT", tooltip: "Download data to Excel, CSV, or PDF formats" },
];

/**
 * Role Profiles Catalog
 */
const ROLE_PROFILES = {
  super_admin: {
    id: "super_admin",
    name: "SUPER_ADMIN",
    displayLabel: "Super Administrator",
    badgeLabel: "System Administrator",
    subtitle: "Complete gym management authority with immutable system bypass privileges.",
    isImmutable: true,
  },
  trainer: {
    id: "trainer",
    name: "FACULTY_TRAINER",
    displayLabel: "Faculty Coach (Trainer)",
    badgeLabel: "Coaching Staff",
    subtitle: "Coaches handling assigned batches, read-only member roll-call, and workout curriculum notes.",
    isImmutable: false,
  },
  member: {
    id: "member",
    name: "GYM_ATHLETE",
    displayLabel: "Gym Athlete (Member)",
    badgeLabel: "Enrolled Athlete",
    subtitle: "Athletes accessing their personal conditioning timetable, attendance logs, and payment receipts (class catalogue restricted).",
    isImmutable: false,
  },
};

export default function SettingsPage() {
  const [selectedRole, setSelectedRole] = useState("trainer"); // 'super_admin' | 'trainer' | 'member'
  const [activeView, setActiveView] = useState("matrix"); // 'matrix' | 'audit'
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Backend state
  const [rolePermissions, setRolePermissions] = useState({ trainer: {}, member: {} });
  const [auditLogs, setAuditLogs] = useState([]);

  // Working permissions state for currently selected role
  // Map of module -> array of active action ids: ['visible', 'view', 'create', ...]
  const [workingMatrix, setWorkingMatrix] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Map API permissions object to standard matrix actions
  const apiPermsToMatrix = (perms) => {
    const matrix = {};
    for (const mod of GYM_MATRIX_MODULES) {
      const actions = perms?.[mod.id] || [];
      const activeActions = [];

      // If user has view or view_assigned or view_own -> visible & view
      if (actions.includes("view") || actions.includes("view_assigned") || actions.includes("view_own")) {
        activeActions.push("visible");
        activeActions.push("view");
      }
      if (actions.includes("create")) activeActions.push("create");
      if (actions.includes("edit")) activeActions.push("edit");
      if (actions.includes("delete")) activeActions.push("delete");
      if (actions.includes("export")) activeActions.push("export");
      if (actions.includes("mark_attendance") || actions.includes("log_notes")) {
        activeActions.push("special");
      }

      matrix[mod.id] = activeActions;
    }
    return matrix;
  };

  // Convert standard matrix actions back to backend API actions
  const matrixToApiPerms = (matrix) => {
    const apiPerms = {};
    for (const mod of GYM_MATRIX_MODULES) {
      const active = matrix[mod.id] || [];
      const apiActions = [];

      if (active.includes("view")) {
        if (selectedRole === "member") {
          if (mod.id !== "classes") {
            apiActions.push("view_own");
          }
        } else if (selectedRole === "trainer" && (mod.id === "members" || mod.id === "batches")) {
          apiActions.push("view_assigned");
        } else {
          apiActions.push("view");
        }
      }
      if (active.includes("create")) apiActions.push("create");
      if (active.includes("edit")) {
        if (!(selectedRole === "trainer" && mod.id === "attendance")) {
          apiActions.push("edit");
        }
      }
      if (active.includes("delete")) apiActions.push("delete");
      if (active.includes("export")) apiActions.push("export");
      if (active.includes("special")) {
        if (mod.id === "attendance" && selectedRole !== "trainer") apiActions.push("mark_attendance");
        if (mod.id === "classes") apiActions.push("log_notes");
      }

      apiPerms[mod.id] = apiActions;
    }
    return apiPerms;
  };

  // Load from backend
  const loadData = async () => {
    try {
      const [matrixData, auditData] = await Promise.all([
        getPermissionsMatrix().catch(() => null),
        getPermissionAuditLogs().catch(() => []),
      ]);

      if (matrixData?.roles) {
        setRolePermissions(matrixData.roles);
        const roleData = matrixData.roles[selectedRole] || {};
        setWorkingMatrix(apiPermsToMatrix(roleData));
      } else {
        // Fallback default setup
        setWorkingMatrix(getDefaultMatrixForRole(selectedRole));
      }

      setAuditLogs(Array.isArray(auditData) ? auditData : []);
      setHasChanges(false);
    } catch {
      setWorkingMatrix(getDefaultMatrixForRole(selectedRole));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedRole changes
  useEffect(() => {
    if (selectedRole === "super_admin") {
      // Super admin has every single action on every single module enabled
      const allActive = {};
      for (const mod of GYM_MATRIX_MODULES) {
        allActive[mod.id] = [...mod.supportedActions];
      }
      setWorkingMatrix(allActive);
      setHasChanges(false);
      return;
    }

    const currentRolePerms = rolePermissions[selectedRole];
    if (currentRolePerms) {
      setWorkingMatrix(apiPermsToMatrix(currentRolePerms));
    } else {
      setWorkingMatrix(getDefaultMatrixForRole(selectedRole));
    }
    setHasChanges(false);
  }, [selectedRole, rolePermissions]);

  function getDefaultMatrixForRole(role) {
    const mat = {};
    for (const mod of GYM_MATRIX_MODULES) {
      if (role === "trainer") {
        if (mod.id === "dashboard") mat[mod.id] = ["visible", "view"];
        else if (mod.id === "members") mat[mod.id] = ["visible", "view"];
        else if (mod.id === "batches") mat[mod.id] = ["visible", "view"];
        else if (mod.id === "classes") mat[mod.id] = ["visible", "view", "special"];
        else if (mod.id === "attendance") mat[mod.id] = ["visible", "view"];
        else if (mod.id === "payments") mat[mod.id] = ["visible", "view"];
        else if (mod.id === "reports") mat[mod.id] = ["visible", "view"];
        else mat[mod.id] = [];
      } else if (role === "member") {
        if (["dashboard", "members", "batches", "attendance", "payments"].includes(mod.id)) {
          mat[mod.id] = ["visible", "view"];
        } else {
          mat[mod.id] = [];
        }
      } else {
        mat[mod.id] = [...mod.supportedActions];
      }
    }
    return mat;
  }

  // Toggle single cell
  const handleToggleCell = (moduleId, actionId) => {
    if (selectedRole === "super_admin") return; // Super admin is immutable

    // Phase 3 Rule: Trainers cannot mark or edit attendance
    if (selectedRole === "trainer" && moduleId === "attendance" && (actionId === "special" || actionId === "edit")) {
      toast.info("Coaches have read-only attendance access and cannot mark or edit attendance.");
      return;
    }

    // Phase 3 Rule: Members cannot access class curriculum catalogue
    if (selectedRole === "member" && moduleId === "classes") {
      toast.info("Members cannot view or access the class curriculum catalogue.");
      return;
    }

    setWorkingMatrix((prev) => {
      const currentActions = prev[moduleId] || [];
      const isChecked = currentActions.includes(actionId);

      const nextActions = isChecked
        ? currentActions.filter((a) => a !== actionId)
        : [...currentActions, actionId];

      // If user enabled an action like 'create' or 'edit', also auto-enable 'visible' and 'view'
      if (!isChecked && actionId !== "visible" && !nextActions.includes("visible")) {
        nextActions.push("visible");
      }
      if (!isChecked && actionId !== "view" && !nextActions.includes("view")) {
        nextActions.push("view");
      }

      setHasChanges(true);
      return {
        ...prev,
        [moduleId]: nextActions,
      };
    });
  };

  // Toggle full row
  const handleToggleRow = (moduleDef) => {
    if (selectedRole === "super_admin") return;

    if (selectedRole === "member" && moduleDef.id === "classes") {
      toast.info("Members cannot view or access the class curriculum catalogue.");
      return;
    }

    setWorkingMatrix((prev) => {
      const current = prev[moduleDef.id] || [];
      let allPossible = [...moduleDef.supportedActions];
      if (selectedRole === "trainer" && moduleDef.id === "attendance") {
        allPossible = allPossible.filter((a) => a !== "special" && a !== "edit");
      }
      const isAllActive = allPossible.every((a) => current.includes(a));

      setHasChanges(true);
      return {
        ...prev,
        [moduleDef.id]: isAllActive ? [] : [...allPossible],
      };
    });
  };

  // Save matrix to backend
  const handleSaveMatrix = async () => {
    if (selectedRole === "super_admin") return;

    setSaving(true);
    try {
      const apiPerms = matrixToApiPerms(workingMatrix);
      await updateRolePermissions(selectedRole, apiPerms);
      toast.success(
        `Access Matrix for ${ROLE_PROFILES[selectedRole].displayLabel} saved successfully.`
      );

      setRolePermissions((prev) => ({
        ...prev,
        [selectedRole]: apiPerms,
      }));
      setHasChanges(false);

      const freshAudits = await getPermissionAuditLogs().catch(() => []);
      setAuditLogs(Array.isArray(freshAudits) ? freshAudits : []);
    } catch (err) {
      toast.error(err?.message || "Failed to save role permission matrix.");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (selectedRole === "super_admin") return;

    setResetting(true);
    try {
      const res = await resetRolePermissions(selectedRole);
      toast.success(
        `Reset ${ROLE_PROFILES[selectedRole].displayLabel} matrix back to factory defaults.`
      );

      setRolePermissions((prev) => ({
        ...prev,
        [selectedRole]: res.permissions || {},
      }));
      setWorkingMatrix(apiPermsToMatrix(res.permissions || {}));
      setHasChanges(false);
      setIsResetConfirmOpen(false);

      const freshAudits = await getPermissionAuditLogs().catch(() => []);
      setAuditLogs(Array.isArray(freshAudits) ? freshAudits : []);
    } catch (err) {
      toast.error(err?.message || "Failed to reset role matrix.");
    } finally {
      setResetting(false);
    }
  };

  const activeProfile = ROLE_PROFILES[selectedRole] || ROLE_PROFILES.trainer;

  return (
    <div className="space-y-5">
      {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shrink-0"
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck size={14} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black font-display text-foreground tracking-tight">
                Role Access Permission Matrix
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control granular menu visibility and operational action gates per role (7 action gates per module)
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center p-1 rounded-xl border border-border bg-card shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView("matrix")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "matrix"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck size={13} />
              <span>RBAC Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("whatsapp")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare size={13} />
              <span>WhatsApp Cloud API</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("audit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "audit"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History size={13} />
              <span>Audit Trail</span>
            </button>
          </div>

          {/* Matrix Controls: Role Selector & Save Button */}
          {activeView === "matrix" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Role:
                </span>
                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="appearance-none bg-transparent pr-6 pl-1 py-0.5 text-xs font-black font-mono text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="super_admin" className="bg-popover text-popover-foreground">SUPER_ADMIN</option>
                    <option value="trainer" className="bg-popover text-popover-foreground">FACULTY_TRAINER</option>
                    <option value="member" className="bg-popover text-popover-foreground">GYM_ATHLETE</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-0 top-1 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {selectedRole !== "super_admin" && (
                <button
                  onClick={handleSaveMatrix}
                  disabled={!hasChanges || saving}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                    hasChanges
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground ring-2 ring-primary/25"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Save Matrix</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {activeView === "matrix" ? (
        <div className="space-y-4">
          {/* ── Active Role Configuration Hero Banner ──────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <ShieldCheck size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-sm sm:text-base text-foreground font-mono">
                    Configuring: {activeProfile.name}
                  </h2>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                    {activeProfile.badgeLabel}
                  </span>
                  {activeProfile.isImmutable && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-mono">
                      IMMUTABLE BYPASS
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeProfile.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0 sm:self-auto self-start">
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-medium bg-primary/5 border border-primary/15 px-3 py-1.5 rounded-xl">
                <Sparkles size={13} className="shrink-0 text-amber-400" />
                <span>Changes take effect immediately for active users on next request</span>
              </div>

              {selectedRole !== "super_admin" && (
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  disabled={saving || resetting}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Reset Defaults</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Spreadsheet-style Role Access Permission Matrix Table ─────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
                    <th className="py-3 px-4 w-[280px]">MENU MODULE</th>
                    {ACTION_COLUMNS.map((col) => (
                      <th
                        key={col.id}
                        className="py-3 px-3 text-center uppercase"
                        title={col.tooltip}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center w-[110px]">ROW TOGGLE</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-border/60">
                  {GYM_MATRIX_MODULES.map((mod) => {
                    const Icon = mod.icon;
                    const activeActions = workingMatrix[mod.id] || [];
                    const isAllSelected = mod.supportedActions.every((a) =>
                      activeActions.includes(a)
                    );

                    return (
                      <tr
                        key={mod.id}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {/* Module Column */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                              <Icon size={16} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-foreground truncate">
                                  {mod.name}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50">
                                  {mod.category}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-muted-foreground block">
                                {mod.key}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Action Checkbox Columns */}
                        {ACTION_COLUMNS.map((col) => {
                          const isSupported = mod.supportedActions.includes(col.id);
                          const isChecked = activeActions.includes(col.id);
                          const isRestrictedByRole =
                            (selectedRole === "trainer" && mod.id === "attendance" && (col.id === "special" || col.id === "edit")) ||
                            (selectedRole === "member" && mod.id === "classes");

                          return (
                            <td
                              key={col.id}
                              className="py-3 px-3 text-center align-middle"
                            >
                              {isSupported ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCell(mod.id, col.id)}
                                  disabled={selectedRole === "super_admin" || isRestrictedByRole}
                                  title={
                                    isRestrictedByRole
                                      ? selectedRole === "trainer"
                                        ? "Coaches have read-only attendance access (cannot mark or edit)"
                                        : "Members cannot view or access the class curriculum catalogue"
                                      : `${col.label} for ${mod.name}`
                                  }
                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                                    isRestrictedByRole
                                      ? "border-border/40 bg-muted/30 text-muted-foreground/40 cursor-not-allowed opacity-40"
                                      : isChecked
                                      ? "bg-primary border-primary text-primary-foreground shadow-2xs cursor-pointer"
                                      : "border-border/80 bg-background hover:border-primary/50 cursor-pointer"
                                  } ${
                                    selectedRole === "super_admin"
                                      ? "cursor-not-allowed opacity-90"
                                      : ""
                                  }`}
                                >
                                  {isChecked && !isRestrictedByRole && <Check size={13} strokeWidth={3} />}
                                </button>
                              ) : (
                                <span className="text-muted-foreground/30 font-mono select-none">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Row Toggle Button */}
                        <td className="py-3 px-4 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleRow(mod)}
                            disabled={selectedRole === "super_admin"}
                            className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold font-mono transition-all cursor-pointer ${
                              isAllSelected
                                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                                : "border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                            } ${
                              selectedRole === "super_admin"
                                ? "cursor-not-allowed opacity-60"
                                : ""
                            }`}
                          >
                            Toggle All
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Matrix Footer Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-t border-border/60 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-primary inline-flex items-center justify-center text-primary-foreground">
                    <Check size={9} strokeWidth={3} />
                  </span>
                  <span>Permission Granted</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-border bg-background inline-block" />
                  <span>Permission Revoked</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-muted-foreground/50">—</span>
                  <span>Not Applicable</span>
                </span>
              </div>

              {hasChanges && selectedRole !== "super_admin" && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-500 font-bold">Unsaved changes pending</span>
                  <button
                    onClick={handleSaveMatrix}
                    disabled={saving}
                    className="font-bold underline text-primary hover:no-underline cursor-pointer"
                  >
                    Save Matrix
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeView === "whatsapp" ? (
        <WhatsAppIntegrationSection />
      ) : (
        /* ── Security Audit Trail View ────────────────────────────────────────── */
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <History size={18} className="text-primary" />
                <span>Security Audit Trail & Permission Ledger</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Timestamped records of role access modifications, granting administrators, and diff changes
              </p>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <FileText size={24} className="text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">No permission changes logged yet.</p>
              <p className="text-[11px] text-muted-foreground">Any matrix modifications to Faculty Coach or Athlete roles will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id || log._id}
                  className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2.5 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        log.actionType === "RESET"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : "bg-primary/15 text-primary"
                      }`}>
                        {log.actionType}
                      </span>
                      <span className="font-bold text-xs text-foreground">
                        Target Role: <span className="capitalize">{log.role}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground font-mono">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "Recent"}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <UserCheck size={13} className="text-primary" />
                    <span>Modified by: <strong className="text-foreground">{log.changedByName}</strong> ({log.changedByEmail})</span>
                  </div>

                  {Array.isArray(log.changesSummary) && log.changesSummary.length > 0 && (
                    <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] space-y-1 font-mono">
                      {log.changesSummary.map((c, idx) => (
                        <div key={idx} className="text-foreground/90 flex items-center gap-1.5">
                          <span className="text-primary font-bold">›</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confirmation Modal for Reset ─────────────────────────────────────── */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Reset Permissions to Factory Defaults?
                </h3>
                <p className="text-xs text-muted-foreground">
                  This action will restore default security privileges for <strong>{activeProfile.displayLabel}</strong>.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              All custom permissions configured for this role will be reverted immediately. The reset will be recorded in the Security Audit Trail.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={resetting}
                className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 text-xs font-bold cursor-pointer"
              >
                {resetting && <Loader2 size={13} className="animate-spin" />}
                <span>Yes, Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
