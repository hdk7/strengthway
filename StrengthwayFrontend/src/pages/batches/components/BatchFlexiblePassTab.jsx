import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createFlexibleBatchAssignment,
  getBatchCapacityCheck,
} from "@/lib/batchesService";
import {
  SelectField,
  InputField,
  TextareaField,
  CheckboxField,
} from "@/components/form";

export default function BatchFlexiblePassTab({
  effectiveMember,
  currentBatch,
  allBatches = [],
  onClose,
  onSuccess,
}) {
  const [flexTargetBatchId, setFlexTargetBatchId] = useState("");
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

  // Check capacity warnings for Flexible Assignment
  const isFlexBatchFull = useMemo(() => {
    if (!selectedFlexBatch) return false;
    const currentPax = selectedFlexBatch.memberIds
      ? selectedFlexBatch.memberIds.length
      : selectedFlexBatch.currentPax || 0;
    const maxPax = selectedFlexBatch.maxPax || 25;
    if (currentPax >= maxPax) return true;
    if (flexCapacityInfo && flexCapacityInfo.isFull) return true;
    return false;
  }, [selectedFlexBatch, flexCapacityInfo]);

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
    if (isFlexBatchFull) {
      toast.error("This batch has reached its maximum capacity. Please select another batch.");
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
        sourceBatchId: currentBatch?.id || effectiveMember.batchId || "",
        targetBatchId: flexTargetBatchId,
        selectedDays: selectedFlexBatch?.daysList || [],
        startDate: flexStartDate,
        endDate: isOngoingPass ? null : flexEndDate || null,
        reason: flexReason.trim(),
        transferredBy: "Admin",
      });

      toast.success(
        `Assigned flexible pass for ${effectiveMember.firstName || effectiveMember.name || "Member"} to ${
          selectedFlexBatch?.name || "batch"
        }!`
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
      <SelectField
        label="Target Batch"
        required
        value={flexTargetBatchId}
        onChange={(e) => setFlexTargetBatchId(e.target.value)}
        options={[
          { value: "", label: "Select target batch..." },
          ...allBatches
            .filter((b) => b.id !== (currentBatch?.id || effectiveMember?.batchId))
            .map((b) => {
              const pax = b.memberIds ? b.memberIds.length : b.currentPax || 0;
              const max = b.maxPax || 25;
              const isFull = pax >= max;
              const isInactive = b.status === "Inactive";
              return {
                value: b.id,
                disabled: isFull || isInactive,
                label: `${b.name} (${b.timingLabel}) — ${pax}/${max} Pax ${isFull ? "[FULL]" : isInactive ? "[INACTIVE]" : `[${max - pax} spots left]`}`,
              };
            }),
        ]}
      />

      {/* Target Batch Warning */}
      {selectedFlexBatch && isFlexBatchFull && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-1.5 font-semibold">
          <ShieldAlert size={14} /> This batch has reached its maximum capacity. Please select another batch.
        </div>
      )}
      {selectedFlexBatch?.status === "Inactive" && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-1.5 font-semibold">
          <ShieldAlert size={14} /> Warning: Target batch is inactive. Flex assignment cannot be created.
        </div>
      )}

      {/* Date Window */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Start Date"
          type="date"
          required
          value={flexStartDate}
          onChange={(e) => setFlexStartDate(e.target.value)}
        />

        <InputField
          label="End Date (Optional)"
          type="date"
          value={isOngoingPass ? "" : flexEndDate}
          disabled={isOngoingPass}
          onChange={(e) => setFlexEndDate(e.target.value)}
        />
      </div>

      {/* Ongoing Weekly Pass Toggle */}
      <CheckboxField
        id="ongoingPassToggle"
        checked={isOngoingPass}
        onChange={(e) => {
          setIsOngoingPass(e.target.checked);
          if (e.target.checked) setFlexEndDate("");
        }}
        label="Ongoing Weekly Pass (no fixed end date)"
      />

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
              <ShieldAlert size={14} /> This batch has reached its maximum capacity. Please select another batch.
            </div>
          )}
        </div>
      )}

      {/* Reason Field */}
      <TextareaField
        label="Flex Pass Reason & Notes"
        required
        rows={2}
        resize="vertical"
        value={flexReason}
        onChange={(e) => setFlexReason(e.target.value)}
        placeholder="e.g., Attending Wednesday Evening strength session due to morning conflict..."
      />

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
          disabled={
            isSubmitting ||
            !flexTargetBatchId ||
            isFlexBatchFull ||
            selectedFlexBatch?.status === "Inactive"
          }
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-700 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          <span>Assign Flexible Batch Pass</span>
        </button>
      </div>
    </form>
  );
}
