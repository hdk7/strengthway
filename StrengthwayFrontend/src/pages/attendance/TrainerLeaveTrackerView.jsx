/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarOff,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
  Plus,
  Layers,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerLeaves,
  updateTrainerLeaveStatus,
  cancelTrainerLeave,
  getLeaveAffectedSessions,
} from "@/lib/trainerLeaveService";
import { Pagination } from "@/components/table";
import { MonthPicker, getCurrentYearMonth } from "@/components/ui/MonthPicker";
import { AffectedSessionsModal } from "./AffectedSessionsModal";
import { KpiCard, SearchInput } from "@/components/ui";

export function TrainerLeaveTrackerView({
  trainers = [],
  batches = [],
  onOpenLeaveDrawer,
  onLeavesUpdated,
  initialStatus,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get("status");

  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    if (initialStatus) return initialStatus.toUpperCase();
    if (urlStatus) return urlStatus.toUpperCase();
    return "ALL";
  });
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | REGULAR | EMERGENCY
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState("ALL");
  const [complianceFilter, setComplianceFilter] = useState("ALL"); // ALL | COMPLIANT | OVERRIDDEN
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentYearMonth());

  // Action Modals State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    leave: null,
    action: "", // "APPROVE" | "DENY" | "CANCEL"
    isAdjustingDates: false,
    approvedStartDate: "",
    approvedEndDate: "",
    note: "",
    isSubmitting: false,
  });

  // Affected Sessions Modal State (Opened upon leave approval)
  const [affectedSessionsModal, setAffectedSessionsModal] = useState({
    isOpen: false,
    leave: null,
    sessions: [],
  });

  const [detailModalLeave, setDetailModalLeave] = useState(null);

  // Load Leave Requests from Backend
  const loadLeaves = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTrainerLeaves({
        month: selectedMonth || undefined,
        trainerId: selectedTrainerFilter !== "ALL" ? selectedTrainerFilter : undefined,
      });
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load leave requests.");
      setLeaves([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedTrainerFilter]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Keep URL query sync if status changes
  const handleStatusFilterChange = (st) => {
    setStatusFilter(st);
    const p = new URLSearchParams(searchParams);
    if (st === "ALL") {
      p.delete("status");
    } else {
      p.set("status", st);
    }
    setSearchParams(p, { replace: true });
  };

  // Filtered Leaves List
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "DENIED") {
          if (leave.status !== "DENIED" && leave.status !== "REJECTED") return false;
        } else if (leave.status !== statusFilter) {
          return false;
        }
      }

      // 2. Type Filter
      if (typeFilter !== "ALL" && leave.leaveType !== typeFilter) {
        return false;
      }

      // 3. Trainer Filter
      if (selectedTrainerFilter !== "ALL" && leave.trainerId !== selectedTrainerFilter) {
        return false;
      }

      // 4. Compliance Filter
      if (complianceFilter === "COMPLIANT" && !leave.isNoticeCompliant) {
        return false;
      }
      if (complianceFilter === "OVERRIDDEN" && leave.isNoticeCompliant) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (leave.trainerName || "").toLowerCase().includes(q);
        const matchesId = (leave.trainerId || "").toLowerCase().includes(q);
        const matchesReqId = (leave.id || "").toLowerCase().includes(q);
        const matchesReason = (leave.reason || "").toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesReqId && !matchesReason) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, statusFilter, typeFilter, selectedTrainerFilter, complianceFilter, searchQuery]);

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === "PENDING").length;
    const approved = leaves.filter((l) => l.status === "APPROVED").length;
    const denied = leaves.filter((l) => l.status === "DENIED" || l.status === "REJECTED").length;
    const emergencyCount = leaves.filter((l) => l.leaveType === "EMERGENCY").length;
    const approvedDays = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, curr) => acc + (curr.totalApprovedDays || curr.totalDays || 0), 0);

    return { total, pending, approved, denied, emergencyCount, approvedDays };
  }, [leaves]);

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 7;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter, selectedTrainerFilter, complianceFilter, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedLeaves = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLeaves.slice(start, start + pageSize);
  }, [filteredLeaves, safePage, pageSize]);

  // Quick Action Handler (Open Action Modal)
  const handleOpenActionModal = (leave, action) => {
    setActionModal({
      isOpen: true,
      leave,
      action,
      isAdjustingDates: false,
      approvedStartDate: leave.requestedStartDate || leave.leaveStartDate,
      approvedEndDate: leave.requestedEndDate || leave.leaveEndDate,
      note: action === "APPROVE" ? "Approved per schedule policy review" : "",
      isSubmitting: false,
    });
  };

  const handleConfirmAction = async () => {
    const { leave, action, note, isAdjustingDates, approvedStartDate, approvedEndDate } = actionModal;
    if (!leave) return;

    if (action === "APPROVE" && isAdjustingDates) {
      const reqStart = leave.requestedStartDate || leave.leaveStartDate;
      const reqEnd = leave.requestedEndDate || leave.leaveEndDate;
      if (approvedStartDate < reqStart || approvedEndDate > reqEnd) {
        return toast.error(`Approved dates must be within requested window (${reqStart} to ${reqEnd}).`);
      }
      if (approvedEndDate < approvedStartDate) {
        return toast.error("Approved end date cannot be earlier than approved start date.");
      }
    }

    try {
      setActionModal((prev) => ({ ...prev, isSubmitting: true }));

      let nextStatus = "APPROVED";
      if (action === "DENY" || action === "REJECT") nextStatus = "DENIED";
      if (action === "CANCEL") nextStatus = "CANCELLED";

      const payload = {
        status: nextStatus,
        reviewNote: note.trim(),
      };

      if (action === "APPROVE" && isAdjustingDates) {
        payload.approvedStartDate = approvedStartDate;
        payload.approvedEndDate = approvedEndDate;
      }

      await updateTrainerLeaveStatus(leave.id, payload);

      toast.success(
        `Leave request [${leave.id}] has been ${
          nextStatus === "APPROVED"
            ? "approved and attendance updated"
            : nextStatus === "DENIED"
            ? "denied"
            : "cancelled"
        }.`
      );

      setActionModal({
        isOpen: false,
        leave: null,
        action: "",
        isAdjustingDates: false,
        approvedStartDate: "",
        approvedEndDate: "",
        note: "",
        isSubmitting: false,
      });

      await loadLeaves();
      if (onLeavesUpdated) onLeavesUpdated();

      // If approved, check for affected sessions and open AffectedSessionsModal
      if (nextStatus === "APPROVED") {
        try {
          const affRes = await getLeaveAffectedSessions(leave.id);
          const sessions = affRes?.sessions || affRes?.data || [];
          setAffectedSessionsModal({
            isOpen: true,
            leave: {
              ...leave,
              approvedStartDate: payload.approvedStartDate || leave.leaveStartDate,
              approvedEndDate: payload.approvedEndDate || leave.leaveEndDate,
            },
            sessions,
          });
        } catch (e) {
          console.warn("Could not fetch affected sessions:", e);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to update leave request status.");
      setActionModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-3">
      {/* ─── 1. KPI Cards Row ──────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <KpiCard
          title="Leave Applications"
          value={stats.total}
          subtext="requests"
          icon={FileText}
          colorScheme="default"
        />
        <KpiCard
          title="Pending Action"
          value={stats.pending}
          subtext="awaiting review"
          icon={Clock}
          colorScheme="amber"
          onClick={() => handleStatusFilterChange("PENDING")}
          className={
            statusFilter === "PENDING"
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
              : "cursor-pointer hover:border-amber-500/40"
          }
        />
        <KpiCard
          title="Approved Requests"
          value={stats.approved}
          subtext="confirmed"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <KpiCard
          title="Leave Days Consumed"
          value={stats.approvedDays}
          subtext="days total"
          icon={CalendarOff}
          colorScheme="sky"
        />
      </div>

      {/* ─── PENDING LEAVE REQUESTS BANNER (When Pending Filter Active or Pending > 0) ─── */}
      {statusFilter === "PENDING" && (
        <div className="shrink-0 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock size={16} className="shrink-0" />
            <span>
              <strong>Central Pending Review Mode:</strong> Reviewing {stats.pending} leave request{stats.pending === 1 ? "" : "s"} awaiting Admin approval. Approving leaves prompts you to inspect affected batch sessions.
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleStatusFilterChange("ALL")}
            className="text-[11px] font-bold text-foreground hover:underline shrink-0"
          >
            Show All Requests
          </button>
        </div>
      )}

      {/* ─── 2. Filter Toolbar ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-3 rounded-xl border border-border bg-card shadow-xs">
        {/* Search Input */}
        <div className="flex-1 max-w-sm">
          <SearchInput
            placeholder="Search by faculty, ID, request #, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Controls: Status, Type, Trainer, Month, New Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Pills */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            {["ALL", "PENDING", "APPROVED", "DENIED", "CANCELLED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusFilterChange(st)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "ALL"
                  ? "All"
                  : st === "PENDING"
                  ? "Pending"
                  : st === "APPROVED"
                  ? "Approved"
                  : st === "DENIED"
                  ? "Denied"
                  : "Cancelled"}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="REGULAR">Regular Leave</option>
            <option value="EMERGENCY">Emergency Leave</option>
          </select>

          {/* Trainer Filter Dropdown */}
          <select
            value={selectedTrainerFilter}
            onChange={(e) => setSelectedTrainerFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none"
          >
            <option value="ALL">All Faculty Coaches</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim()} ({t.id})
              </option>
            ))}
          </select>

          {/* Themed Month Picker */}
          <MonthPicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            compact
            align="right"
          />

          {/* Request Leave Button */}
          <button
            type="button"
            onClick={() => onOpenLeaveDrawer && onOpenLeaveDrawer(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-background px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>New Leave Application</span>
          </button>
        </div>
      </div>

      {/* ─── 3. Full Leave Requests Data Table ─────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center text-muted-foreground">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-accent border-r-transparent" />
            <p className="mt-2 text-xs font-semibold">Loading leave requests command centre…</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <CalendarOff size={36} className="text-muted-foreground/50 mb-2" />
            <h4 className="text-sm font-bold text-foreground">No Leave Requests Found</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              No leave records matched your filters for {selectedMonth}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs select-none">
                <tr className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Request ID</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Faculty Coach</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Leave Type</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Requested Window</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Approved Window</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Duration</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Policy Compliance</th>
                  <th className="py-3 px-4 sm:px-5 whitespace-nowrap">Reason</th>
                  <th className="py-3 px-4 sm:px-5 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 sm:px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {paginatedLeaves.map((leave) => {
                  const isEmergency = leave.leaveType === "EMERGENCY";
                  const isPending = leave.status === "PENDING";
                  const isApproved = leave.status === "APPROVED";
                  const isDenied = leave.status === "DENIED" || leave.status === "REJECTED";

                  return (
                    <tr
                      key={leave.id}
                      className="group transition-all duration-150 hover:-translate-y-px"
                    >
                      {/* 1. Request ID & Date */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="font-mono font-bold text-accent">
                            {leave.id}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            • Filed: {leave.submittedOn || "—"}
                          </span>
                        </div>
                      </td>

                      {/* 2. Faculty Coach */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <Link
                          to={`/admin/trainers-members/trainers/${leave.trainerId}?tab=leave`}
                          className="flex items-center gap-2 whitespace-nowrap hover:text-primary transition-colors"
                          title="Open Trainer Profile & Leave Management"
                        >
                          <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            <User size={12} />
                          </span>
                          <span className="font-bold text-foreground">
                            {leave.trainerName}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground font-normal">
                            #{leave.trainerId}
                          </span>
                        </Link>
                      </td>

                      {/* 3. Leave Type */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isEmergency ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            <Zap size={10} />
                            <span>Emergency</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                            <Calendar size={10} />
                            <span>Regular</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Requested Window */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1 font-bold text-foreground whitespace-nowrap">
                          <Calendar size={12} className="text-primary shrink-0" />
                          <span>{leave.requestedStartDate || leave.leaveStartDate}</span>
                          <span className="text-muted-foreground font-normal">→</span>
                          <span>{leave.requestedEndDate || leave.leaveEndDate}</span>
                        </div>
                      </td>

                      {/* 5. Approved Window */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isApproved && leave.approvedStartDate ? (
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle2 size={12} />
                            <span>
                              {leave.approvedStartDate} → {leave.approvedEndDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            {isPending ? "Pending review" : "—"}
                          </span>
                        )}
                      </td>

                      {/* 6. Duration */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-muted border border-border whitespace-nowrap">
                          {isApproved && leave.totalApprovedDays
                            ? `${leave.totalApprovedDays} Day(s) Approved`
                            : `${leave.totalRequestedDays || leave.totalDays || 1} Day(s)`}
                        </span>
                      </td>

                      {/* 7. Policy Notice Compliance */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isEmergency ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                            <Zap size={11} />
                            <span>Emergency Notice Bypass</span>
                          </span>
                        ) : leave.isNoticeCompliant ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span>Notice Met ({leave.actualNoticeDays}d &ge; {leave.requiredNoticeDays}d)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                            <AlertTriangle size={12} />
                            <span>Override ({leave.actualNoticeDays}d / {leave.requiredNoticeDays}d req)</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Reason */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors max-w-xs whitespace-nowrap">
                        <span className="truncate block text-muted-foreground" title={leave.reason}>
                          {leave.reason || "—"}
                        </span>
                      </td>

                      {/* 9. Status Pill */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            <ShieldCheck size={11} />
                            <span>Approved</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                            <Clock size={11} />
                            <span>Pending Review</span>
                          </span>
                        ) : isDenied ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                            <XCircle size={11} />
                            <span>Denied</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* 10. Actions */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(leave, "APPROVE")}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                title="Approve full duration or adjust approved period"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(leave, "DENY")}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                title="Deny leave request"
                              >
                                <X size={12} />
                                <span>Deny</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handleOpenActionModal(leave, "CANCEL")}
                              className="p-1 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-[11px]"
                              title="Revoke / Cancel approved leave"
                            >
                              Cancel Leave
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDetailModalLeave(leave)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="View full audit trail"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pinned Bottom Pagination */}
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredLeaves.length}
          pageSize={pageSize}
          itemName="leave requests"
          compact
          className="shrink-0 p-2.5 border-t border-border/70"
        />
      </div>

      {/* ─── MODAL: Approve / Deny / Cancel Confirmation ───────────────────── */}
      {actionModal.isOpen && actionModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div
            onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
            className="fixed inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                {actionModal.action === "APPROVE" ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span>Approve Faculty Leave Request</span>
                  </>
                ) : actionModal.action === "DENY" || actionModal.action === "REJECT" ? (
                  <>
                    <XCircle size={18} className="text-rose-500" />
                    <span>Deny Faculty Leave Request</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} className="text-amber-500" />
                    <span>Cancel / Revoke Approved Leave</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faculty Member:</span>
                <span className="font-bold text-foreground">
                  {actionModal.leave.trainerName} ({actionModal.leave.trainerId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classification:</span>
                <span className="font-bold text-primary">
                  {actionModal.leave.leaveType === "EMERGENCY" ? "Emergency Leave" : "Regular Leave"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Originally Requested:</span>
                <span className="font-bold text-foreground">
                  {actionModal.leave.requestedStartDate || actionModal.leave.leaveStartDate} →{" "}
                  {actionModal.leave.requestedEndDate || actionModal.leave.leaveEndDate} (
                  {actionModal.leave.totalRequestedDays || actionModal.leave.totalDays} days)
                </span>
              </div>
              {actionModal.leave.reason && (
                <div className="pt-1 border-t border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Reason Provided:</span>
                  <p className="font-medium text-foreground italic mt-0.5">
                    "{actionModal.leave.reason}"
                  </p>
                </div>
              )}
            </div>

            {/* Approval Options: Full Duration vs Shorter Period */}
            {actionModal.action === "APPROVE" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Approved Duration Window</label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={actionModal.isAdjustingDates}
                      onChange={(e) =>
                        setActionModal((prev) => ({
                          ...prev,
                          isAdjustingDates: e.target.checked,
                        }))
                      }
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Approve shorter period</span>
                  </label>
                </div>

                {actionModal.isAdjustingDates ? (
                  <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 space-y-2.5">
                    <p className="text-[11px] text-muted-foreground">
                      Specify approved subset of dates within requested window (
                      {actionModal.leave.requestedStartDate || actionModal.leave.leaveStartDate} to{" "}
                      {actionModal.leave.requestedEndDate || actionModal.leave.leaveEndDate}).
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                          Approved Start Date
                        </span>
                        <input
                          type="date"
                          min={actionModal.leave.requestedStartDate || actionModal.leave.leaveStartDate}
                          max={actionModal.leave.requestedEndDate || actionModal.leave.leaveEndDate}
                          value={actionModal.approvedStartDate}
                          onChange={(e) =>
                            setActionModal((prev) => ({
                              ...prev,
                              approvedStartDate: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                          Approved End Date
                        </span>
                        <input
                          type="date"
                          min={actionModal.approvedStartDate}
                          max={actionModal.leave.requestedEndDate || actionModal.leave.leaveEndDate}
                          value={actionModal.approvedEndDate}
                          onChange={(e) =>
                            setActionModal((prev) => ({
                              ...prev,
                              approvedEndDate: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400">
                    Approving <strong>full duration</strong> (
                    {actionModal.leave.requestedStartDate || actionModal.leave.leaveStartDate} to{" "}
                    {actionModal.leave.requestedEndDate || actionModal.leave.leaveEndDate}).
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground bg-muted/30 border border-border/60 p-2.5 rounded-xl">
                  Approving this leave marks the trainer unavailable in attendance logs and prompts you to check affected batch sessions for substitute coach coverage.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground block">
                Reviewer Remarks / Coverage Note (Optional)
              </label>
              <textarea
                rows={2}
                value={actionModal.note}
                onChange={(e) => setActionModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder={
                  actionModal.action === "APPROVE"
                    ? "e.g. Coverage confirmed with floor coaches..."
                    : "e.g. Denied due to upcoming scheduled fitness assessment..."
                }
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionModal.isSubmitting}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50 ${
                  actionModal.action === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                <span>
                  {actionModal.isSubmitting
                    ? "Processing..."
                    : actionModal.action === "APPROVE"
                    ? "Confirm Approval"
                    : "Confirm Denial"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Full Leave Request Audit Details ───────────────────────── */}
      {detailModalLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div
            onClick={() => setDetailModalLeave(null)}
            className="fixed inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <CalendarOff size={16} />
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Leave Request Dossier [{detailModalLeave.id}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalLeave(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 text-xs pr-1 no-scrollbar">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                    Faculty Name
                  </span>
                  <span className="font-bold text-foreground">{detailModalLeave.trainerName}</span>
                  <span className="text-[10px] text-muted-foreground block">
                    #{detailModalLeave.trainerId}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-background border border-border">
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">
                    Current Status
                  </span>
                  <span className="font-bold text-foreground">{detailModalLeave.status}</span>
                  <span className="text-[10px] text-muted-foreground block">
                    Classification: {detailModalLeave.leaveType || "REGULAR"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/50 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Window:</span>
                  <span className="font-bold text-foreground">
                    {detailModalLeave.requestedStartDate || detailModalLeave.leaveStartDate} to{" "}
                    {detailModalLeave.requestedEndDate || detailModalLeave.leaveEndDate} (
                    {detailModalLeave.totalRequestedDays || detailModalLeave.totalDays} Days)
                  </span>
                </div>
                {detailModalLeave.approvedStartDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved Window:</span>
                    <span className="font-bold text-emerald-500">
                      {detailModalLeave.approvedStartDate} to {detailModalLeave.approvedEndDate} (
                      {detailModalLeave.totalApprovedDays} Days)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filed On:</span>
                  <span className="font-medium text-foreground">{detailModalLeave.submittedOn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Notice Provided:</span>
                  <span className="font-bold text-foreground">
                    {detailModalLeave.actualNoticeDays} Days (Required: {detailModalLeave.requiredNoticeDays} Days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Policy Tier:</span>
                  <span className="font-bold text-foreground">
                    {detailModalLeave.tierLabel || "Standard notice rule"}
                  </span>
                </div>
              </div>

              {detailModalLeave.reason && (
                <div className="rounded-xl border border-border bg-background/50 p-3 text-xs space-y-1">
                  <span className="font-bold text-foreground block text-[10px] uppercase">
                    Reason for Leave
                  </span>
                  <p className="text-muted-foreground italic">"{detailModalLeave.reason}"</p>
                </div>
              )}

              {detailModalLeave.adminDecision?.remarks && (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 text-[11px] space-y-0.5">
                  <span className="text-muted-foreground block">
                    Reviewed by <span className="font-bold text-foreground">{detailModalLeave.adminDecision.decidedBy || "Admin"}</span>
                    {detailModalLeave.adminDecision.decidedAt
                      ? ` on ${new Date(detailModalLeave.adminDecision.decidedAt).toLocaleString("en-IN")}`
                      : ""}
                  </span>
                  <p className="text-foreground italic">"{detailModalLeave.adminDecision.remarks}"</p>
                </div>
              )}

              {/* Audit Logs list */}
              {Array.isArray(detailModalLeave.auditLogs) && detailModalLeave.auditLogs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                    Audit Trail Records
                  </span>
                  {detailModalLeave.auditLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl border border-border/70 bg-background text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "—"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{log.note || `Action performed by ${log.actorName || log.actorId}`}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setDetailModalLeave(null)}
                className="px-4 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Affected Batch Sessions During Leave ────────────────────── */}
      <AffectedSessionsModal
        isOpen={affectedSessionsModal.isOpen}
        onClose={() => setAffectedSessionsModal({ isOpen: false, leave: null, sessions: [] })}
        leave={affectedSessionsModal.leave}
        sessions={affectedSessionsModal.sessions}
        onSubstituteAssigned={async () => {
          if (affectedSessionsModal.leave?.id) {
            try {
              const res = await getLeaveAffectedSessions(affectedSessionsModal.leave.id);
              setAffectedSessionsModal((prev) => ({
                ...prev,
                sessions: res?.sessions || res?.data || [],
              }));
            } catch (e) {
              console.warn(e);
            }
          }
        }}
      />
    </div>
  );
}

export default TrainerLeaveTrackerView;
