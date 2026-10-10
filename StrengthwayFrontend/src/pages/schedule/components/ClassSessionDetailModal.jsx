import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  Dumbbell,
  ArrowLeftRight,
  Sparkles,
  Layers,
} from "lucide-react";

export function ClassSessionDetailModal({
  isOpen,
  onClose,
  session,
  onOpenSwap,
}) {
  if (!isOpen || !session || typeof document === "undefined") return null;

  const hasBeginner =
    session.beginnerWorkouts &&
    session.beginnerWorkouts.trim() !== "Not specified";
  const hasIntermediate =
    session.intermediateWorkouts &&
    session.intermediateWorkouts.trim() !== "Not specified";

  return createPortal(
    <div
      className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/35 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-border pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-primary bg-blue-50 dark:bg-primary/10 px-2 py-0.5 rounded">
                {session.classId || "CLASS"}
              </span>
              <span className="rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 text-[10px]">
                {session.dayOfWeek}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                  session.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : session.status === "TODAY"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                }`}
              >
                {session.status || "SCHEDULED"}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-foreground">
              {session.subject || session.className}
            </h3>
            <p className="text-xs text-slate-500 dark:text-muted-foreground flex items-center gap-1.5">
              <Calendar size={13} />
              <span>
                {session.displayDate || session.sessionDate} • Batch:{" "}
                <strong>{session.batchName || session.batchId}</strong>
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Floor Meta Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl bg-slate-50 dark:bg-muted/30 p-2.5 border border-slate-200/70 dark:border-border">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Slot Time
            </span>
            <span className="font-bold text-slate-900 dark:text-foreground truncate block">
              {session.timing || `${session.startTime} - ${session.endTime}`}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-muted/30 p-2.5 border border-slate-200/70 dark:border-border">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Floor Coach
            </span>
            <span className="font-bold text-slate-900 dark:text-foreground truncate block">
              {session.coachName || "Assigned Coach"}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-muted/30 p-2.5 border border-slate-200/70 dark:border-border">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Studio
            </span>
            <span className="font-bold text-slate-900 dark:text-foreground truncate block">
              {session.roomName || session.room || "Studio 1"}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-muted/30 p-2.5 border border-slate-200/70 dark:border-border">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">
              Attendees
            </span>
            <span className="font-bold text-blue-700 dark:text-primary truncate block">
              {session.attendeesCount ?? 0} Pax
            </span>
          </div>
        </div>

        {/* Workout Prescriptions */}
        <div className="space-y-3">
          {/* Beginner Routine */}
          <div className="rounded-xl border border-slate-100 dark:border-border/80 bg-slate-50/70 dark:bg-muted/20 p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Beginner Workouts
            </span>
            <p className="text-xs text-slate-800 dark:text-foreground/90 leading-relaxed font-medium">
              {hasBeginner
                ? session.beginnerWorkouts
                : "No beginner-specific routine prescribed."}
            </p>
          </div>

          {/* Intermediate Routine */}
          <div className="rounded-xl border border-blue-100 dark:border-primary/20 bg-blue-50/40 dark:bg-primary/5 p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-primary flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-primary" />
              Intermediate Workouts
            </span>
            <p className="text-xs text-slate-800 dark:text-foreground leading-relaxed font-medium">
              {hasIntermediate
                ? session.intermediateWorkouts
                : "No intermediate routine prescribed."}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 dark:border-border pt-3.5 flex items-center justify-between">
          {onOpenSwap && session.status !== "COMPLETED" ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSwap(session);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-3.5 py-2 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-950/50 cursor-pointer transition-colors shadow-2xs"
            >
              <ArrowLeftRight size={14} />
              <span>Swap with Another Date</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
