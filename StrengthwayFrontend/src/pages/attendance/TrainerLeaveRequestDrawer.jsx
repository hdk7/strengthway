/* eslint-disable max-lines */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  CalendarOff,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  History,
  Send,
  Trash2,
  Sparkles,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { validateTrainerLeaveNotice } from "@/lib/masterScheduleService";
import {
  createTrainerLeave,
  getTrainerLeaves,
  cancelTrainerLeave,
} from "@/lib/trainerLeaveService";

export function TrainerLeaveRequestDrawer({
  isOpen,
  onClose,
  trainer,
  trainers = [],
  batches = [],
  onLeaveSubmitted,
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [selectedTrainerId, setSelectedTrainerId] = useState(trainer?.id || "");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leave history for selected trainer
  const [trainerLeaves, setTrainerLeaves] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Sync selected trainer whenever prop changes
  useEffect(() => {
    if (trainer?.id) {
      setSelectedTrainerId(trainer.id);
    } else if (trainers.length > 0 && !selectedTrainerId) {
      setSelectedTrainerId(trainers[0].id);
    }
  }, [trainer, trainers, selectedTrainerId]);

  const activeTrainer = useMemo(() => {
    return (
      trainers.find((t) => t.id === selectedTrainerId) ||
      trainer || { id: selectedTrainerId, name: selectedTrainerId }
    );
  }, [trainers, trainer, selectedTrainerId]);

  // Trainer's assigned batches
  const trainerBatches = useMemo(() => {
    if (!activeTrainer?.id) return [];
    return (batches || []).filter((b) =>
      Array.isArray(activeTrainer.batchIds) && activeTrainer.batchIds.includes(b.id)
    );
  }, [batches, activeTrainer]);

  // Load Trainer's Leave History
  const loadLeaveHistory = useCallback(async () => {
    if (!selectedTrainerId) return;
    try {
      setIsLoadingHistory(true);
      const data = await getTrainerLeaves({ trainerId: selectedTrainerId });
      setTrainerLeaves(Array.isArray(data) ? data : []);
    } catch {
      setTrainerLeaves([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedTrainerId]);

  useEffect(() => {
    if (isOpen) {
      setLeaveStartDate("");
      setLeaveEndDate("");
      setReason("");
      setAllowOverride(false);
      setOverrideReason("");
      setValidationResult(null);
      if (selectedTrainerId) {
        loadLeaveHistory();
      }
    }
  }, [isOpen, selectedTrainerId, loadLeaveHistory]);

  // Live Policy Validation
  const runValidation = useCallback(async () => {
    if (!leaveStartDate || !leaveEndDate) return;
    try {
      setIsValidating(true);
      const res = await validateTrainerLeaveNotice({
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        submittedOn: todayStr,
      });
      setValidationResult(res);
    } catch (err) {
      setValidationResult({
        isValid: false,
        message: err.message || "Failed to validate leave notice against policy.",
      });
    } finally {
      setIsValidating(false);
    }
  }, [leaveStartDate, leaveEndDate, todayStr]);

  useEffect(() => {
    if (isOpen && leaveStartDate && leaveEndDate) {
      runValidation();
    }
  }, [isOpen, leaveStartDate, leaveEndDate, runValidation]);

  // Handle Submit Leave Request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTrainerId) {
      toast.error("Please select a trainer.");
      return;
    }
    if (!leaveStartDate || !leaveEndDate) {
      toast.error("Please select leave dates.");
      return;
    }
    if (leaveEndDate < leaveStartDate) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }

    if (validationResult && !validationResult.isValid && !allowOverride) {
      toast.error("Leave request does not meet advance-notice policy requirements.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        trainerId: selectedTrainerId,
        trainerName: activeTrainer?.name || activeTrainer?.firstName || selectedTrainerId,
        leaveStartDate,
        leaveEndDate,
        submittedOn: todayStr,
        reason: reason.trim(),
        allowPolicyOverride: allowOverride,
        overrideReason: allowOverride ? overrideReason.trim() : "",
      };

      const result = await createTrainerLeave(payload);
      toast.success(
        `Leave request [${result.id}] submitted successfully for ${payload.trainerName}.`
      );

      // Reset form fields
      setReason("");
      setAllowOverride(false);
      setOverrideReason("");

      await loadLeaveHistory();
      if (onLeaveSubmitted) {
        onLeaveSubmitted(result);
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Leave inline
  const handleCancelLeave = async (leaveId) => {
    if (window.confirm(`Withdraw leave request [${leaveId}]?`)) {
      try {
        await cancelTrainerLeave(leaveId);
        toast.success(`Leave request [${leaveId}] cancelled.`);
        await loadLeaveHistory();
        if (onLeaveSubmitted) onLeaveSubmitted();
      } catch (err) {
        toast.error(err.message || "Failed to cancel leave request.");
      }
    }
  };

  if (!isOpen) return null;

  const isFormBlocked =
    validationResult && !validationResult.isValid && !allowOverride;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent"
      />

      {/* Centered Modal Card */}
      <div className="relative z-10 w-full max-w-lg sm:max-w-xl max-h-[85vh] bg-white dark:bg-card rounded-2xl border border-slate-200/90 dark:border-border shadow-2xl flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-border/80 flex items-center justify-between shrink-0 bg-white dark:bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20">
              <CalendarOff size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground">
                Faculty Leave Request
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Enforces notice-period policy rules and schedule coverage.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {/* Trainer Selection & Schedule Preview */}
            <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <User size={13} className="text-accent" />
                  <span>Faculty Member</span>
                </label>
                <span className="text-[10px] font-mono font-bold text-accent px-1.5 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                  {selectedTrainerId}
                </span>
              </div>

              {trainers.length > 1 ? (
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-card px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim()} ({t.id})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-foreground">
                  {activeTrainer?.name || activeTrainer?.firstName || selectedTrainerId}
                </div>
              )}

              {/* Assigned Batches Pills */}
              {trainerBatches.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                    Assigned Active Batches:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {trainerBatches.map((b) => (
                      <span
                        key={b.id}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground"
                      >
                        <Layers size={10} className="text-primary" />
                        <span>{b.shortName || b.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Leave Date Range Picker */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar size={13} className="text-primary" />
                    <span>Leave Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => {
                      setLeaveStartDate(e.target.value);
                      if (leaveEndDate < e.target.value) {
                        setLeaveEndDate(e.target.value);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 mb-1">
                    <Calendar size={13} className="text-primary" />
                    <span>Leave End Date</span>
                  </label>
                  <input
                    type="date"
                    value={leaveEndDate}
                    min={leaveStartDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background px-3 py-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Live Policy Validation Card */}
            {validationResult && (
              <div
                className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                  validationResult.isValid
                    ? "border-emerald-500/35 bg-emerald-500/5 text-emerald-500"
                    : "border-rose-500/35 bg-rose-500/5 text-rose-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {validationResult.isValid ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-500" />
                    )}
                    <span>
                      {validationResult.isValid
                        ? "Policy Compliant: Advance Notice Met"
                        : "Policy Violation: Insufficient Notice"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border/80 text-foreground">
                    {validationResult.totalDays} Day{validationResult.totalDays > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-border/50 text-foreground">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Notice Provided:</span>
                    <span className="font-extrabold">{validationResult.actualNoticeDays} Days</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Notice Required:</span>
                    <span className="font-extrabold">{validationResult.requiredNoticeDays} Days</span>
                  </div>
                </div>

                {validationResult.tier && (
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Applied Rule:</span>{" "}
                    {validationResult.tier.label}
                  </div>
                )}

                {!validationResult.isValid && validationResult.earliestEligibleStartDate && (
                  <div className="rounded-lg bg-rose-500/10 p-2 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                    Earliest permitted start date:{" "}
                    <span className="underline font-bold">
                      {validationResult.earliestEligibleStartDate}
                    </span>
                  </div>
                )}

                <p className="text-[10px] opacity-90 leading-relaxed">
                  {validationResult.message}
                </p>
              </div>
            )}

            {/* Emergency Policy Override Option */}
            {validationResult && !validationResult.isValid && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOverride}
                    onChange={(e) => setAllowOverride(e.target.checked)}
                    className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-amber-400 block">
                      Authorize Emergency Policy Override
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Bypass advance-notice requirement for emergency/medical cases. Logs an audit record.
                    </span>
                  </div>
                </label>

                {allowOverride && (
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide emergency reason for admin override..."
                    className="w-full rounded-lg border border-amber-500/40 bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                )}
              </div>
            )}

            {/* Reason Textarea */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <FileText size={13} className="text-accent" />
                <span>Reason / Notes for Absence</span>
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for leave, coverage handover, or special remarks..."
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Trainer Recent Leave History Section */}
            <div className="pt-2 border-t border-border/70 space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <History size={13} className="text-primary" />
                  <span>Recent Leave Requests ({trainerLeaves.length})</span>
                </span>
                {isLoadingHistory && <span className="text-[10px] animate-pulse">Loading...</span>}
              </div>

              {trainerLeaves.length === 0 ? (
                <div className="p-3 rounded-xl border border-border/50 bg-background/40 text-center text-[11px] text-muted-foreground">
                  No prior leave records for this faculty member.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                  {trainerLeaves.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>
                            {item.leaveStartDate} → {item.leaveEndDate}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({item.totalDays}d)
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-xs">
                          {item.reason || "No description"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === "APPROVED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Approved
                          </span>
                        ) : item.status === "PENDING" ? (
                          <>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Pending
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCancelLeave(item.id)}
                              className="p-1 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                              title="Cancel leave request"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        ) : item.status === "REJECTED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-border/80 bg-white dark:bg-muted/20 flex items-center justify-between gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-border text-xs font-semibold text-slate-700 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isFormBlocked}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isFormBlocked
                  ? "bg-slate-200 dark:bg-muted text-slate-400 dark:text-muted-foreground cursor-not-allowed opacity-60"
                  : "bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 text-white active:scale-95"
              }`}
            >
              <Send size={13} />
              <span>{isSubmitting ? "Submitting..." : "Submit Leave Request"}</span>
            </button>
          </div>
        </div>
      </div>
  );
}

export default TrainerLeaveRequestDrawer;
