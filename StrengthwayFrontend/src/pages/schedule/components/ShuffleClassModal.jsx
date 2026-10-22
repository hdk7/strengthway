import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeftRight,
  Shuffle,
  Calendar,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { shuffleBatchSchedule } from "@/lib/classProgramService";
import { getSessions } from "@/lib/masterScheduleService";
import {
  filterInterchangeEligibleSessions,
  getSessionInterchangeEligibility,
  getAppDateTime,
} from "@/lib/classInterchangeUtils";
import { InputField, SelectField } from "@/components/form";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
} from "@/components/ui/FormModal";

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
            (s) => s.batchId === batch.id
          );
          setSessions(batchSessions);
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
      setSessions(initialSessions);
    }

    setSwapReason("Coach curriculum adjustment");
    setShuffleReason("Upcoming training cycle rotation");

    return () => {
      isMounted = false;
    };
  }, [isOpen, batch, initialSessions]);

  // Filter only upcoming, uncompleted sessions eligible for interchange
  const eligibleSessions = useMemo(() => {
    return filterInterchangeEligibleSessions(sessions, batch);
  }, [sessions, batch]);

  // Synchronize source and target selections whenever eligibleSessions change
  useEffect(() => {
    if (!isOpen) return;

    if (eligibleSessions.length >= 2) {
      const isInitialSourceEligible =
        initialSourceSessionId &&
        eligibleSessions.some((s) => s.id === initialSourceSessionId);

      const isCurrentSourceEligible =
        sourceSessionId &&
        eligibleSessions.some((s) => s.id === sourceSessionId);

      let nextSourceId = sourceSessionId;
      if (isInitialSourceEligible && (!sourceSessionId || sourceSessionId === initialSourceSessionId)) {
        nextSourceId = initialSourceSessionId;
      } else if (!isCurrentSourceEligible) {
        nextSourceId = eligibleSessions[0]?.id || "";
      }

      setSourceSessionId(nextSourceId);

      const isCurrentTargetEligible =
        targetSessionId &&
        targetSessionId !== nextSourceId &&
        eligibleSessions.some((s) => s.id === targetSessionId);

      if (!isCurrentTargetEligible) {
        const nextOther = eligibleSessions.find((s) => s.id !== nextSourceId);
        setTargetSessionId(nextOther?.id || "");
      }
    } else if (eligibleSessions.length === 1) {
      setSourceSessionId(eligibleSessions[0].id);
      setTargetSessionId("");
    } else {
      setSourceSessionId("");
      setTargetSessionId("");
    }
  }, [isOpen, eligibleSessions, initialSourceSessionId]);

  const sourceSession = useMemo(() => {
    return eligibleSessions.find((s) => s.id === sourceSessionId) || null;
  }, [eligibleSessions, sourceSessionId]);

  const targetSession = useMemo(() => {
    return eligibleSessions.find((s) => s.id === targetSessionId) || null;
  }, [eligibleSessions, targetSessionId]);

  // Sessions in range for SHUFFLE_RANGE mode (only eligible upcoming sessions)
  const rangeSessions = useMemo(() => {
    if (mode !== "SHUFFLE_RANGE") return [];
    return eligibleSessions.filter((s) => {
      if (rangeStartDate && s.sessionDate < rangeStartDate) return false;
      if (rangeEndDate && s.sessionDate > rangeEndDate) return false;
      return true;
    });
  }, [eligibleSessions, mode, rangeStartDate, rangeEndDate]);

  if (!isOpen || !batch) return null;

  const handleSubmit = async () => {
    if (mode === "SWAP") {
      if (!sourceSessionId || !targetSessionId) {
        toast.error("Please select both sessions to swap.");
        return;
      }
      if (sourceSessionId === targetSessionId) {
        toast.error("Cannot swap a session with itself. Please pick different sessions.");
        return;
      }

      setIsSubmitting(true);
      try {
        // Revalidate against configured timezone right before executing swap
        const appDateTime = getAppDateTime();

        let freshSessions = sessions;
        try {
          const allFetched = await getSessions();
          if (Array.isArray(allFetched) && allFetched.length > 0) {
            freshSessions = allFetched.filter((s) => s.batchId === batch.id);
            setSessions(freshSessions);
          }
        } catch (fetchErr) {
          console.warn("Could not refetch latest sessions for confirmation revalidation:", fetchErr);
        }

        const freshSource = freshSessions.find((s) => s.id === sourceSessionId);
        const freshTarget = freshSessions.find((s) => s.id === targetSessionId);

        if (!freshSource) {
          toast.error("Slot A class could not be found or has been removed.");
          return;
        }
        if (!freshTarget) {
          toast.error("Slot B class could not be found or has been removed.");
          return;
        }

        const sourceEligibility = getSessionInterchangeEligibility(freshSource, batch, appDateTime);
        if (!sourceEligibility.eligible) {
          toast.error(`Slot A class (${freshSource.sessionDate}) is ineligible: ${sourceEligibility.reason}`);
          return;
        }

        const targetEligibility = getSessionInterchangeEligibility(freshTarget, batch, appDateTime);
        if (!targetEligibility.eligible) {
          toast.error(`Slot B class (${freshTarget.sessionDate}) is ineligible: ${targetEligibility.reason}`);
          return;
        }

        const result = await shuffleBatchSchedule(batch.id, {
          action: "SWAP",
          sourceSessionId,
          targetSessionId,
          reason: swapReason.trim() || "Batch schedule session interchange",
        });

        toast.success(
          `Successfully interchanged classes between ${freshSource.sessionDate} and ${freshTarget.sessionDate}!`
        );
        if (onSuccess) onSuccess(result);
        onClose();
      } catch (err) {
        toast.error(err?.message || "Failed to swap class sessions.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // SHUFFLE_RANGE
      if (rangeSessions.length < 2) {
        toast.error("At least 2 scheduled classes must fall in range to randomize curriculum.");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await shuffleBatchSchedule(batch.id, {
          action: "SHUFFLE_RANGE",
          startDate: rangeStartDate,
          endDate: rangeEndDate || null,
          reason: shuffleReason.trim() || "Randomized workout schedule range",
        });

        toast.success(
          `Successfully randomized ${rangeSessions.length} classes for ${batch.name}!`
        );
        if (onSuccess) onSuccess(result);
        onClose();
      } catch (err) {
        toast.error(err?.message || "Failed to shuffle schedule range.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} size="2xl">
      <FormModalHeader
        icon={ArrowLeftRight}
        title={allowRandomizeRange ? "Shuffle & Interchange Class Schedule" : "Interchange Class Schedule"}
        subtitle={`Swap workout programs between scheduled dates and days for ${batch.name}.`}
        onClose={onClose}
      />

      <FormModalBody className="space-y-6">
        {/* Mode Selector Tabs (only shown when allowRandomizeRange is true) */}
        {allowRandomizeRange && (
          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border/70">
            <button
              type="button"
              onClick={() => setMode("SWAP")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "SWAP"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shuffle size={14} />
              <span>Randomize Cycle Range</span>
            </button>
          </div>
        )}

        {eligibleSessions.length < 2 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
            <AlertCircle size={24} className="mx-auto text-amber-500" />
            <p className="font-bold text-foreground">
              Insufficient Scheduled Classes
            </p>
            <p>
              {allowRandomizeRange
                ? "This batch needs at least 2 scheduled upcoming classes to perform a swap or shuffle. Classes that have already ended today, are in progress, or are from past dates cannot be interchanged."
                : "This batch needs at least 2 scheduled upcoming classes to perform a swap. Classes that have already ended today, are in progress, or are from past dates cannot be interchanged."}
            </p>
          </div>
        ) : mode === "SWAP" || !allowRandomizeRange ? (
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

                <SelectField
                  label="Select Scheduled Date & Class:"
                  value={sourceSessionId}
                  onChange={(e) => {
                    const newSourceId = e.target.value;
                    setSourceSessionId(newSourceId);
                    if (newSourceId === targetSessionId) {
                      const other = eligibleSessions.find((s) => s.id !== newSourceId);
                      if (other) setTargetSessionId(other.id);
                    }
                  }}
                  options={eligibleSessions.map((s) => ({
                    value: s.id,
                    label: `${s.sessionDate} (${s.dayOfWeek}) — ${s.subject || s.className}`,
                  }))}
                />

                {sourceSession && (
                  <div className="rounded-xl border border-slate-200/80 dark:border-border/60 bg-white dark:bg-card p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-foreground">
                        {sourceSession.subject || sourceSession.className}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(sourceSession.timing || batch?.timingLabel) && (
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock size={10} />
                            <span>{sourceSession.timing || batch?.timingLabel}</span>
                          </span>
                        )}
                        {sourceSession.classId && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded">
                            {sourceSession.classId}
                          </span>
                        )}
                      </div>
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

                <SelectField
                  label="Select Scheduled Date & Class:"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  options={eligibleSessions
                    .filter((s) => s.id !== sourceSessionId)
                    .map((s) => ({
                      value: s.id,
                      label: `${s.sessionDate} (${s.dayOfWeek}) — ${s.subject || s.className}`,
                    }))}
                />

                {targetSession && (
                  <div className="rounded-xl border border-slate-200/80 dark:border-border/60 bg-white dark:bg-card p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-foreground">
                        {targetSession.subject || targetSession.className}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(targetSession.timing || batch?.timingLabel) && (
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock size={10} />
                            <span>{targetSession.timing || batch?.timingLabel}</span>
                          </span>
                        )}
                        {targetSession.classId && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded">
                            {targetSession.classId}
                          </span>
                        )}
                      </div>
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
            <InputField
              label="Reason for Schedule Interchange (Audit Log)"
              value={swapReason}
              onChange={(e) => setSwapReason(e.target.value)}
              placeholder="e.g. Swapped Monday with Wednesday due to public holiday or trainer request"
            />
          </div>
        ) : (
          /* ─── MODE: RANDOMIZE CYCLE RANGE ─── */
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Select Date Range to Shuffle</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField
                  label="Range Start Date"
                  type="date"
                  value={rangeStartDate}
                  onChange={(e) => setRangeStartDate(e.target.value)}
                />

                <InputField
                  label="Range End Date (Optional)"
                  type="date"
                  value={rangeEndDate}
                  onChange={(e) => setRangeEndDate(e.target.value)}
                />
              </div>

              <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Classes in range to be randomized:{" "}
                  <strong className="text-primary font-bold">
                    {rangeSessions.length} sessions
                  </strong>
                </span>
              </div>
            </div>

            <InputField
              label="Reason for Shuffle (Audit Log)"
              value={shuffleReason}
              onChange={(e) => setShuffleReason(e.target.value)}
              placeholder="e.g. Weekly workout curriculum randomization"
            />
          </div>
        )}
      </FormModalBody>

      <FormModalFooter
        onCancel={onClose}
        cancelText="Cancel"
        onSubmit={handleSubmit}
        submitText={
          mode === "SWAP"
            ? "Confirm Swap Classes"
            : `Confirm Shuffle (${rangeSessions.length})`
        }
        isSubmitting={isSubmitting}
        submitDisabled={
          (mode === "SWAP" &&
            (eligibleSessions.length < 2 ||
              !sourceSessionId ||
              !targetSessionId ||
              sourceSessionId === targetSessionId)) ||
          (mode === "SHUFFLE_RANGE" && rangeSessions.length < 2)
        }
        extraLeft={
          <span className="text-xs text-slate-500 dark:text-muted-foreground">
            Changes will be permanently logged in Schedule History.
          </span>
        }
      />
    </FormModal>
  );
}
