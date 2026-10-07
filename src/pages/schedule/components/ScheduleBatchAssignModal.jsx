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
      className="fixed inset-0 z-110 flex items-center justify-center p-3 sm:p-6 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl shadow-2xl relative my-auto animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border px-5 py-4 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-blue-700 dark:text-primary" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                Assign Batches to Program
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground truncate max-w-70">
                {schedule.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-500 dark:text-muted-foreground">
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
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    isSelected
                      ? "border-blue-700 dark:border-primary bg-blue-50/60 dark:bg-primary/10 shadow-2xs"
                      : "border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50/60 dark:hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? "bg-blue-900 dark:bg-primary border-blue-900 dark:border-primary text-white"
                          : "border-slate-300 dark:border-muted-foreground/40 bg-white dark:bg-background"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-foreground block">
                        {b.name || b.shortName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-muted-foreground">
                        {b.timingLabel || `${b.startTime} - ${b.endTime}`} • {b.daysPattern}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 dark:text-muted-foreground">
                    {b.currentPax || 0} Members
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-border p-4 bg-white dark:bg-card shrink-0 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
            {assigningBatchIds.length} batch(es) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSaveBatchAssignments}
              disabled={submitting}
              className="rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-50"
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
