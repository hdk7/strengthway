import { createPortal } from "react-dom";
import { Boxes, X, Check } from "lucide-react";

export function ScheduleBatchAssignModal({
  schedule,
  onClose,
  batches,
  assigningBatchIds,
  onToggleAssignBatch,
  onSaveBatchAssignments,
  submitting,
}) {
  if (!schedule || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-110 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-primary" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Assign Batches to Program
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-70">
                {schedule.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            Select the batches that will run this scheduled class program. Each batch
            maintains its own separate floor session schedule and completion status.
          </p>

          <div className="space-y-2">
            {batches.map((b) => {
              const isSelected = assigningBatchIds.includes(b.id);
              return (
                <div
                  key={b.id}
                  onClick={() => onToggleAssignBatch(b.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-2xs"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-background"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        {b.name || b.shortName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {b.timingLabel || `${b.startTime} - ${b.endTime}`} • {b.daysPattern}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-muted-foreground">
                    {b.currentPax || 0} Members
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border p-4 bg-card shrink-0 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {assigningBatchIds.length} batch(es) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSaveBatchAssignments}
              disabled={submitting}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Batch Assignments"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
