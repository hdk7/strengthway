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
import { isAdmin } from "@/auth/currentUser";

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
      className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {session.classId || "CLASS"}
              </span>
              <span className="rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 text-[10px]">
                {session.dayOfWeek}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                  session.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : session.status === "TODAY"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}
              >
                {session.status || "SCHEDULED"}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-foreground">
              {session.subject || session.className}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
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
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Floor Meta Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl bg-muted/30 p-2.5 border border-border/70">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
              Slot Time
            </span>
            <span className="font-bold text-foreground truncate block">
              {session.timing || `${session.startTime} - ${session.endTime}`}
            </span>
          </div>

          <div className="rounded-xl bg-muted/30 p-2.5 border border-border/70">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
              Floor Coach
            </span>
            <span className="font-bold text-foreground truncate block">
              {session.coachName || "Assigned Coach"}
              {session.isSubstituted && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  (Substitute)
                </span>
              )}
            </span>
            {session.isSubstituted && session.originalCoachName && (
              <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                Original: {session.originalCoachName}
              </span>
            )}
          </div>

          <div className="rounded-xl bg-muted/30 p-2.5 border border-border/70">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
              Studio
            </span>
            <span className="font-bold text-foreground truncate block">
              {session.roomName || session.room || "Studio 1"}
            </span>
          </div>

          <div className="rounded-xl bg-muted/30 p-2.5 border border-border/70">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
              Attendees
            </span>
            <span className="font-bold text-primary truncate block">
              {session.attendeesCount ?? 0} Pax
            </span>
          </div>
        </div>

        {/* Workout Prescriptions */}
        <div className="space-y-3">
          {/* Beginner Routine */}
          <div className="rounded-xl border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/25 p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Beginner Workouts
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed font-normal">
              {hasBeginner
                ? session.beginnerWorkouts
                : "No beginner-specific routine prescribed."}
            </p>
          </div>

          {/* Intermediate Routine */}
          <div className="rounded-xl border border-blue-500/30 dark:border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/25 p-3.5 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
              Intermediate Workouts
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed font-normal">
              {hasIntermediate
                ? session.intermediateWorkouts
                : "No intermediate routine prescribed."}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border pt-3.5 flex items-center justify-between">
          {isAdmin() && onOpenSwap && session.status !== "COMPLETED" ? (
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
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
