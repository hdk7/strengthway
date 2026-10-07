import { createPortal } from "react-dom";
import { X, UserCheck, Check } from "lucide-react";

export default function SubstituteCoachModal({
  isOpen,
  onClose,
  batch,
  batches = [],
  trainers = [],
  allTrainers = [],
  substituteForm,
  setSubstituteForm,
  onAssignSubstitute,
  isSubmitting = false,
}) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const selectedBatchObj = batch || batches?.find((b) => b.id === substituteForm?.batchId);
  const currentBatchName = selectedBatchObj?.name;

  const primaryCoachesList = trainers && trainers.length > 0 ? trainers : allTrainers;
  const availableSubstitutes = allTrainers.filter(
    (t) => t.id !== substituteForm.primaryTrainerId
  );

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <UserCheck size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                Designate Substitute Coach
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                {currentBatchName
                  ? `Assign a substitute trainer for ${currentBatchName}`
                  : "Assign a substitute faculty trainer for the scheduled batch session"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onAssignSubstitute} className="space-y-4 text-xs">
          {/* Batch Container Selector (when batches list provided) */}
          {batches && batches.length > 0 ? (
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-foreground">
                Batch Container <span className="text-destructive">*</span>
              </label>
              <select
                value={substituteForm.batchId || batch?.id || ""}
                onChange={(e) =>
                  setSubstituteForm({ ...substituteForm, batchId: e.target.value })
                }
                required
                className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">-- Select Batch Container --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.timingLabel || b.timing || b.startTime || "Scheduled"})
                  </option>
                ))}
              </select>
            </div>
          ) : batch ? (
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-foreground">
                Batch Container
              </label>
              <div className="w-full rounded-lg border border-slate-200 dark:border-border/80 bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-foreground flex items-center justify-between">
                <span>{batch.name}</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {batch.timingLabel || batch.timing || batch.id}
                </span>
              </div>
            </div>
          ) : null}

          {/* Primary Coach Being Substituted */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-foreground">
              Primary Coach Being Substituted
            </label>
            <select
              value={substituteForm.primaryTrainerId || ""}
              onChange={(e) =>
                setSubstituteForm({ ...substituteForm, primaryTrainerId: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">-- General Batch Substitution --</option>
              {primaryCoachesList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.role || t.shift || "Faculty"})
                </option>
              ))}
            </select>
          </div>

          {/* Substitute Coach */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-foreground">
              Substitute Coach <span className="text-destructive">*</span>
            </label>
            <select
              value={substituteForm.substituteTrainerId || ""}
              onChange={(e) =>
                setSubstituteForm({ ...substituteForm, substituteTrainerId: e.target.value })
              }
              required
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">-- Select Substitute Coach --</option>
              {availableSubstitutes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.specialization || t.experience || t.shift || "Trainer"})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-foreground">
              Substitution Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={substituteForm.date || ""}
              onChange={(e) =>
                setSubstituteForm({ ...substituteForm, date: e.target.value })
              }
              required
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-foreground">
              Reason & Handover Notes
            </label>
            <textarea
              rows={2}
              value={substituteForm.reason || ""}
              onChange={(e) =>
                setSubstituteForm({ ...substituteForm, reason: e.target.value })
              }
              placeholder="e.g., Coach on scheduled leave; taking over strength circuit..."
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-5 py-2 text-xs font-bold text-white cursor-pointer shadow-md disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isSubmitting ? "Assigning..." : "Assign Substitute"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
