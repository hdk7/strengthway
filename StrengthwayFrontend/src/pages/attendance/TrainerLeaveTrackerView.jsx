/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
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
  Filter,
  Plus,
  Layers,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerLeaves,
  updateTrainerLeaveStatus,
  cancelTrainerLeave,
} from "@/lib/trainerLeaveService";
import { Pagination } from "@/components/table";

export function TrainerLeaveTrackerView({
  trainers = [],
  batches = [],
  onOpenLeaveDrawer,
  onLeavesUpdated,
}) {
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED | CANCELLED
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState("ALL");
  const [complianceFilter, setComplianceFilter] = useState("ALL"); // ALL | COMPLIANT | OVERRIDDEN
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Action Modals State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    leave: null,
    action: "", // "APPROVE" | "REJECT" | "CANCEL"
    note: "",
    isSubmitting: false,
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

  // Filtered Leaves List
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && leave.status !== statusFilter) {
        return false;
      }

      // 2. Trainer Filter
      if (selectedTrainerFilter !== "ALL" && leave.trainerId !== selectedTrainerFilter) {
        return false;
      }

      // 3. Compliance Filter
      if (complianceFilter === "COMPLIANT" && !leave.isNoticeCompliant) {
        return false;
      }
      if (complianceFilter === "OVERRIDDEN" && leave.isNoticeCompliant) {
        return false;
      }

      // 4. Search Query
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
  }, [leaves, statusFilter, selectedTrainerFilter, complianceFilter, searchQuery]);

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === "PENDING").length;
    const approved = leaves.filter((l) => l.status === "APPROVED").length;
    const rejected = leaves.filter((l) => l.status === "REJECTED").length;
    const approvedDays = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, curr) => acc + (curr.totalDays || 0), 0);

    return { total, pending, approved, rejected, approvedDays };
  }, [leaves]);

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 8;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, selectedTrainerFilter, complianceFilter, selectedMonth]);

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
      note: action === "APPROVE" ? "Approved per schedule policy review" : "",
      isSubmitting: false,
    });
  };

  const handleConfirmAction = async () => {
    const { leave, action, note } = actionModal;
    if (!leave) return;

    try {
      setActionModal((prev) => ({ ...prev, isSubmitting: true }));

      let nextStatus = "APPROVED";
      if (action === "REJECT") nextStatus = "REJECTED";
      if (action === "CANCEL") nextStatus = "CANCELLED";

      await updateTrainerLeaveStatus(leave.id, {
        status: nextStatus,
        reviewNote: note.trim(),
      });

      toast.success(
        `Leave request [${leave.id}] has been ${
          nextStatus === "APPROVED"
            ? "approved and attendance seeded"
            : nextStatus === "REJECTED"
            ? "rejected"
            : "cancelled"
        }.`
      );

      setActionModal({ isOpen: false, leave: null, action: "", note: "", isSubmitting: false });
      await loadLeaves();
      if (onLeavesUpdated) onLeavesUpdated();
    } catch (err) {
      toast.error(err.message || "Failed to update leave request status.");
      setActionModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-3">
      {/* ─── 1. KPI Cards Row ──────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Requests */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Leave Applications</span>
            <FileText size={15} className="text-primary" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">{stats.total}</span>
            <span className="text-[10px] text-muted-foreground">requests</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Action</span>
            <Clock size={15} className="text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-500">{stats.pending}</span>
            <span className="text-[10px] text-muted-foreground">awaiting review</span>
          </div>
        </div>

        {/* Approved Requests */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved Requests</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-500">{stats.approved}</span>
            <span className="text-[10px] text-muted-foreground">confirmed</span>
          </div>
        </div>

        {/* Approved Leave Days */}
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Leave Days Consumed</span>
            <CalendarOff size={15} className="text-blue-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-blue-400">{stats.approvedDays}</span>
            <span className="text-[10px] text-muted-foreground">days total</span>
          </div>
        </div>
      </div>

      {/* ─── 2. Filter Toolbar ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-3 rounded-xl border border-border bg-card shadow-xs">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by faculty, ID, request #, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-8.5 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Controls: Status, Trainer, Month, New Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Pills */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            {["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
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
                  : st === "REJECTED"
                  ? "Rejected"
                  : "Cancelled"}
              </button>
            ))}
          </div>

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

          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
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
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border select-none">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Faculty Coach</th>
                  <th className="py-2.5 px-3">Leave Period</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Advance Notice Compliance</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {paginatedLeaves.map((leave) => {
                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* 1. Request ID & Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-accent block">
                          {leave.id}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Filed: {leave.submittedOn || "—"}
                        </span>
                      </td>

                      {/* 2. Faculty Coach */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            <User size={12} />
                          </span>
                          <div>
                            <span className="font-bold text-foreground block">
                              {leave.trainerName}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {leave.trainerId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Leave Period */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-bold text-foreground">
                          <Calendar size={12} className="text-primary shrink-0" />
                          <span>{leave.leaveStartDate}</span>
                          <span className="text-muted-foreground font-normal">→</span>
                          <span>{leave.leaveEndDate}</span>
                        </div>
                      </td>

                      {/* 4. Duration */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-muted border border-border">
                          {leave.totalDays} Day{leave.totalDays > 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* 5. Policy Notice Compliance */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          {leave.isNoticeCompliant ? (
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
                          <span className="text-[10px] text-muted-foreground truncate max-w-xs block">
                            {leave.tierLabel || "Standard notice rule"}
                          </span>
                        </div>
                      </td>

                      {/* 6. Reason */}
                      <td className="py-2.5 px-3 max-w-50">
                        <span className="truncate block text-muted-foreground" title={leave.reason}>
                          {leave.reason || "—"}
                        </span>
                      </td>

                      {/* 7. Status Pill */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {leave.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            <ShieldCheck size={11} />
                            <span>Approved</span>
                          </span>
                        ) : leave.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
                            <Clock size={11} />
                            <span>Pending Review</span>
                          </span>
                        ) : leave.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                            <XCircle size={11} />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {leave.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(leave, "APPROVE")}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                title="Approve leave request and seed attendance"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenActionModal(leave, "REJECT")}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                title="Reject leave request"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {leave.status === "APPROVED" && (
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

      {/* ─── MODAL: Approve / Reject / Cancel Confirmation ─────────────────── */}
      {actionModal.isOpen && actionModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div
            onClick={() => setActionModal({ isOpen: false, leave: null, action: "", note: "", isSubmitting: false })}
            className="fixed inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/70">
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground flex items-center gap-2">
                {actionModal.action === "APPROVE" ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span>Approve Faculty Leave</span>
                  </>
                ) : actionModal.action === "REJECT" ? (
                  <>
                    <XCircle size={18} className="text-rose-500" />
                    <span>Reject Faculty Leave</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} className="text-amber-500" />
                    <span>Cancel / Revoke Leave</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, leave: null, action: "", note: "", isSubmitting: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-background/50 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Faculty Member:</span>
                <span className="font-bold text-slate-900 dark:text-foreground">
                  {actionModal.leave.trainerName} ({actionModal.leave.trainerId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Leave Window:</span>
                <span className="font-bold text-slate-900 dark:text-foreground">
                  {actionModal.leave.leaveStartDate} → {actionModal.leave.leaveEndDate} (
                  {actionModal.leave.totalDays} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Policy Rule:</span>
                <span className="font-medium text-slate-900 dark:text-foreground">
                  {actionModal.leave.tierLabel || "Duration notice tier"}
                </span>
              </div>
            </div>

            {actionModal.action === "APPROVE" && (
              <p className="text-[11px] text-slate-600 dark:text-muted-foreground bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                Approving this leave will automatically update the faculty attendance roster with{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">LEAVE</span> status for all affected dates.
              </p>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-800 dark:text-muted-foreground block">
                Reviewer Remarks / Coverage Note (Optional)
              </label>
              <textarea
                rows={2}
                value={actionModal.note}
                onChange={(e) => setActionModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="e.g. Coverage confirmed with Coach Robert..."
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-border/70">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, leave: null, action: "", note: "", isSubmitting: false })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-semibold text-slate-700 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionModal.isSubmitting}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer ${
                  actionModal.action === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : actionModal.action === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                <span>{actionModal.isSubmitting ? "Processing..." : `Confirm ${actionModal.action}`}</span>
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
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/70">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
                  <CalendarOff size={16} />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                  Leave Request Details [{detailModalLeave.id}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalLeave(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-background border border-slate-200 dark:border-border">
                <span className="text-slate-500 dark:text-muted-foreground text-[10px] uppercase font-bold block">
                  Faculty Name
                </span>
                <span className="font-bold text-slate-900 dark:text-foreground">{detailModalLeave.trainerName}</span>
                <span className="text-[10px] text-slate-500 dark:text-muted-foreground block">
                  {detailModalLeave.trainerId}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-background border border-slate-200 dark:border-border">
                <span className="text-slate-500 dark:text-muted-foreground text-[10px] uppercase font-bold block">
                  Current Status
                </span>
                <span className="font-bold text-slate-900 dark:text-foreground">{detailModalLeave.status}</span>
                <span className="text-[10px] text-slate-500 dark:text-muted-foreground block">
                  Filed on: {detailModalLeave.submittedOn}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-border bg-slate-50/40 dark:bg-background p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Leave Window:</span>
                <span className="font-bold text-slate-900 dark:text-foreground">
                  {detailModalLeave.leaveStartDate} to {detailModalLeave.leaveEndDate} (
                  {detailModalLeave.totalDays} Days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Notice Provided:</span>
                <span className="font-bold text-slate-900 dark:text-foreground">
                  {detailModalLeave.actualNoticeDays} Days (Required: {detailModalLeave.requiredNoticeDays} Days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Policy Tier:</span>
                <span className="font-bold text-slate-900 dark:text-foreground">
                  {detailModalLeave.tierLabel || "Standard notice rule"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-muted-foreground">Policy Compliance:</span>
                <span
                  className={`font-bold ${
                    detailModalLeave.isNoticeCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {detailModalLeave.isNoticeCompliant ? "Fully Compliant" : "Override Authorized"}
                </span>
              </div>
            </div>

            {detailModalLeave.overrideReason && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
                <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Override Justification:</span>
                <p className="text-slate-600 dark:text-muted-foreground">{detailModalLeave.overrideReason}</p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 dark:border-border bg-slate-50/40 dark:bg-background p-3 text-xs space-y-1">
              <span className="font-bold text-slate-500 dark:text-muted-foreground block text-[10px] uppercase">
                Reason for Leave
              </span>
              <p className="text-slate-800 dark:text-foreground">{detailModalLeave.reason || "No description provided."}</p>
            </div>

            {detailModalLeave.reviewedBy && (
              <div className="rounded-lg border border-slate-200 dark:border-border/70 bg-slate-50/60 dark:bg-muted/30 p-2.5 text-[11px] space-y-0.5">
                <span className="text-slate-500 dark:text-muted-foreground block">
                  Reviewed by <span className="font-bold text-slate-900 dark:text-foreground">{detailModalLeave.reviewedBy}</span>
                  {detailModalLeave.reviewedAt
                    ? ` on ${new Date(detailModalLeave.reviewedAt).toLocaleDateString()}`
                    : ""}
                </span>
                {detailModalLeave.reviewNote && (
                  <p className="text-slate-800 dark:text-foreground italic">"{detailModalLeave.reviewNote}"</p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-border/70">
              <button
                type="button"
                onClick={() => setDetailModalLeave(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card text-xs font-semibold text-slate-700 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainerLeaveTrackerView;
