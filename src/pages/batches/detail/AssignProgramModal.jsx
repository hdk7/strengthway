import { createPortal } from "react-dom";
import { X, Layers, Plus } from "lucide-react";
import { resolveAssignedBatches } from "@/lib/masterScheduleService";

export default function AssignProgramModal({
  isOpen,
  onClose,
  batch,
  allMasterSchedules = [],
  allBatches = [],
  onAssignProgram,
  onUnassignProgram,
  onCreateMasterSchedule,
}) {
  if (!isOpen || typeof document === "undefined" || !batch) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                Assign Scheduled Program to {batch.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Select a reusable Scheduled Class Program to run in this batch.
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

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {allMasterSchedules.map((prog) => {
            const isCurrentlyAssigned =
              (Array.isArray(prog.batchIds) && prog.batchIds.includes(batch.id)) ||
              prog.batchId === batch.id;
            const assignedBatches = resolveAssignedBatches(prog.batchIds, allBatches);

            return (
              <div
                key={prog.id}
                className={`rounded-lg border p-4 transition-all ${
                  isCurrentlyAssigned
                    ? "border-blue-700 dark:border-primary bg-blue-50/50 dark:bg-primary/5 ring-1 ring-blue-700/30 dark:ring-primary/30"
                    : "border-slate-200 dark:border-border bg-white dark:bg-card hover:border-slate-300 dark:hover:border-foreground/20 hover:bg-slate-50/50 dark:hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground">{prog.name}</span>
                      {isCurrentlyAssigned && (
                        <span className="rounded bg-blue-900 dark:bg-primary text-white px-2 py-0.5 text-[10px] font-extrabold uppercase">
                          Currently Assigned
                        </span>
                      )}
                      <span className="rounded bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-muted-foreground">
                        {prog.totalClasses || 12} Classes
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {prog.description || "Structured reusable curriculum."}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span>
                        Coach:{" "}
                        <strong className="text-foreground">
                          {prog.coachName || "Coach"}
                        </strong>
                      </span>
                      <span>
                        Shift:{" "}
                        <strong className="text-foreground">
                          {prog.timing || prog.shift}
                        </strong>
                      </span>
                      <span>
                        Days:{" "}
                        <strong className="text-foreground">
                          {prog.daysPattern || "MWF"}
                        </strong>
                      </span>
                    </div>

                    <div className="pt-2 text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Running in:{" "}
                      </span>
                      {assignedBatches.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">
                          None (Reusable template)
                        </span>
                      ) : (
                        assignedBatches.map((b) => (
                          <span
                            key={b.id}
                            className={`inline-block mr-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              b.id === batch.id
                                ? "bg-blue-100 dark:bg-primary/20 text-blue-900 dark:text-primary font-bold"
                                : "bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground"
                            }`}
                          >
                            {b.shortName || b.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    {isCurrentlyAssigned ? (
                      <button
                        type="button"
                        onClick={() => onUnassignProgram(prog.id)}
                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 cursor-pointer"
                      >
                        Unassign
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAssignProgram(prog.id)}
                        className="rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-primary dark:hover:bg-primary/90 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer shadow-xs"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-border pt-3 shrink-0">
          <button
            type="button"
            onClick={onCreateMasterSchedule}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-primary hover:underline cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Brand New Reusable Program</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
