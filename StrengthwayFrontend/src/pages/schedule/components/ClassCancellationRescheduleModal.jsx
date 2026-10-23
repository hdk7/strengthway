/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  IndianRupee,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Info,
  Layers,
  FileText,
  ChevronRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
} from "@/components/ui/FormModal";
import { InputField, TextareaField } from "@/components/form";
import {
  simulateCancellation,
  applyCancellation,
} from "@/lib/classCancellationService";
import { formatINR } from "@/lib/formatters";

export function ClassCancellationRescheduleModal({
  isOpen,
  onClose,
  batch,
  sessions = [],
  initialSessionId = "",
  onSuccess,
}) {
  const [cancellationType, setCancellationType] = useState("DATE_RANGE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [reason, setReason] = useState("");
  const [baseMonthlySessions, setBaseMonthlySessions] = useState(12);

  const [activePreviewTab, setActivePreviewTab] = useState("schedule"); // 'schedule' | 'members'
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Initialize dates when opened
  useEffect(() => {
    if (isOpen) {
      setSimulationResult(null);
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 9); // default 10-day period
      setEndDate(nextWeek.toISOString().slice(0, 10));

      if (initialSessionId) {
        setSelectedSessionIds([initialSessionId]);
        const targetSession = sessions.find((s) => s.id === initialSessionId);
        if (targetSession?.sessionDate) {
          setStartDate(targetSession.sessionDate);
        }
      } else {
        setSelectedSessionIds([]);
      }
    }
  }, [isOpen, initialSessionId, sessions]);

  if (!isOpen || !batch) return null;

  const handleSimulate = async () => {
    if (!reason || !reason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start date and end date.");
      return;
    }

    if (startDate > endDate) {
      toast.error("Cancellation period start date cannot be after end date.");
      return;
    }

    const targetBatchId = batch?.id || batch?._id || batch?.batchId;
    if (!targetBatchId) {
      toast.error("Batch ID is missing.");
      return;
    }

    setIsSimulating(true);
    try {
      const res = await simulateCancellation(targetBatchId, {
        cancellationType,
        startDate,
        endDate,
        sessionIds: selectedSessionIds,
        reason: reason.trim(),
        notes: reason.trim(),
        pricingPolicy: {
          policyType: "PROPORTIONAL_PER_CLASS",
          baseMonthlySessions: Number(baseMonthlySessions) || 12,
        },
      });
      const data = res?.data || res;
      setSimulationResult(data);
      toast.success("Schedule forward-shift and member adjustments simulated successfully.");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to simulate cancellation."
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApply = async () => {
    if (!simulationResult) {
      toast.error("Please simulate the proposed rescheduling first.");
      return;
    }

    const targetBatchId = batch?.id || batch?._id || batch?.batchId;
    if (!targetBatchId) {
      toast.error("Batch ID is missing.");
      return;
    }

    setIsApplying(true);
    try {
      const res = await applyCancellation(targetBatchId, {
        cancellationType,
        startDate,
        endDate,
        sessionIds: selectedSessionIds,
        reason: reason.trim(),
        notes: reason.trim(),
        pricingPolicy: {
          policyType: "PROPORTIONAL_PER_CLASS",
          baseMonthlySessions: Number(baseMonthlySessions) || 12,
        },
      });
      const data = res?.data || res;

      toast.success(
        `Successfully cancelled ${data.summary?.totalCancelled || "classes"} and rescheduled schedule forward!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to apply cancellation and rescheduling."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const upcomingSessions = sessions.filter(
    (s) => s.status !== "COMPLETED" && s.status !== "CANCELLED" && (s.attendedCount || 0) === 0
  );

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="4xl">
      {/* ─── Modal Header Matching Reference Suite ────────────────────────── */}
      <FormModalHeader
        title="Class Cancellation & Rescheduling Engine"
        subtitle="Sequential forward-shifting, zero session loss, and membership payment adjustments"
        icon={AlertTriangle}
        badge={
          <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
            {batch.name || batch.shortName}
          </span>
        }
        onClose={onClose}
      />

      <div className="flex flex-col flex-1 min-h-0">
        {/* ─── Modal Body ──────────────────────────────────────────────── */}
        <FormModalBody className="p-6 sm:p-7 space-y-7">
          {/* 1. CANCELLATION SCHEDULE & REASON */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Calendar className="h-4 w-4 text-accent text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Cancellation Schedule &amp; Reason
              </h3>
            </div>

            {/* Date Span Pickers (Period Start & End) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                id="cancellation-period-start"
                name="startDate"
                type="date"
                label="Cancellation Period Start"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSimulationResult(null);
                }}
                startIcon={<Calendar size={15} className="text-muted-foreground" />}
              />
              <InputField
                id="cancellation-period-end"
                name="endDate"
                type="date"
                label="Cancellation Period End"
                required
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSimulationResult(null);
                }}
                startIcon={<Calendar size={15} className="text-muted-foreground" />}
              />
            </div>

            {/* Cancellation Reason Textbox */}
            <TextareaField
              id="cancellation-reason"
              name="reason"
              label="Cancellation Reason"
              required
              rows={3}
              placeholder="Enter cancellation reason or emergency notes..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSimulationResult(null);
              }}
            />
          </section>

          {/* 2. RESCHEDULING SIMULATION & IMPACT */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <RefreshCw className="h-4 w-4 text-accent text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Rescheduling Simulation &amp; Impact
              </h3>
            </div>

            {/* Simulate Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  Simulate Proposed Schedule Adjustments
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Preview date forward-shifts, zero-session loss guarantees, and affected member deductions before applying.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSimulating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Simulating…</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Simulate Rescheduling</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Results View */}
            {simulationResult && (
              <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 animate-in fade-in duration-200">
                {/* Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Cancelled Classes
                    </span>
                    <span className="text-lg font-black text-destructive block mt-0.5">
                      {simulationResult.summary?.totalCancelled || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Slots vacated
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Rescheduled &amp; Shifted
                    </span>
                    <span className="text-lg font-black text-primary block mt-0.5">
                      {(simulationResult.summary?.totalRescheduled || 0) +
                        (simulationResult.summary?.totalDisplaced || 0)}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      0 Sessions Lost
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Affected Athletes
                    </span>
                    <span className="text-lg font-black text-foreground block mt-0.5">
                      {simulationResult.summary?.totalMembersAffected || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Carried forward
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total Member Credits
                    </span>
                    <span className="text-lg font-black text-emerald-500 block mt-0.5 font-mono">
                      {formatINR(simulationResult.summary?.totalCredit || 0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Adjustment pool
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs: Schedule Shift vs Affected Members */}
                <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("schedule")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activePreviewTab === "schedule"
                        ? "bg-primary text-background shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Layers size={13} />
                    <span>Sequential Schedule Shift ({simulationResult.rescheduledMapping?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("members")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activePreviewTab === "members"
                        ? "bg-primary text-background shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Users size={13} />
                    <span>Member Adjustments ({simulationResult.affectedMembers?.length || 0})</span>
                  </button>
                </div>

                {/* Tab 1: Schedule Shift Matrix */}
                {activePreviewTab === "schedule" && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border/50 text-xs shadow-2xs">
                    {simulationResult.rescheduledMapping?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">
                            {item.classNumber}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-foreground">
                              {item.className}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {item.isDisplaced ? "Displaced upcoming class" : "Cancelled & rescheduled class"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                            {item.originalDate} ({item.originalDay?.slice(0, 3)})
                          </div>
                          <ArrowRight size={13} className="text-primary shrink-0" />
                          <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {item.newDate} ({item.newDay?.slice(0, 3)})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Affected Members Table */}
                {activePreviewTab === "members" && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border/50 text-xs shadow-2xs">
                    {simulationResult.affectedMembers?.map((m) => (
                      <div
                        key={m.memberId}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              {m.memberName}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              #{m.memberId}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block mt-0.5">
                            {m.membershipPlanName} • ₹{m.planPrice} ({m.durationMonths} Mo) • Rate: ₹{m.perClassRate}/class
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-500 text-sm block">
                              ₹{m.adjustmentCredit}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              +{m.cancelledClassesCount} Carry-Forward Sessions
                            </span>
                          </div>

                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              m.willRenew
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {m.willRenew ? "Auto-Deducts on Renewal" : "Retained Entitlement (No Refund)"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </FormModalBody>

        {/* ─── Standard Modal Footer Matching Reference Design ───────────── */}
        <div className="relative z-10 border-t border-slate-100 dark:border-border/60 bg-slate-50/60 dark:bg-muted/15 px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 dark:border-border bg-white dark:bg-card px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted transition-colors cursor-pointer shadow-xs min-h-10"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleApply}
              disabled={!simulationResult || isApplying}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer min-h-10"
            >
              {isApplying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Applying Reschedule…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Confirm &amp; Apply Rescheduling</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </FormModal>
  );
}

export default ClassCancellationRescheduleModal;
