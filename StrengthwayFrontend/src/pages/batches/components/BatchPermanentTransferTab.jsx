import { useState, useMemo } from "react";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { executeBatchTransfer } from "@/lib/batchesService";
import { SelectField, InputField, TextareaField } from "@/components/form";

export default function BatchPermanentTransferTab({
  effectiveMember,
  currentBatch,
  allBatches = [],
  onClose,
  onSuccess,
}) {
  const [transferTargetBatchId, setTransferTargetBatchId] = useState("");
  const [transferEffectiveDate, setTransferEffectiveDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [transferReason, setTransferReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target Batch for Permanent Transfer
  const selectedTransferBatch = useMemo(() => {
    return allBatches.find((b) => b.id === transferTargetBatchId);
  }, [allBatches, transferTargetBatchId]);

  // Check capacity warnings for Permanent Transfer
  const isTransferBatchFull = useMemo(() => {
    if (!selectedTransferBatch) return false;
    const currentPax = selectedTransferBatch.memberIds
      ? selectedTransferBatch.memberIds.length
      : selectedTransferBatch.currentPax || 0;
    const maxPax = selectedTransferBatch.maxPax || 25;
    return currentPax >= maxPax;
  }, [selectedTransferBatch]);

  const handlePermanentTransfer = async (e) => {
    e.preventDefault();
    if (!effectiveMember || !effectiveMember.id) {
      toast.error("Please select a member to transfer.");
      return;
    }
    if (!transferTargetBatchId) {
      toast.error("Please select a target batch.");
      return;
    }
    if (transferTargetBatchId === (currentBatch?.id || effectiveMember.batchId)) {
      toast.error("Member is already assigned to this batch.");
      return;
    }
    if (selectedTransferBatch?.status === "Inactive") {
      toast.error("Selected target batch is currently inactive.");
      return;
    }
    if (isTransferBatchFull) {
      toast.error("This batch has reached its maximum capacity. Please select another batch.");
      return;
    }
    if (!transferReason.trim()) {
      toast.error("Please provide a reason for the transfer.");
      return;
    }

    try {
      setIsSubmitting(true);
      await executeBatchTransfer({
        memberId: effectiveMember.id,
        sourceBatchId: currentBatch?.id || effectiveMember.batchId || "",
        targetBatchId: transferTargetBatchId,
        effectiveDate: transferEffectiveDate,
        reason: transferReason.trim(),
        transferredBy: "Admin",
      });

      toast.success(
        `Successfully transferred ${effectiveMember.firstName || effectiveMember.name || "Member"} to ${
          selectedTransferBatch?.name || "new batch"
        }!`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Transfer error:", err);
      toast.error(err.message || "Failed to execute batch transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePermanentTransfer} className="p-6 space-y-5">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-400 space-y-1">
        <div className="font-semibold flex items-center gap-1.5">
          <CheckCircle2 size={14} /> Permanent Batch Move
        </div>
        <p className="text-muted-foreground">
          Permanently unenrolls the member from{" "}
          <span className="font-bold text-foreground">
            {currentBatch?.name || "Current Batch"}
          </span>{" "}
          and enrolls them into the selected target batch. An immutable audit record will be logged.
        </p>
      </div>

      {/* Target Batch Select */}
      <SelectField
        label="Target Batch"
        required
        value={transferTargetBatchId}
        onChange={(e) => setTransferTargetBatchId(e.target.value)}
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

      {/* Target Batch Info / Warning */}
      {selectedTransferBatch && (
        <div
          className={`rounded-xl border p-4 text-xs ${
            isTransferBatchFull || selectedTransferBatch.status === "Inactive"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/20 text-foreground"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">{selectedTransferBatch.name}</span>
            <span className="font-semibold">
              {selectedTransferBatch.timingLabel} • {selectedTransferBatch.daysLabel}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-muted-foreground">
            <span>
              Current Pax:{" "}
              <strong className="text-foreground">
                {selectedTransferBatch.memberIds?.length || selectedTransferBatch.currentPax || 0}
              </strong>{" "}
              / {selectedTransferBatch.maxPax || 25}
            </span>
            <span>
              Headroom:{" "}
              <strong
                className={
                  isTransferBatchFull || selectedTransferBatch.status === "Inactive"
                    ? "text-destructive font-black"
                    : "text-emerald-400 font-black"
                }
              >
                {selectedTransferBatch.status === "Inactive"
                  ? "Inactive"
                  : `${Math.max(
                      0,
                      (selectedTransferBatch.maxPax || 25) -
                        (selectedTransferBatch.memberIds?.length || selectedTransferBatch.currentPax || 0)
                    )} spots remaining`}
              </strong>
            </span>
          </div>
          {isTransferBatchFull && (
            <div className="mt-2 flex items-center gap-1.5 text-destructive font-semibold">
              <ShieldAlert size={14} /> This batch has reached its maximum capacity. Please select another batch.
            </div>
          )}
          {selectedTransferBatch.status === "Inactive" && (
            <div className="mt-2 flex items-center gap-1.5 text-destructive font-semibold">
              <ShieldAlert size={14} /> This batch is currently inactive. Cannot transfer here.
            </div>
          )}
        </div>
      )}

      {/* Effective Transfer Date */}
      <InputField
        label="Effective Transfer Date"
        type="date"
        required
        value={transferEffectiveDate}
        onChange={(e) => setTransferEffectiveDate(e.target.value)}
      />

      {/* Reason Field */}
      <TextareaField
        label="Transfer Reason & Notes"
        required
        rows={3}
        resize="vertical"
        value={transferReason}
        onChange={(e) => setTransferReason(e.target.value)}
        placeholder="e.g., Requested evening slot due to office hours change..."
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
            !transferTargetBatchId ||
            isTransferBatchFull ||
            selectedTransferBatch?.status === "Inactive"
          }
          className="inline-flex items-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-700 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          <span>Confirm Permanent Transfer</span>
        </button>
      </div>
    </form>
  );
}
