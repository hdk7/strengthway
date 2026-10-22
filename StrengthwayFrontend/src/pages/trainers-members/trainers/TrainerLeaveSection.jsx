/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Sparkles,
  Zap,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  X,
  Plus,
  Send,
  UserCheck,
  ExternalLink,
  Layers,
  FileText,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerLeaves,
  createTrainerLeave,
  updateTrainerLeaveStatus,
  cancelTrainerLeave,
  getLeaveAffectedSessions,
  getTrainerLeaveAnnualSummary,
} from "@/lib/trainerLeaveService";
import { PolicyRuleSimulator } from "@/pages/attendance/PolicyRuleSimulator";
import { AffectedSessionsModal } from "@/pages/attendance/AffectedSessionsModal";
import { Pagination } from "@/components/table";
import { formatINR } from "@/lib/formatters";

/**
 * Reusable Trainer Leave Management & Policy Rule Simulator Section
 *
 * Integrated into TrainerProfilePage for both:
 * 1. Trainer Login: "My Leave" application portal with live Policy Rule Simulator and request history.
 * 2. Admin Login: Trainer-specific Leave Governance, embedded Policy Rule Simulator, and Approval/Denial actions.
 *
 * @param {Object} props
 * @param {Object} props.trainer - Trainer entity
 * @param {boolean} [props.isAdmin=false] - True if viewed in Admin context
 * @param {Function} [props.onLeavesUpdated] - Optional callback
 */
