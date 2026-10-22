/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  X,
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
} from "lucide-react";
import { toast } from "sonner";
import {
  simulateCancellation,
  applyCancellation,
} from "@/lib/classCancellationService";
import { formatINR } from "@/lib/formatters";

const REASON_PRESETS = [
  "Emergency Facility Maintenance",
  "Severe Weather / Civic Advisory",
  "Trainer Medical Emergency",
  "Unforeseen Infrastructure Disruption",
  "Sanitization & Safety Protocol",
  "Civic / Public Holiday Order",
  "Other Valid Emergency",
];

export function ClassCancellationRescheduleModal({
  isOpen,
  onClose,
  batch,
  sessions = [],
  initialSessionId = "",
  onSuccess,
}) {
  const [cancellationType, setCancellationType] = useState("WEEKLY"); // 'WEEKLY' | 'DATE_RANGE' | 'SPECIFIC_CLASSES'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [reason, setReason] = useState("Emergency Facility Maintenance");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
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

  const effectiveReason =
    reason === "Other Valid Emergency"
      ? customReason.trim() || "Unforeseen Emergency"
      : reason;

  const handleSimulate = async () => {
    if (!effectiveReason) {
      toast.error("Please provide a valid cancellation reason.");
      return;
    }

    if (cancellationType === "WEEKLY" && !startDate) {
      toast.error("Please select a date within the target week.");
      return;
    }
    if (cancellationType === "DATE_RANGE" && (!startDate || !endDate)) {
      toast.error("Please select both start date and end date.");
      return;
    }
    if (
      cancellationType === "SPECIFIC_CLASSES" &&
      selectedSessionIds.length === 0
    ) {
      toast.error("Please select at least one class to cancel.");
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
        reason: effectiveReason,
        notes,
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
        reason: effectiveReason,
        notes,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] p-4 animate-in fade-in duration-200">
      <div className="flex flex-col h-[92vh] max-h-[850px] w-full max-w-4xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden text-foreground">
        {/* ─── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/15 text-destructive ring-1 ring-destructive/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-foreground">
                  Class Cancellation &amp; Rescheduling Engine
                </h3>
                <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary">
                  {batch.name || batch.shortName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sequential forward-shifting, zero session loss, and membership payment adjustments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/60 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Modal Body ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 space-y-6">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Choose Cancellation Workflow
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "WEEKLY",
                  label: "Weekly Cancellation",
                  desc: "Reschedules week to immediately following week; shifts future classes forward.",
                },
                {
                  id: "DATE_RANGE",
                  label: "Multiple-Day Period",
                  desc: "Cancels specific date span (e.g. 11th–20th) & reschedules to following period.",
                },
                {
                  id: "SPECIFIC_CLASSES",
                  label: "Specific Upcoming Classes",
                  desc: "Pick specific classes to push forward without disrupting curriculum sequence.",
                },
              ].map((mode) => {
                const isSelected = cancellationType === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setCancellationType(mode.id);
                      setSimulationResult(null);
                    }}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border bg-card/60 hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {mode.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1 leading-snug">
                      {mode.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range / Class Selection */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-4 text-xs">
            {cancellationType === "WEEKLY" && (
              <div className="space-y-1.5 max-w-sm">
                <label className="font-bold text-foreground">
                  Select Any Date in Target Week
                </label>
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-muted-foreground shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSimulationResult(null);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  System automatically identifies the Monday–Sunday week and all operating batch days within it.
                </p>
              </div>
            )}

            {cancellationType === "DATE_RANGE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Cancellation Period Start
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSimulationResult(null);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">
                    Cancellation Period End
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSimulationResult(null);
                    }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {cancellationType === "SPECIFIC_CLASSES" && (
              <div className="space-y-2">
                <label className="font-bold text-foreground flex items-center justify-between">
                  <span>Select Scheduled Classes to Cancel</span>
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {selectedSessionIds.length} Selected
                  </span>
                </label>

                {upcomingSessions.length === 0 ? (
                  <p className="text-muted-foreground italic py-2">
                    No upcoming scheduled sessions available to cancel in this batch.
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border/80 bg-background divide-y divide-border/40">
                    {upcomingSessions.map((s) => {
                      const isChecked = selectedSessionIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-muted/40 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setSimulationResult(null);
                              if (e.target.checked) {
                                setSelectedSessionIds((prev) => [...prev, s.id]);
                              } else {
                                setSelectedSessionIds((prev) =>
                                  prev.filter((id) => id !== s.id)
                                );
                              }
                            }}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span className="font-mono font-bold text-primary shrink-0">
                            Class #{s.classNumber}
                          </span>
                          <span className="font-medium text-foreground truncate">
                            {s.className || s.subject}
                          </span>
                          <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[11px]">
                            {s.displayDate || s.sessionDate} ({s.dayOfWeek})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Reason & Pricing Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Cancellation Reason (Mandatory)
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setSimulationResult(null);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {REASON_PRESETS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {reason === "Other Valid Emergency" && (
                  <input
                    type="text"
                    placeholder="Specify emergency reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">
                  Pricing Policy Base (Sessions / Month)
                </label>
                <input
                  type="number"
                  min="4"
                  max="30"
                  value={baseMonthlySessions}
                  onChange={(e) => {
                    setBaseMonthlySessions(e.target.value);
                    setSimulationResult(null);
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground">
                  Used for credit calculation: Per-class rate = Plan Price / (Duration * Base Sessions).
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-foreground">
                Administrative Notes &amp; Follow-up Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add audit documentation, facility status, or member communication notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Simulate Action Button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Preview proposed date forward-shifts, curriculum sequence, and affected member deductions.
            </p>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Simulate Rescheduling</span>
                </>
              )}
            </button>
          </div>

          {/* ─── Simulation Results View ──────────────────────────────────────── */}
          {simulationResult && (
            <div className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in duration-200">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-border/70 bg-card p-3">
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

                <div className="rounded-xl border border-border/70 bg-card p-3">
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

                <div className="rounded-xl border border-border/70 bg-card p-3">
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

                <div className="rounded-xl border border-border/70 bg-card p-3">
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
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("schedule")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activePreviewTab === "schedule"
                      ? "bg-primary text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Layers size={13} />
                  <span>Sequential Schedule Shift ({simulationResult.rescheduledMapping?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("members")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activePreviewTab === "members"
                      ? "bg-primary text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Users size={13} />
                  <span>Member Adjustments ({simulationResult.affectedMembers?.length || 0})</span>
                </button>
              </div>

              {/* Tab 1: Schedule Shift Matrix */}
              {activePreviewTab === "schedule" && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-card divide-y divide-border/40 text-xs">
                  {simulationResult.rescheduledMapping?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
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
                        <div className="rounded-lg bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground">
                          {item.originalDate} ({item.originalDay?.slice(0, 3)})
                        </div>
                        <ArrowRight size={13} className="text-primary shrink-0" />
                        <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.newDate} ({item.newDay?.slice(0, 3)})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Affected Members Table */}
              {activePreviewTab === "members" && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border/80 bg-card divide-y divide-border/40 text-xs">
                  {simulationResult.affectedMembers?.map((m) => (
                    <div
                      key={m.memberId}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30"
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
        </div>

        {/* ─── Modal Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!simulationResult || isApplying}
              className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Applying Reschedule...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Confirm &amp; Apply Rescheduling</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassCancellationRescheduleModal;
