/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  KeyRound,
  Plus,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Lock,
  Mail,
  User,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Award,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllUsers,
  createUserAccount,
  toggleUserStatus,
  adminResetPassword,
  deleteUserAccount,
} from "@/lib/usersService";
import { getTrainers } from "@/lib/trainersService";
import { getMembers } from "@/lib/membersService";
import { getCurrentUser } from "@/auth/currentUser";
import { DataTable } from "@/components/table";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";
import { InputField, SelectField } from "@/components/form";

// ── Role Styling Definitions ──────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    label: "Administrator",
    sublabel: "Full Facility Management",
    icon: Shield,
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotBg: "bg-purple-500",
  },
  trainer: {
    label: "Faculty Coach",
    sublabel: "Assigned Batches & Attendance",
    icon: Dumbbell,
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotBg: "bg-emerald-500",
  },
  member: {
    label: "Gym Athlete",
    sublabel: "Profile, Schedule & History",
    icon: User,
    badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    dotBg: "bg-sky-500",
  },
};

export default function UsersAccessPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Available profiles for linking
  const [trainersList, setTrainersList] = useState([]);
  const [membersList, setMembersList] = useState([]);

  const currentUser = getCurrentUser();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allUsers, allTrainers, allMembers] = await Promise.all([
        getAllUsers(),
        getTrainers().catch(() => []),
        getMembers().catch(() => []),
      ]);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setTrainersList(Array.isArray(allTrainers) ? allTrainers : []);
      setMembersList(Array.isArray(allMembers) ? allMembers : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load users list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metric summaries
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const trainers = users.filter((u) => u.role === "trainer").length;
    const members = users.filter((u) => u.role === "member").length;
    const active = users.filter((u) => u.isActive !== false).length;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;
    return { total, admins, trainers, members, active, activeRate };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "active" && user.isActive === false) return false;
      if (statusFilter === "inactive" && user.isActive !== false) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = user.name?.toLowerCase().includes(query);
        const matchEmail = user.email?.toLowerCase().includes(query);
        const matchTrainerId = user.trainerId?.toLowerCase().includes(query);
        const matchMemberId = user.memberId?.toLowerCase().includes(query);
        const matchRole = user.role?.toLowerCase().includes(query);
        return matchName || matchEmail || matchTrainerId || matchMemberId || matchRole;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Toggle user status
  const handleToggleStatus = async (user) => {
    if (user._id === currentUser?.id || user.email === currentUser?.email) {
      toast.error("You cannot deactivate your own active session account.");
      return;
    }

    const newStatus = !user.isActive;
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, isActive: newStatus } : u))
    );

    try {
      await toggleUserStatus(user._id);
      toast.success(
        `${user.name}'s account has been ${newStatus ? "activated" : "deactivated"}.`
      );
    } catch (err) {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !newStatus } : u))
      );
      toast.error(err?.message || "Failed to toggle status.");
    }
  };

  // Confirm delete user
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUserAccount(deleteTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      toast.success(`Account for ${deleteTarget.name} has been removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.message || "Failed to delete user account.");
    }
  };

  const columns = useMemo(() => [
    {
      header: "User / Identity",
      accessorKey: "name",
      cell: (user) => {
        const isCurrent = user._id === currentUser?.id || user.email === currentUser?.email;
        const initials = (user.name || "U")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0 shadow-xs">
              {initials}
            </div>
            <div>
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <span>{user.name}</span>
                {isCurrent && (
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-blue-500">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Mail size={12} className="opacity-70" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: "System Role",
      accessorKey: "role",
      cell: (user) => {
        const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.member;
        const RoleIcon = roleCfg.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${roleCfg.badgeBg}`}
          >
            <RoleIcon size={12} />
            <span>{roleCfg.label}</span>
          </span>
        );
      },
    },
    {
      header: "Linked Profile",
      cell: (user) => {
        const trainerId = user.trainerId || (user.role === "trainer" ? user.linkedEntityId : null);
        const memberId = user.memberId || (user.role === "member" ? user.linkedEntityId : null);

        if (user.role === "trainer" && trainerId) {
          return (
            <Link
              to={`/admin/trainers-members/trainers/${trainerId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors"
            >
              <span>Coach #{trainerId}</span>
              <ExternalLink size={12} />
            </Link>
          );
        }

        if (user.role === "member" && memberId) {
          return (
            <Link
              to={`/admin/trainers-members/members/${memberId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-500/15 transition-colors"
            >
              <span>Athlete #{memberId}</span>
              <ExternalLink size={12} />
            </Link>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span>System Authority</span>
          </span>
        );
      },
    },
    {
      header: "Status",
      align: "center",
      cell: (user) => {
        const isCurrent = user._id === currentUser?.id || user.email === currentUser?.email;
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(user)}
            disabled={isCurrent}
            title={
              isCurrent
                ? "Cannot deactivate your own account"
                : user.isActive !== false
                ? "Click to Deactivate Account"
                : "Click to Activate Account"
            }
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              user.isActive !== false
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                : "bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25"
            } ${isCurrent ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                user.isActive !== false ? "bg-emerald-500 animate-pulse" : "bg-destructive"
              }`}
            />
            <span>{user.isActive !== false ? "Active" : "Deactivated"}</span>
          </button>
        );
      },
    },
    {
      header: "Created",
      cell: (user) => (
        <span className="text-xs text-muted-foreground">
          {user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Initial Provision"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (user) => {
        const isCurrent = user._id === currentUser?.id || user.email === currentUser?.email;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setResetPasswordTarget(user)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
              title="Reset User Password"
            >
              <KeyRound size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(user)}
              disabled={isCurrent}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors shadow-2xs ${
                isCurrent ? "opacity-40 cursor-not-allowed" : ""
              }`}
              title={isCurrent ? "Cannot delete self" : "Delete Account"}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
    },
  ], [currentUser]);

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* ── Top Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-display">
                Users & Access
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage login credentials, role assignments, profile bindings, and system access.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            title="Refresh list"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProvisionModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus size={16} />
            <span>Provision User Account</span>
          </button>
        </div>
      </div>

      {/* ── Summary Counters ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users size={18} className="text-foreground/70" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-display">
            {stats.total}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Registered logins</div>
        </div>

        {/* Admins */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Admins</span>
            <Shield size={18} />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-display">
            {stats.admins}
          </div>
          <div className="mt-1 text-xs text-purple-600/80 dark:text-purple-400/80">Full Authority</div>
        </div>

        {/* Trainers */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Coaches</span>
            <Dumbbell size={18} />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-display">
            {stats.trainers}
          </div>
          <div className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">Faculty Trainers</div>
        </div>

        {/* Members */}
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Athletes</span>
            <User size={18} />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-display">
            {stats.members}
          </div>
          <div className="mt-1 text-xs text-sky-600/80 dark:text-sky-400/80">Gym Members</div>
        </div>

        {/* Active Rate */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Rate</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-foreground font-display">
            {stats.activeRate}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{stats.active} of {stats.total} Active</div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, role, TRN-ID, or MEM-ID..."
            className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role pills */}
          <div className="inline-flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                roleFilter === "all"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Roles
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                roleFilter === "admin"
                  ? "bg-card text-purple-600 dark:text-purple-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admins
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("trainer")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                roleFilter === "trainer"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Coaches
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("member")}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                roleFilter === "member"
                  ? "bg-card text-sky-600 dark:text-sky-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Athletes
            </button>
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        pageSize={7}
        itemLabel="users"
        loading={isLoading}
        showToolbar={false}
        emptyIcon={UserX}
        emptyTitle="No accounts found"
        emptyDescription={
          searchQuery || roleFilter !== "all" || statusFilter !== "all"
            ? "No user accounts match the selected filters or search query."
            : "No user accounts exist in the system yet. Click 'Provision User Account' to add one."
        }
      />

      {/* ── Provision Account Modal ───────────────────────────────────────────── */}
      {isProvisionModalOpen && (
        <ProvisionUserModal
          isOpen={isProvisionModalOpen}
          onClose={() => setIsProvisionModalOpen(false)}
          onSuccess={() => {
            setIsProvisionModalOpen(false);
            loadData();
          }}
          trainers={trainersList}
          members={membersList}
          existingUsers={users}
        />
      )}

      {/* ── Reset Password Modal ──────────────────────────────────────────────── */}
      {resetPasswordTarget && (
        <AdminResetPasswordModal
          isOpen={Boolean(resetPasswordTarget)}
          user={resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          onSuccess={() => {
            setResetPasswordTarget(null);
            loadData();
          }}
        />
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────────────────────── */}
      {deleteTarget && (
        <FormModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          size="sm"
        >
          <FormModalHeader
            title="Delete User Account"
            subtitle="Permanent account revocation"
            onClose={() => setDeleteTarget(null)}
          />
          <FormModalBody>
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertTriangle size={24} className="shrink-0" />
                <div className="text-xs leading-relaxed">
                  Are you sure you want to delete the login account for{" "}
                  <strong className="font-semibold">{deleteTarget.name}</strong> ({deleteTarget.email})?
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This removes system login credentials. If this account is linked to a Trainer or Member profile, the underlying gym profile record remains intact.
              </p>
            </div>
          </FormModalBody>
          <FormModalFooter>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive px-5 py-2 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          </FormModalFooter>
        </FormModal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVISION USER ACCOUNT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ProvisionUserModal({
  isOpen,
  onClose,
  onSuccess,
  trainers = [],
  members = [],
  existingUsers = [],
}) {
  const [role, setRole] = useState("member");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Sets of already linked profile IDs
  const linkedTrainerIds = useMemo(
    () => new Set(existingUsers.filter((u) => u.trainerId).map((u) => u.trainerId)),
    [existingUsers]
  );
  const linkedMemberIds = useMemo(
    () => new Set(existingUsers.filter((u) => u.memberId).map((u) => u.memberId)),
    [existingUsers]
  );

  // Auto-populate when selecting a Trainer
  const handleTrainerSelect = (trnId) => {
    setSelectedTrainerId(trnId);
    const trn = trainers.find((t) => t.id === trnId);
    if (trn) {
      setName(trn.name || "");
      setEmail(trn.email || "");
    }
  };

  // Auto-populate when selecting a Member
  const handleMemberSelect = (memId) => {
    setSelectedMemberId(memId);
    const mem = members.find((m) => m.id === memId);
    if (mem) {
      const memFullName = `${mem.firstName || ""} ${mem.lastName || ""}`.trim();
      setName(memFullName || mem.name || "");
      setEmail(mem.email || "");
    }
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!name.trim()) errs.name = "Full name is required.";
    if (!email.trim()) errs.email = "Email address is required.";
    if (!password || password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (role === "trainer" && !selectedTrainerId) {
      errs.trainerId = "Please link a Trainer profile.";
    }
    if (role === "member" && !selectedMemberId) {
      errs.memberId = "Please link a Member profile.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        trainerId: role === "trainer" ? selectedTrainerId : null,
        memberId: role === "member" ? selectedMemberId : null,
      };

      await createUserAccount(payload);
      toast.success(`Account successfully provisioned for ${name}!`);
      onSuccess();
    } catch (err) {
      toast.error(err?.message || "Failed to provision user account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="lg">
      <FormModalHeader
        title="Provision Login Account"
        subtitle="Create system login credentials linked to facility records"
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <FormModalBody>
          <div className="space-y-5 py-2">
            {/* Step 1: Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                1. Select Account Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Member */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("member");
                    setName("");
                    setEmail("");
                    setSelectedTrainerId("");
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    role === "member"
                      ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <User size={20} />
                  <span className="text-xs font-bold">Gym Athlete</span>
                  <span className="text-[10px] opacity-75">Member Profile</span>
                </button>

                {/* Trainer */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("trainer");
                    setName("");
                    setEmail("");
                    setSelectedMemberId("");
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    role === "trainer"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Dumbbell size={20} />
                  <span className="text-xs font-bold">Faculty Coach</span>
                  <span className="text-[10px] opacity-75">Trainer Profile</span>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => {
                    setRole("admin");
                    setSelectedTrainerId("");
                    setSelectedMemberId("");
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    role === "admin"
                      ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Shield size={20} />
                  <span className="text-xs font-bold">Administrator</span>
                  <span className="text-[10px] opacity-75">Full Authority</span>
                </button>
              </div>
            </div>

            {/* Step 2: Profile Link (if Trainer or Member) */}
            {role === "trainer" && (
              <SelectField
                label="Link Existing Trainer Profile"
                required
                value={selectedTrainerId}
                onChange={(e) => handleTrainerSelect(e.target.value)}
                error={errors.trainerId}
                options={[
                  { value: "", label: "-- Choose Trainer to Provision --" },
                  ...trainers.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.id}) ${linkedTrainerIds.has(t.id) ? "— [Already has Login Account]" : ""}`,
                    disabled: linkedTrainerIds.has(t.id),
                  })),
                ]}
              />
            )}

            {role === "member" && (
              <SelectField
                label="Link Existing Member Profile"
                required
                value={selectedMemberId}
                onChange={(e) => handleMemberSelect(e.target.value)}
                error={errors.memberId}
                options={[
                  { value: "", label: "-- Choose Member to Provision --" },
                  ...members.map((m) => {
                    const memName = `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.name || m.id;
                    const isLinked = linkedMemberIds.has(m.id);
                    return {
                      value: m.id,
                      label: `${memName} (${m.id}) ${isLinked ? "— [Already has Login Account]" : ""}`,
                      disabled: isLinked,
                    };
                  }),
                ]}
              />
            )}

            {/* Step 3: Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                error={errors.name}
              />

              <InputField
                label="Login Email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                error={errors.email}
              />
            </div>

            {/* Password Field */}
            <InputField
              label="Initial Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              error={errors.password}
              endAdornment={
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer px-1 py-0.5"
                >
                  <Sparkles size={12} />
                  <span>Generate</span>
                </button>
              }
            />

            <div className="rounded-xl bg-muted/40 border border-border p-3 text-[11px] text-muted-foreground leading-relaxed">
              💡 <strong>Direct Record Linking:</strong> Account provisioning binds to existing Trainer or Member records without duplicating gym profiles or history.
            </div>
          </div>
        </FormModalBody>
        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText="Provision Account"
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN RESET PASSWORD MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AdminResetPasswordModal({ isOpen, user, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await adminResetPassword(user._id, newPassword);
      toast.success(`Password reset successfully for ${user.email}!`);
      onSuccess();
    } catch (err) {
      toast.error(err?.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="sm">
      <FormModalHeader
        title="Reset Account Password"
        subtitle={`Admin override for ${user.name}`}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <FormModalBody>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-muted/40 border border-border">
              <div className="text-xs font-bold text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary capitalize">
                Role: {user.role}
              </div>
            </div>

            <InputField
              label="New Password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter or generate new password"
              error={error}
              endAdornment={
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer px-1 py-0.5"
                >
                  <Sparkles size={12} />
                  <span>Generate</span>
                </button>
              }
            />

            <p className="text-[11px] text-muted-foreground">
              Setting a new password takes effect immediately and invalidates existing cached credentials.
            </p>
          </div>
        </FormModalBody>
        <FormModalFooter
          onCancel={onClose}
          cancelText="Cancel"
          submitText="Save New Password"
          isSubmitting={isSubmitting}
        />
      </form>
    </FormModal>
  );
}