export function TrainerLeaveSection({ trainer, isAdmin = false, onLeavesUpdated }) {
  const navigate = useNavigate();
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | APPROVED | DENIED | CANCELLED
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | REGULAR | EMERGENCY

  // "Apply for Leave" Form State (For Trainer or Admin on behalf of trainer)
  const [isApplying, setIsApplying] = useState(false);
  const [leaveType, setLeaveType] = useState("REGULAR");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Approval Modal State (Supports approving full duration or shorter adjusted period)
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    leave: null,
    isAdjustingDates: false,
    approvedStartDate: "",
    approvedEndDate: "",
    remarks: "",
    isSubmitting: false,
  });

  // Admin Denial Modal State
  const [denialModal, setDenialModal] = useState({
    isOpen: false,
    leave: null,
    remarks: "",
    isSubmitting: false,
  });

  // Affected Batch Sessions Modal State (Opens after leave approval)
  const [affectedSessionsModal, setAffectedSessionsModal] = useState({
    isOpen: false,
    leave: null,
    sessions: [],
  });

  // Full Details & Audit Trail Modal
  const [detailModalLeave, setDetailModalLeave] = useState(null);

  // Annual Allowance & Balance State
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [annualBalance, setAnnualBalance] = useState({
    annualAllowance: 36,
    totalDaysUsed: 0,
    remainingDays: 36,
    lopDays: 0,
    lopDeductionAmount: 0,
    informedDays: 0,
    uninformedDays: 0,
    deductionPerDay: 1000,
  });

  // Load Leave Records & Annual Balance
  const loadLeaves = useCallback(async () => {
    if (!trainer?.id) return;
    try {
      setIsLoading(true);
      const [data, balanceData] = await Promise.all([
        getTrainerLeaves({ trainerId: trainer.id }),
        getTrainerLeaveAnnualSummary({ trainerId: trainer.id, year: selectedYear }).catch(() => null),
      ]);
      setLeaves(Array.isArray(data) ? data : []);
      if (balanceData) {
        setAnnualBalance(balanceData);
      }
    } catch (err) {
      console.error("Failed to load trainer leaves:", err);
      toast.error(err.message || "Failed to load leave history.");
      setLeaves([]);
    } finally {
      setIsLoading(false);
    }
  }, [trainer?.id, selectedYear]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Real-time calculation of LOP for the proposed leave window
  const requestLopDetails = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    const d1 = new Date(startDate + "T00:00:00Z");
    const d2 = new Date(endDate + "T00:00:00Z");
    const reqDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

    const remaining = annualBalance.remainingDays ?? 36;
    const paidDays = Math.min(reqDays, remaining);
    const lopDays = Math.max(0, reqDays - remaining);
    const deductionRate = annualBalance.deductionPerDay ?? 1000;
    const lopDeduction = lopDays * deductionRate;

    return {
      reqDays,
      paidDays,
      lopDays,
      lopDeduction,
      projectedRemaining: Math.max(0, remaining - reqDays),
      projectedTotalUsed: (annualBalance.totalDaysUsed || 0) + reqDays,
      projectedLopDays: (annualBalance.lopDays || 0) + lopDays,
    };
  }, [startDate, endDate, annualBalance]);

  // Quick Preset Handlers for Dates
  const handleSetPreset = (preset) => {
    const now = new Date();
    if (preset === "TODAY") {
      const s = now.toISOString().slice(0, 10);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === "TOMORROW") {
      now.setDate(now.getDate() + 1);
      const s = now.toISOString().slice(0, 10);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === "NEXT_3_DAYS") {
      const s = now.toISOString().slice(0, 10);
      now.setDate(now.getDate() + 2);
      const e = now.toISOString().slice(0, 10);
      setStartDate(s);
      setEndDate(e);
    } else if (preset === "NEXT_WEEK") {
      now.setDate(now.getDate() + 8);
      const s = now.toISOString().slice(0, 10);
      now.setDate(now.getDate() + 2);
      const e = now.toISOString().slice(0, 10);
      setStartDate(s);
      setEndDate(e);
    }
  };

  // Switch type and set sensible default dates
  const handleTypeSelect = (type) => {
    setLeaveType(type);
    if (type === "EMERGENCY") {
      handleSetPreset("TODAY");
    } else {
      handleSetPreset("NEXT_WEEK");
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      return toast.error("Please specify both start date and end date.");
    }
    if (endDate < startDate) {
      return toast.error("End date cannot be earlier than start date.");
    }

    if (leaveType === "EMERGENCY" && !reason.trim()) {
      return toast.error("A valid emergency reason is mandatory for emergency leave applications.");
    }

    try {
      setIsSubmitting(true);
      await createTrainerLeave({
        trainerId: trainer.id,
        trainerName: trainer.name,
        leaveType,
        leaveStartDate: startDate,
        leaveEndDate: endDate,
        submittedOn: todayStr,
        reason: reason.trim(),
        allowPolicyOverride: Boolean(simResult && !simResult.isNoticeCompliant),
        overrideReason:
          simResult && !simResult.isNoticeCompliant
            ? `Notice override (${simResult.actualNoticeDays}d vs ${simResult.requiredNoticeDays}d req)`
            : undefined,
      });

      toast.success(
        leaveType === "EMERGENCY"
          ? "Emergency leave submitted for Admin review."
          : "Regular leave request submitted successfully."
      );

      // Reset form
      setReason("");
      setIsApplying(false);
      await loadLeaves();
      if (onLeavesUpdated) onLeavesUpdated();
    } catch (err) {
      toast.error(err.message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Leave Request (by Trainer or Admin)
  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave application?")) return;
    try {
      await cancelTrainerLeave(leaveId);
      toast.success("Leave request cancelled successfully.");
      await loadLeaves();
      if (onLeavesUpdated) onLeavesUpdated();
    } catch (err) {
      toast.error(err.message || "Failed to cancel leave request.");
    }
  };

  // Open Approval Modal
  const handleOpenApproveModal = (leave) => {
    setApprovalModal({
      isOpen: true,
      leave,
      isAdjustingDates: false,
      approvedStartDate: leave.requestedStartDate || leave.leaveStartDate,
      approvedEndDate: leave.requestedEndDate || leave.leaveEndDate,
      remarks: "Approved per roster schedule review",
      isSubmitting: false,
    });
  };

  // Confirm Approval
  const handleConfirmApproval = async () => {
    const { leave, isAdjustingDates, approvedStartDate, approvedEndDate, remarks } = approvalModal;
    if (!leave) return;

    if (isAdjustingDates) {
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
      setApprovalModal((prev) => ({ ...prev, isSubmitting: true }));

      const payload = {
        status: "APPROVED",
        reviewNote: remarks.trim(),
      };

      if (isAdjustingDates) {
        payload.approvedStartDate = approvedStartDate;
        payload.approvedEndDate = approvedEndDate;
      }

      await updateTrainerLeaveStatus(leave.id, payload);

      toast.success(`Leave request #${leave.id} approved. Attendance updated.`);

      setApprovalModal({
        isOpen: false,
        leave: null,
        isAdjustingDates: false,
        approvedStartDate: "",
        approvedEndDate: "",
        remarks: "",
        isSubmitting: false,
      });

      // Refresh leave records
      await loadLeaves();
      if (onLeavesUpdated) onLeavesUpdated();

      // Check for affected batch sessions and open modal
      try {
        const affectedRes = await getLeaveAffectedSessions(leave.id);
        const sessions = affectedRes?.sessions || affectedRes?.data || [];
        setAffectedSessionsModal({
          isOpen: true,
          leave: {
            ...leave,
            approvedStartDate: payload.approvedStartDate || leave.leaveStartDate,
            approvedEndDate: payload.approvedEndDate || leave.leaveEndDate,
          },
          sessions,
        });
      } catch (err) {
        console.warn("Could not fetch affected sessions:", err);
      }
    } catch (err) {
      toast.error(err.message || "Failed to approve leave request.");
      setApprovalModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Open Denial Modal
  const handleOpenDenialModal = (leave) => {
    setDenialModal({
      isOpen: true,
      leave,
      remarks: "",
      isSubmitting: false,
    });
  };

  // Confirm Denial
  const handleConfirmDenial = async () => {
    const { leave, remarks } = denialModal;
    if (!leave) return;

    try {
      setDenialModal((prev) => ({ ...prev, isSubmitting: true }));
      await updateTrainerLeaveStatus(leave.id, {
        status: "DENIED",
        reviewNote: remarks.trim() || "Request denied by Admin review.",
      });

      toast.success(`Leave request #${leave.id} denied.`);
      setDenialModal({ isOpen: false, leave: null, remarks: "", isSubmitting: false });
      await loadLeaves();
      if (onLeavesUpdated) onLeavesUpdated();
    } catch (err) {
      toast.error(err.message || "Failed to deny leave request.");
      setDenialModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filter Leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "DENIED") {
          if (leave.status !== "DENIED" && leave.status !== "REJECTED") return false;
        } else if (leave.status !== statusFilter) {
          return false;
        }
      }
      if (typeFilter !== "ALL" && leave.leaveType !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [leaves, statusFilter, typeFilter]);

  // Statistics Calculation
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

  // Pagination for leaves table
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedLeaves = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLeaves.slice(start, start + pageSize);
  }, [filteredLeaves, safePage, pageSize]);

  return (
    <div className="space-y-6">
      {/* ─── Top Header Card ─────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <CalendarOff size={20} />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-foreground font-display tracking-tight">
                {isAdmin ? `Leave Management & Policy Simulator` : `My Leave & Policy Simulator`}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isAdmin
                ? `Oversee faculty leave requests, test notice rules, and manage session coverage for ${trainer.name}.`
                : `Apply for Regular or Emergency leave, view live advance-notice rules, and monitor approval status.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold shadow-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-card text-foreground">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin ? (
              <Link
                to="/admin/attendance/trainers?viewMode=leaveTracker&status=PENDING"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Layers size={14} className="text-amber-500" />
                <span>Central Pending Leaves (All Coaches)</span>
              </Link>
            ) : null}

            {!isApplying && (
              <button
                type="button"
                onClick={() => setIsApplying(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-background px-4 py-2.5 text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Plus size={14} />
                <span>Apply for Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Annual Allowance & LOP KPI Stats Row ─────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="rounded-2xl border border-border/70 bg-background/50 p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              Annual Allowance
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-foreground">
                {annualBalance.annualAllowance || 36}
              </span>
              <span className="text-[10px] text-muted-foreground">days paid/yr</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Paid leave without LOP</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/50 p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-foreground tracking-wider block flex items-center gap-1">
              <CalendarOff size={12} className="text-primary" />
              Total Days Taken
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-foreground">
                {annualBalance.totalDaysUsed || 0}
              </span>
              <span className="text-[10px] text-muted-foreground">days in {selectedYear}</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {annualBalance.informedDays || 0} approved, {annualBalance.uninformedDays || 0} unexcused
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/50 p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider block flex items-center gap-1">
              <Sparkles size={12} />
              Remaining Days
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-500">
                {annualBalance.remainingDays ?? 36}
              </span>
              <span className="text-[10px] text-muted-foreground">paid days left</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Before Loss of Pay applies</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/50 p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block flex items-center gap-1">
              <AlertCircle size={12} />
              Loss of Pay (LOP)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-500">
                {annualBalance.lopDays || 0}
              </span>
              <span className="text-[10px] text-muted-foreground">days LOP</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {(annualBalance.lopDays || 0) > 0
                ? `-${formatINR(annualBalance.lopDeductionAmount || 0)} payroll deduction`
                : "No LOP deductions incurred"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE LEAVE APPLICATION PANEL (When isApplying is True) ─── */}
      {isApplying && (
        <div className="rounded-3xl border border-primary/40 bg-card p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
                  Apply for Leave — {trainer.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  The live Policy Rule Simulator validates notice rules and consecutive duration limits in real time.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsApplying(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitLeave} className="space-y-6">
            {/* 1. Leave Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Select Leave Classification
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeSelect("REGULAR")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    leaveType === "REGULAR"
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      Regular Leave
                    </span>
                    {leaveType === "REGULAR" && <CheckCircle2 size={16} className="text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Standard advance-notice leave governed by Attendance Policy Master tiers.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect("EMERGENCY")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    leaveType === "EMERGENCY"
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                      : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Zap size={14} />
                      Emergency Leave
                    </span>
                    {leaveType === "EMERGENCY" && <CheckCircle2 size={16} className="text-amber-500" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    For sudden situations (today / next day). Bypasses advance notice; requires reason &amp; Admin approval.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Embedded Policy Rule Simulator */}
            <div className="rounded-2xl border border-border/80 bg-background/60 p-4">
              <PolicyRuleSimulator
                defaultLeaveType={leaveType}
                defaultStartDate={startDate}
                defaultEndDate={endDate}
                allowTypeToggle={false}
                compact={true}
                onValidationChange={setSimResult}
                onDateChange={({ startDate: s, endDate: e }) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
                title={`Live Policy Rule Compliance (${leaveType === "EMERGENCY" ? "Emergency Leave" : "Regular Leave"})`}
              />
            </div>

            {/* Real-time Annual Allowance & LOP Impact */}
            {requestLopDetails && (
              <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Annual Allowance &amp; LOP Calculation</span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Allowance: {annualBalance.annualAllowance || 36}d • Used: {annualBalance.totalDaysUsed || 0}d • Remaining: {annualBalance.remainingDays ?? 36}d
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border text-xs ${
                    requestLopDetails.lopDays > 0
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {requestLopDetails.lopDays > 0 ? (
                      <AlertCircle size={14} className="text-rose-500 shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    )}
                    <span>
                      {requestLopDetails.lopDays > 0
                        ? requestLopDetails.paidDays > 0
                          ? `Partial LOP Applied: ${requestLopDetails.paidDays} Day(s) Paid, ${requestLopDetails.lopDays} Day(s) Loss of Pay`
                          : `100% Loss of Pay (LOP): All ${requestLopDetails.reqDays} Day(s) treated as LOP`
                        : `100% Paid Leave: All ${requestLopDetails.reqDays} Day(s) covered without Loss of Pay`}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                    {requestLopDetails.lopDays > 0
                      ? `You currently have ${annualBalance.remainingDays ?? 0} day(s) remaining in your 36-day annual allowance. ${requestLopDetails.lopDays} excess day(s) will incur Loss of Pay (-${formatINR(requestLopDetails.lopDeduction)}) in monthly payroll.`
                      : `You currently have ${annualBalance.remainingDays ?? 36} day(s) remaining in your 36-day annual allowance. This request consumes ${requestLopDetails.reqDays} day(s) and leaves ${requestLopDetails.projectedRemaining} day(s) remaining.`}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Reason Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Reason for Leave {leaveType === "EMERGENCY" ? <span className="text-destructive">* (Mandatory for Emergency Leave)</span> : <span className="text-muted-foreground">(Optional)</span>}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  leaveType === "EMERGENCY"
                    ? "Explain the unforeseen emergency (e.g., sudden illness, family emergency)..."
                    : "e.g., Personal family commitment, scheduled travel, rest & recovery..."
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setIsApplying(false)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-background text-xs font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-r-transparent" />
                    <span>Submitting Application…</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Leave Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── STANDALONE POLICY RULE SIMULATOR CARD (For Admin Testing or Trainer Reference) ─── */}
      {!isApplying && (
        <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
                Attendance Policy Rule Simulator
              </h3>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              Single Source of Truth: Attendance Policy Master
            </span>
          </div>

          <div className="mt-5">
            <PolicyRuleSimulator
              defaultLeaveType="REGULAR"
              allowTypeToggle={true}
              compact={false}
              title="Test Leave Scenarios & Notice Requirements"
            />
          </div>
        </div>
      )}

      {/* ─── LEAVE APPLICATIONS HISTORY TABLE ───────────────────────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
              {isAdmin ? `${trainer.name}'s Leave Applications` : "My Leave History & Status"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review filed requests, advance-notice compliance results, and approved leave windows.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 text-xs">
              {["ALL", "PENDING", "APPROVED", "DENIED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-primary text-background shadow-xs"
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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR">Regular Leave</option>
              <option value="EMERGENCY">Emergency Leave</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            <p className="mt-2 text-xs">Loading leave records…</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-border/70 bg-background/40">
            <CalendarOff size={36} className="mx-auto text-muted-foreground/40 mb-2" />
            <h4 className="text-sm font-bold text-foreground">No Leave Applications Found</h4>
            <p className="text-xs text-muted-foreground mt-1">
              No leave records match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-separate [border-spacing:0_8px]">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-4 whitespace-nowrap">Request #</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Leave Type</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Requested Window</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Approved Window</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Duration</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Policy Compliance</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Allowance / LOP</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {paginatedLeaves.map((leave) => {
                  const isEmergency = leave.leaveType === "EMERGENCY";
                  const isPending = leave.status === "PENDING";
                  const isApproved = leave.status === "APPROVED";
                  const isDenied = leave.status === "DENIED" || leave.status === "REJECTED";
                  const isCancelled = leave.status === "CANCELLED";

                  return (
                    <tr
                      key={leave.id}
                      className="group transition-all duration-150 hover:-translate-y-px"
                    >
                      {/* 1. Request ID */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 first:rounded-l-2xl first:border-l first:border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="font-mono font-bold text-primary">{leave.id}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {leave.submittedOn || "—"}
                        </div>
                      </td>

                      {/* 2. Leave Type */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isEmergency ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
                            <Zap size={11} />
                            <span>Emergency</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-500">
                            <Calendar size={11} />
                            <span>Regular</span>
                          </span>
                        )}
                      </td>

                      {/* 3. Requested Dates */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="font-bold text-foreground">
                          {leave.requestedStartDate || leave.leaveStartDate} →{" "}
                          {leave.requestedEndDate || leave.leaveEndDate}
                        </div>
                      </td>

                      {/* 4. Approved Dates (Separate from Requested) */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isApproved && leave.approvedStartDate ? (
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>
                              {leave.approvedStartDate} → {leave.approvedEndDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            {isPending ? "Pending review" : "—"}
                          </span>
                        )}
                      </td>

                      {/* 5. Duration */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-muted border border-border">
                          {isApproved && leave.totalApprovedDays
                            ? `${leave.totalApprovedDays} Day(s) Approved`
                            : `${leave.totalRequestedDays || leave.totalDays || 1} Day(s)`}
                        </span>
                      </td>

                      {/* 6. Policy Notice Compliance */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isEmergency ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                            <Zap size={11} />
                            <span>Emergency Notice Bypass</span>
                          </span>
                        ) : leave.isNoticeCompliant ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                            <CheckCircle2 size={11} />
                            <span>Compliant ({leave.actualNoticeDays}d &ge; {leave.requiredNoticeDays}d)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                            <AlertTriangle size={11} />
                            <span>Overridden ({leave.actualNoticeDays}d / {leave.requiredNoticeDays}d req)</span>
                          </span>
                        )}
                      </td>

                      {/* Allowance / LOP */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {leave.annualLeaveCalculation?.requestImpact?.lopDays > 0 ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-500">
                              <AlertCircle size={10} />
                              <span>{leave.annualLeaveCalculation.requestImpact.lopDays}d LOP</span>
                            </span>
                            <span className="text-[9px] font-semibold text-rose-500 mt-0.5">
                              -{formatINR(leave.annualLeaveCalculation.requestImpact.lopDeduction || 0)}
                            </span>
                          </div>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={10} />
                            <span>Paid (No LOP)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {leave.annualLeaveCalculation?.requestImpact?.paidDays !== undefined
                              ? `${leave.annualLeaveCalculation.requestImpact.paidDays}d within 36d`
                              : "36d Allowance"}
                          </span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                            <ShieldCheck size={11} />
                            <span>Approved</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 animate-pulse">
                            <Clock size={11} />
                            <span>Pending Review</span>
                          </span>
                        ) : isDenied ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                            <XCircle size={11} />
                            <span>Denied</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="bg-card py-3.5 px-4 align-middle border-y border-border/60 last:rounded-r-2xl last:border-r last:border-border/60 shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin Review Actions */}
                          {isAdmin && isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(leave)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                title="Approve full duration or adjust approved period"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDenialModal(leave)}
                                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                title="Deny request with remarks"
                              >
                                <X size={12} />
                                <span>Deny</span>
                              </button>
                            </>
                          )}

                          {/* Trainer Cancel Action for Pending */}
                          {!isAdmin && isPending && (
                            <button
                              type="button"
                              onClick={() => handleCancelLeave(leave.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-destructive px-2 py-1 text-xs font-semibold transition-colors cursor-pointer"
                              title="Cancel your leave application"
                            >
                              <RotateCcw size={11} />
                              <span>Cancel</span>
                            </button>
                          )}

                          {/* Full Audit View */}
                          <button
                            type="button"
                            onClick={() => setDetailModalLeave(leave)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="View audit details & decision remarks"
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

        {/* Pagination */}
        {filteredLeaves.length > pageSize && (
          <div className="pt-2 border-t border-border/60">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredLeaves.length}
              pageSize={pageSize}
              itemName="leave records"
              compact
            />
          </div>
        )}
      </div>

      {/* ─── MODAL: Admin Approval (Full Duration vs Shorter Period) ──────── */}
      {approvalModal.isOpen && approvalModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div
            onClick={() => setApprovalModal((prev) => ({ ...prev, isOpen: false }))}
            className="fixed inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span>Approve Leave Application</span>
              </h3>
              <button
                type="button"
                onClick={() => setApprovalModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Requested Summary Card */}
            <div className="rounded-2xl border border-border bg-background/60 p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faculty Member:</span>
                <span className="font-bold text-foreground">
                  {approvalModal.leave.trainerName} (#{approvalModal.leave.trainerId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leave Classification:</span>
                <span className="font-bold text-primary">
                  {approvalModal.leave.leaveType === "EMERGENCY" ? "Emergency Leave" : "Regular Leave"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Originally Requested:</span>
                <span className="font-bold text-foreground">
                  {approvalModal.leave.requestedStartDate || approvalModal.leave.leaveStartDate} →{" "}
                  {approvalModal.leave.requestedEndDate || approvalModal.leave.leaveEndDate} (
                  {approvalModal.leave.totalRequestedDays || approvalModal.leave.totalDays} days)
                </span>
              </div>
              {approvalModal.leave.reason && (
                <div className="pt-1 border-t border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Reason Provided:</span>
                  <p className="font-medium text-foreground italic text-xs mt-0.5">
                    "{approvalModal.leave.reason}"
                  </p>
                </div>
              )}
            </div>

            {/* Option to Approve Full Duration or Adjust Shorter Period */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">Approved Leave Duration</label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvalModal.isAdjustingDates}
                    onChange={(e) =>
                      setApprovalModal((prev) => ({
                        ...prev,
                        isAdjustingDates: e.target.checked,
                      }))
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span>Approve shorter period</span>
                </label>
              </div>

              {approvalModal.isAdjustingDates ? (
                <div className="p-3 rounded-2xl border border-primary/40 bg-primary/5 space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    Specify the approved subset of dates within the requested window (
                    {approvalModal.leave.requestedStartDate || approvalModal.leave.leaveStartDate} to{" "}
                    {approvalModal.leave.requestedEndDate || approvalModal.leave.leaveEndDate}).
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                        Approved Start Date
                      </span>
                      <input
                        type="date"
                        min={approvalModal.leave.requestedStartDate || approvalModal.leave.leaveStartDate}
                        max={approvalModal.leave.requestedEndDate || approvalModal.leave.leaveEndDate}
                        value={approvalModal.approvedStartDate}
                        onChange={(e) =>
                          setApprovalModal((prev) => ({
                            ...prev,
                            approvedStartDate: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                        Approved End Date
                      </span>
                      <input
                        type="date"
                        min={approvalModal.approvedStartDate}
                        max={approvalModal.leave.requestedEndDate || approvalModal.leave.leaveEndDate}
                        value={approvalModal.approvedEndDate}
                        onChange={(e) =>
                          setApprovalModal((prev) => ({
                            ...prev,
                            approvedEndDate: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400">
                  Approving <strong>full requested duration</strong> (
                  {approvalModal.leave.requestedStartDate || approvalModal.leave.leaveStartDate} to{" "}
                  {approvalModal.leave.requestedEndDate || approvalModal.leave.leaveEndDate}).
                </div>
              )}

              {/* LOP Breakdown for this Approval */}
              {(() => {
                const s = approvalModal.isAdjustingDates
                  ? approvalModal.approvedStartDate
                  : approvalModal.leave.requestedStartDate || approvalModal.leave.leaveStartDate;
                const e = approvalModal.isAdjustingDates
                  ? approvalModal.approvedEndDate
                  : approvalModal.leave.requestedEndDate || approvalModal.leave.leaveEndDate;
                if (!s || !e || e < s) return null;
                const d1 = new Date(s + "T00:00:00Z");
                const d2 = new Date(e + "T00:00:00Z");
                const appDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
                const rem = annualBalance.remainingDays ?? 36;
                const paid = Math.min(appDays, rem);
                const lop = Math.max(0, appDays - rem);
                const rate = annualBalance.deductionPerDay ?? 1000;

                return (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    lop > 0
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    <span className="font-bold flex items-center gap-1.5">
                      {lop > 0 ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                      <span>{appDays} Day(s) Approved: {paid}d Paid, {lop}d LOP</span>
                    </span>
                    <span className="font-mono font-bold text-[11px]">
                      {lop > 0 ? `-${formatINR(lop * rate)}` : "0 LOP"}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Remarks Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Admin Remarks / Coverage Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={approvalModal.remarks}
                onChange={(e) =>
                  setApprovalModal((prev) => ({ ...prev, remarks: e.target.value }))
                }
                placeholder="e.g. Approved. Floor coach covering morning batches..."
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setApprovalModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={approvalModal.isSubmitting}
                onClick={handleConfirmApproval}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {approvalModal.isSubmitting ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Admin Denial ────────────────────────────────────────────── */}
      {denialModal.isOpen && denialModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div
            onClick={() => setDenialModal((prev) => ({ ...prev, isOpen: false }))}
            className="fixed inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 className="text-base font-bold text-destructive flex items-center gap-2">
                <XCircle size={18} />
                <span>Deny Leave Application</span>
              </h3>
              <button
                type="button"
                onClick={() => setDenialModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Are you sure you want to deny leave request <strong>#{denialModal.leave.id}</strong> for{" "}
              {denialModal.leave.trainerName}? The trainer will be notified of your decision.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground block">
                Denial Remarks / Justification
              </label>
              <textarea
                rows={3}
                value={denialModal.remarks}
                onChange={(e) => setDenialModal((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="e.g. Critical tournament coaching requires full faculty presence..."
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setDenialModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={denialModal.isSubmitting}
                onClick={handleConfirmDenial}
                className="px-5 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {denialModal.isSubmitting ? "Denying…" : "Confirm Denial"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: View Leave Details & Audit Log ─────────────────────────── */}
      {detailModalLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
          <div
            onClick={() => setDetailModalLeave(null)}
            className="fixed inset-0 bg-transparent"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Leave Request Audit Dossier — #{detailModalLeave.id}
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
              <div className="rounded-2xl border border-border bg-background/60 p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coach:</span>
                  <span className="font-bold text-foreground">{detailModalLeave.trainerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Classification:</span>
                  <span className="font-bold text-primary">{detailModalLeave.leaveType || "REGULAR"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Window:</span>
                  <span className="font-bold text-foreground">
                    {detailModalLeave.requestedStartDate || detailModalLeave.leaveStartDate} →{" "}
                    {detailModalLeave.requestedEndDate || detailModalLeave.leaveEndDate} (
                    {detailModalLeave.totalRequestedDays || detailModalLeave.totalDays} days)
                  </span>
                </div>
                {detailModalLeave.approvedStartDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final Approved Window:</span>
                    <span className="font-bold text-emerald-500">
                      {detailModalLeave.approvedStartDate} → {detailModalLeave.approvedEndDate} (
                      {detailModalLeave.totalApprovedDays} days)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filed On:</span>
                  <span className="font-medium text-foreground">{detailModalLeave.submittedOn || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <span className="font-bold text-foreground">{detailModalLeave.status}</span>
                </div>
              </div>

              {detailModalLeave.reason && (
                <div className="rounded-2xl border border-border bg-muted/20 p-3 space-y-1">
                  <span className="font-bold text-foreground block">Applicant Reason:</span>
                  <p className="text-muted-foreground italic">"{detailModalLeave.reason}"</p>
                </div>
              )}

              {detailModalLeave.adminDecision?.remarks && (
                <div className="rounded-2xl border border-border bg-muted/20 p-3 space-y-1">
                  <span className="font-bold text-foreground block">Admin Decision Remarks:</span>
                  <p className="text-muted-foreground">"{detailModalLeave.adminDecision.remarks}"</p>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Decided by: {detailModalLeave.adminDecision.decidedBy || "Admin"} on{" "}
                    {detailModalLeave.adminDecision.decidedAt
                      ? new Date(detailModalLeave.adminDecision.decidedAt).toLocaleString("en-IN")
                      : "—"}
                  </span>
                </div>
              )}

              {/* Audit Logs list */}
              {Array.isArray(detailModalLeave.auditLogs) && detailModalLeave.auditLogs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                    Audit Trail Records
                  </span>
                  <div className="space-y-1.5">
                    {detailModalLeave.auditLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-border/70 bg-background text-[11px] space-y-0.5"
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
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/70 text-right">
              <button
                type="button"
                onClick={() => setDetailModalLeave(null)}
                className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted cursor-pointer"
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

export default TrainerLeaveSection;
