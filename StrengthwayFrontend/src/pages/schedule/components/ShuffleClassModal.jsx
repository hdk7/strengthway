import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  Shuffle,
  X,
  Check,
  Calendar,
  Layers,
  Loader2,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { shuffleBatchSchedule } from "@/lib/classProgramService";
import { getSessions } from "@/lib/masterScheduleService";

export function ShuffleClassModal({
  isOpen,
  onClose,
  batch,
  sessions: initialSessions = [],
  initialSourceSessionId = "",
  onSuccess,
  allowRandomizeRange = false,
}) {
  const [mode, setMode] = useState("SWAP"); // "SWAP" | "SHUFFLE_RANGE"
  const [sessions, setSessions] = useState(initialSessions);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // SWAP mode state
  const [sourceSessionId, setSourceSessionId] = useState(initialSourceSessionId || "");
  const [targetSessionId, setTargetSessionId] = useState("");
  const [swapReason, setSwapReason] = useState("");

  // SHUFFLE_RANGE mode state
  const [rangeStartDate, setRangeStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [shuffleReason, setShuffleReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync / fetch sessions when modal opens
  useEffect(() => {
    if (!isOpen || !batch) return;

    let isMounted = true;
    async function loadSessions() {
      try {
        setIsLoadingSessions(true);
        const allSessions = await getSessions();
        if (isMounted) {
          const batchSessions = (allSessions || []).filter(
            (s) => s.batchId === batch.id && s.status !== "COMPLETED" && s.status !== "CANCELLED"
          );
          setSessions(batchSessions);

          // If initialSourceSessionId provided, set it
          if (initialSourceSessionId && batchSessions.some((s) => s.id === initialSourceSessionId)) {
            setSourceSessionId(initialSourceSessionId);
            const other = batchSessions.find((s) => s.id !== initialSourceSessionId);
            if (other) setTargetSessionId(other.id);
          } else if (batchSessions.length >= 2) {
            setSourceSessionId(batchSessions[0].id);
            setTargetSessionId(batchSessions[1].id);
          }
        }
      } catch (err) {
        console.error("Failed to load sessions in ShuffleClassModal:", err);
      } finally {
        if (isMounted) setIsLoadingSessions(false);
      }
    }

    if (!initialSessions || initialSessions.length === 0) {
      loadSessions();
    } else {
      const activeSessions = initialSessions.filter(
        (s) => s.status !== "COMPLETED" && s.status !== "CANCELLED"
      );
      setSessions(activeSessions);
      if (initialSourceSessionId && activeSessions.some((s) => s.id === initialSourceSessionId)) {
        setSourceSessionId(initialSourceSessionId);
        const other = activeSessions.find((s) => s.id !== initialSourceSessionId);
        if (other) setTargetSessionId(other.id);
      } else if (activeSessions.length >= 2) {
        setSourceSessionId(activeSessions[0].id);
        setTargetSessionId(activeSessions[1].id);
      }
    }

    setSwapReason("Trainer curriculum adjustment");
    setShuffleReason("Upcoming training cycle rotation");

    return () => {
      isMounted = false;
    };
  }, [isOpen, batch, initialSessions, initialSourceSessionId]);

  const sourceSession = useMemo(() => {
    return sessions.find((s) => s.id === sourceSessionId) || null;
  }, [sessions, sourceSessionId]);

  const targetSession = useMemo(() => {
    return sessions.find((s) => s.id === targetSessionId) || null;
  }, [sessions, targetSessionId]);

  // Sessions in range for SHUFFLE_RANGE mode
  const rangeSessions = useMemo(() => {
    if (mode !== "SHUFFLE_RANGE") return [];
    return sessions.filter((s) => {
      if (rangeStartDate && s.sessionDate < rangeStartDate) return false;
      if (rangeEndDate && s.sessionDate > rangeEndDate) return false;
      return true;
    });
  }, [sessions, mode, rangeStartDate, rangeEndDate]);

  if (!isOpen || typeof document === "undefined" || !batch) return null;

  const handleSubmit = async () => {
    if (mode === "SWAP") {
      if (!sourceSessionId || !targetSessionId) {
        toast.error("Please select both sessions to swap.");
        return;
      }
      if (sourceSessionId === targetSessionId) {
        toast.error("Source and target sessions must be different dates.");
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await shuffleBatchSchedule(batch.id, {
          mode: "SWAP",
          sourceSessionId,
          targetSessionId,
          reason: swapReason || "Interchanged classes between dates",
        });

        toast.success(
          res?.data?.message ||
            `Successfully swapped ${sourceSession?.dayOfWeek} with ${targetSession?.dayOfWeek}!`
        );

        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        console.error("Swap failed:", err);
        toast.error(err.message || "Failed to swap classes.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // SHUFFLE_RANGE mode
      if (rangeSessions.length < 2) {
        toast.error("Need at least 2 scheduled classes in the selected date range to shuffle.");
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await shuffleBatchSchedule(batch.id, {
          mode: "SHUFFLE_RANGE",
          startDate: rangeStartDate,
          endDate: rangeEndDate,
          reason: shuffleReason || "Randomized class cycle order",
        });

        toast.success(
          res?.data?.message ||
            `Successfully shuffled ${rangeSessions.length} classes in batch ${batch.name}!`
        );

        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        console.error("Shuffle range failed:", err);
        toast.error(err.message || "Failed to shuffle classes.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-110 flex items-center justify-center p-3 sm:p-6 bg-slate-900/35 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-6 py-4 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-primary/10 text-indigo-700 dark:text-primary">
              <ArrowLeftRight size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground">
                {allowRandomizeRange
                  ? "Shuffle & Interchange Class Schedule"
                  : "Interchange Class Schedule"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Swap workout programs between scheduled dates and days for <strong>{batch.name}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mode Selector Tabs (only shown when allowRandomizeRange is true) */}
          {allowRandomizeRange && (
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-muted border border-slate-200/70 dark:border-border/70">
              <button
                type="button"
                onClick={() => setMode("SWAP")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "SWAP"
                    ? "bg-white dark:bg-card text-indigo-700 dark:text-primary shadow-xs"
                    : "text-slate-600 dark:text-muted-foreground hover:text-slate-900"
                }`}
              >
                <ArrowLeftRight size={14} />
                <span>Interchange Two Days (Swap)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("SHUFFLE_RANGE")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "SHUFFLE_RANGE"
                    ? "bg-white dark:bg-card text-indigo-700 dark:text-primary shadow-xs"
                    : "text-slate-600 dark:text-muted-foreground hover:text-slate-900"
                }`}
              >
                <Shuffle size={14} />
                <span>Randomize Cycle Range</span>
              </button>
            </div>
          )}

          {sessions.length < 2 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-border p-8 text-center text-xs text-slate-500 dark:text-muted-foreground space-y-2">
              <AlertCircle size={24} className="mx-auto text-amber-500" />
              <p className="font-bold text-slate-800 dark:text-foreground">
                Insufficient Scheduled Classes
              </p>
              <p>
                {allowRandomizeRange
                  ? "This batch needs at least 2 scheduled upcoming classes to perform a swap or shuffle. Schedule workout programs for this batch first."
                  : "This batch needs at least 2 scheduled upcoming classes to perform a swap. Schedule workout programs for this batch first."}
              </p>
            </div>
          ) : (mode === "SWAP" || !allowRandomizeRange) ? (
            /* ─── MODE: SWAP TWO DATES ─── */
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {/* Slot A: First Scheduled Session */}
                <div className="rounded-2xl border border-indigo-100 dark:border-border bg-indigo-50/30 dark:bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-primary flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black">
                        A
                      </span>
                      Slot A (Current Date)
                    </span>
                    {sourceSession && (
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-primary bg-indigo-100 dark:bg-primary/20 px-2 py-0.5 rounded-md">
                        {sourceSession.dayOfWeek}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-muted-foreground mb-1">
                      Select Scheduled Date & Class:
                    </label>
                    <select
                      value={sourceSessionId}
                      onChange={(e) => setSourceSessionId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sessionDate} ({s.dayOfWeek}) — {s.subject || s.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  {sourceSession && (
                    <div className="rounded-xl border border-slate-200/80 dark:border-border/60 bg-white dark:bg-card p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-foreground">
                          {sourceSession.subject || sourceSession.className}
                        </span>
                        {sourceSession.classId && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded">
                            {sourceSession.classId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-muted-foreground line-clamp-2">
                        {sourceSession.intermediateWorkouts !== "Not specified"
                          ? sourceSession.intermediateWorkouts
                          : sourceSession.beginnerWorkouts || sourceSession.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Central Swap Icon */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md z-10 pointer-events-none">
                  <ArrowLeftRight size={14} />
                </div>

                {/* Slot B: Second Scheduled Session */}
                <div className="rounded-2xl border border-blue-100 dark:border-border bg-blue-50/30 dark:bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-primary flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 dark:bg-primary text-white text-[10px] font-black">
                        B
                      </span>
                      Slot B (Target Date to Swap)
                    </span>
                    {targetSession && (
                      <span className="text-[11px] font-bold text-blue-700 dark:text-primary bg-blue-100 dark:bg-primary/20 px-2 py-0.5 rounded-md">
                        {targetSession.dayOfWeek}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-muted-foreground mb-1">
                      Select Scheduled Date & Class:
                    </label>
                    <select
                      value={targetSessionId}
                      onChange={(e) => setTargetSessionId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      {sessions
                        .filter((s) => s.id !== sourceSessionId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.sessionDate} ({s.dayOfWeek}) — {s.subject || s.className}
                          </option>
                        ))}
                    </select>
                  </div>

                  {targetSession && (
                    <div className="rounded-xl border border-slate-200/80 dark:border-border/60 bg-white dark:bg-card p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-foreground">
                          {targetSession.subject || targetSession.className}
                        </span>
                        {targetSession.classId && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded">
                            {targetSession.classId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-muted-foreground line-clamp-2">
                        {targetSession.intermediateWorkouts !== "Not specified"
                          ? targetSession.intermediateWorkouts
                          : targetSession.beginnerWorkouts || targetSession.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Swap Preview Result Banner */}
              {sourceSession && targetSession && (
                <div className="rounded-2xl border border-indigo-200/90 dark:border-border bg-indigo-50/60 dark:bg-muted/30 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-primary flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Resulting Schedule After Interchange</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="rounded-xl bg-white dark:bg-card p-3 border border-slate-200/80 dark:border-border space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {sourceSession.sessionDate} ({sourceSession.dayOfWeek}) will now run:
                      </span>
                      <span className="font-extrabold text-indigo-700 dark:text-primary text-sm block">
                        {targetSession.subject || targetSession.className}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-card p-3 border border-slate-200/80 dark:border-border space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {targetSession.sessionDate} ({targetSession.dayOfWeek}) will now run:
                      </span>
                      <span className="font-extrabold text-blue-700 dark:text-primary text-sm block">
                        {sourceSession.subject || sourceSession.className}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason input */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-foreground mb-1">
                  Reason for Schedule Interchange (Audit Log)
                </label>
                <input
                  type="text"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="e.g. Swapped Monday with Wednesday due to public holiday or trainer request"
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>
          ) : (
            /* ─── MODE: RANDOMIZE CYCLE RANGE ─── */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/20 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-primary flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Select Date Range to Shuffle</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-foreground mb-1">
                      Range Start Date
                    </label>
                    <input
                      type="date"
                      value={rangeStartDate}
                      onChange={(e) => setRangeStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-foreground mb-1">
                      Range End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={rangeEndDate}
                      onChange={(e) => setRangeEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 dark:text-muted-foreground flex items-center justify-between">
                  <span>
                    Classes in range to be randomized:{" "}
                    <strong className="text-indigo-700 dark:text-primary font-bold">
                      {rangeSessions.length} sessions
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-foreground mb-1">
                  Reason for Shuffle (Audit Log)
                </label>
                <input
                  type="text"
                  value={shuffleReason}
                  onChange={(e) => setShuffleReason(e.target.value)}
                  placeholder="e.g. Weekly workout curriculum randomization"
                  className="w-full rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-600 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-border p-4 px-6 bg-white dark:bg-card shrink-0 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-muted-foreground">
            Changes will be permanently logged in Schedule History.
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (mode === "SWAP" && (!sourceSessionId || !targetSessionId || sourceSessionId === targetSessionId)) ||
                (mode === "SHUFFLE_RANGE" && rangeSessions.length < 2)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 dark:bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-white dark:text-primary-foreground shadow-md hover:bg-indigo-800 dark:hover:bg-primary/90 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating Schedule…</span>
                </>
              ) : mode === "SWAP" ? (
                <>
                  <ArrowLeftRight size={16} />
                  <span>Confirm Swap Classes</span>
                </>
              ) : (
                <>
                  <Shuffle size={16} />
                  <span>Confirm Shuffle ({rangeSessions.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
