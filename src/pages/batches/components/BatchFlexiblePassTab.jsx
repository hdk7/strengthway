/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, ShieldAlert, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  createFlexibleBatchAssignment,
  getBatchCapacityCheck,
} from "@/lib/batchesService";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function BatchFlexiblePassTab({
  effectiveMember,
  currentBatch,
  allBatches = [],
  onClose,
  onSuccess,
}) {
  const [flexTargetBatchId, setFlexTargetBatchId] = useState("");
  const [flexSelectedDays, setFlexSelectedDays] = useState([]);
  const [flexStartDate, setFlexStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [flexEndDate, setFlexEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [isOngoingPass, setIsOngoingPass] = useState(false);
  const [flexReason, setFlexReason] = useState("");
  const [flexCapacityInfo, setFlexCapacityInfo] = useState(null);
  const [isLoadingFlexCapacity, setIsLoadingFlexCapacity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target Batch for Flexible Assignment
  const selectedFlexBatch = useMemo(() => {
    return allBatches.find((b) => b.id === flexTargetBatchId);
  }, [allBatches, flexTargetBatchId]);

  // When flex target batch changes, filter out invalid days not in target batch
  useEffect(() => {
    if (selectedFlexBatch?.daysList && Array.isArray(selectedFlexBatch.daysList)) {
      setFlexSelectedDays((prev) =>
        prev.filter((d) => selectedFlexBatch.daysList.includes(d))
      );
    }
  }, [selectedFlexBatch]);

  // Real-time capacity check for Flexible Assignment
  useEffect(() => {
    if (!flexTargetBatchId || !flexStartDate) {
      setFlexCapacityInfo(null);
      return;
    }
    let cancelled = false;
    async function checkCap() {
      setIsLoadingFlexCapacity(true);
      try {
        const res = await getBatchCapacityCheck(flexTargetBatchId, flexStartDate);
        if (!cancelled) {
          setFlexCapacityInfo(res?.data || res);
        }
      } catch {
        if (!cancelled) setFlexCapacityInfo(null);
      } finally {
        if (!cancelled) setIsLoadingFlexCapacity(false);
      }
    }
    checkCap();
    return () => {
      cancelled = true;
    };
  }, [flexTargetBatchId, flexStartDate]);

  const toggleDaySelection = (day) => {
    setFlexSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFlexibleAssignment = async (e) => {
    e.preventDefault();
    if (!effectiveMember || !effectiveMember.id) {
      toast.error("Please select a member to assign flexible pass.");
      return;
    }
    if (!flexTargetBatchId) {
      toast.error("Please select a target batch for flex pass.");
      return;
    }
    if (flexTargetBatchId === (currentBatch?.id || effectiveMember.batchId)) {
      toast.error("Cannot create a flex assignment to the member's current primary batch.");
      return;
    }
    if (selectedFlexBatch?.status === "Inactive") {
      toast.error("Selected target batch is currently inactive.");
      return;
    }
    if (!flexSelectedDays || flexSelectedDays.length === 0) {
      toast.error("Please select at least one attendance day.");
      return;
    }
    if (!flexStartDate) {
      toast.error("Start date is required.");
      return;
    }
    if (!isOngoingPass && flexEndDate && new Date(flexStartDate) > new Date(flexEndDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }
    if (!flexReason.trim()) {
      toast.error("Please provide a reason for the flexible pass.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createFlexibleBatchAssignment({
        memberId: effectiveMember.id,
        targetBatchId: flexTargetBatchId,
        selectedDays: flexSelectedDays,
        startDate: flexStartDate,
        endDate: isOngoingPass ? null : flexEndDate || null,
        reason: flexReason.trim(),
        transferredBy: "Admin",
      });

      toast.success(
        `Assigned flexible pass for ${effectiveMember.firstName || effectiveMember.name || "Member"} to ${
          selectedFlexBatch?.name || "batch"
        } on [${flexSelectedDays.join(", ")}]!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Flex assignment error:", err);
      toast.error(err.message || "Failed to create flexible assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFlexibleAssignment} className="p-6 space-y-5">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-400 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Temporary / Multi-Day Flexible Pass
        </div>
        <p className="text-muted-foreground">
          Allows the member to attend another batch on specific designated days without relinquishing their primary enrollment in{" "}
          <span className="font-bold text-foreground">
            {currentBatch?.name || "Current Batch"}
          </span>.
        </p>
      </div>

      {/* Target Batch Select */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          Target Batch <span className="text-destructive">*</span>
        </label>
        <select
          value={flexTargetBatchId}
          onChange={(e) => setFlexTargetBatchId(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Select target batch...</option>
          {allBatches
            .filter((b) => b.id !== (currentBatch?.id || effectiveMember?.batchId))
            .map((b) => {
              const isInactive = b.status === "Inactive";
              return (
                <option key={b.id} value={b.id} disabled={isInactive}>
                  {b.name} ({b.timingLabel}) • {b.daysPattern} {isInactive ? "[INACTIVE]" : ""}
                </option>
              );
            })}
        </select>
      </div>

      {/* Target Batch Inactive Warning */}
      {selectedFlexBatch?.status === "Inactive" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-1.5 font-semibold">
          <ShieldAlert size={14} /> Warning: Target batch is inactive. Flex assignment cannot be created.
        </div>
      )}

      {/* Selected Days Checkboxes */}
      {selectedFlexBatch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Applicable Attendance Days <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              Batch runs on: {selectedFlexBatch.daysList?.join(", ") || selectedFlexBatch.daysPattern}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {DAYS_OF_WEEK.map((day) => {
              const isOperatingDay =
                selectedFlexBatch.daysList &&
                selectedFlexBatch.daysList.includes(day);
              const isChecked = flexSelectedDays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!isOperatingDay}
                  onClick={() => isOperatingDay && toggleDaySelection(day)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold border transition-all cursor-pointer ${
                    !isOperatingDay
                      ? "opacity-30 border-dashed border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : isChecked
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{day}</span>
                  {isChecked && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Window */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Start Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={flexStartDate}
            onChange={(e) => setFlexStartDate(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={isOngoingPass ? "" : flexEndDate}
            disabled={isOngoingPass}
            onChange={(e) => setFlexEndDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Ongoing Weekly Pass Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="ongoingPassToggle"
          checked={isOngoingPass}
          onChange={(e) => {
            setIsOngoingPass(e.target.checked);
            if (e.target.checked) setFlexEndDate("");
          }}
          className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
        />
        <label htmlFor="ongoingPassToggle" className="text-xs text-foreground font-medium cursor-pointer select-none">
          Ongoing Weekly Pass (no fixed end date)
        </label>
      </div>

      {/* Live Capacity Indicator */}
      {isLoadingFlexCapacity && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl border border-border bg-muted/20">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span>Checking live batch capacity on selected date...</span>
        </div>
      )}
      {!isLoadingFlexCapacity && flexCapacityInfo && (
        <div
          className={`rounded-xl border p-3.5 text-xs space-y-1 ${
            flexCapacityInfo.isFull
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span>
              Live Check on {flexCapacityInfo.dayOfWeek || "Selected Date"} ({flexCapacityInfo.date})
            </span>
            <span>{flexCapacityInfo.occupancyPercent}% Booked</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>
              Effective Pax: <strong className="text-foreground">{flexCapacityInfo.effectivePax}</strong> / {flexCapacityInfo.maxPax}
            </span>
            <span className={flexCapacityInfo.isFull ? "text-destructive font-black" : "text-emerald-400 font-black"}>
              {flexCapacityInfo.spotsRemaining} spots available
            </span>
          </div>
          {flexCapacityInfo.isFull && (
            <div className="flex items-center gap-1.5 text-destructive font-semibold pt-1">
              <ShieldAlert size={14} /> Warning: Target batch is full on this date.
            </div>
          )}
        </div>
      )}

      {/* Reason Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-800 dark:text-foreground">
          Flex Pass Reason & Notes <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={flexReason}
          onChange={(e) => setFlexReason(e.target.value)}
          placeholder="e.g., Attending Wednesday Evening strength session due to morning conflict..."
          rows={2}
          required
          className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 p-3 text-xs text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:border-blue-600 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
        />
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-border/60">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted shadow-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !flexTargetBatchId || flexSelectedDays.length === 0 || selectedFlexBatch?.status === "Inactive"}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          <span>Assign Flexible Batch Pass</span>
        </button>
      </div>
    </form>
  );
}
