import {
  Eye,
  X,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  Layers,
  ShieldCheck,
  XCircle,
  FileText,
  AlertTriangle,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { getTrainerPhoto } from "@/lib/trainersService";

export function TrainerAttendanceDetailModal({
  isOpen,
  onClose,
  trainer,
  record,
  interval,
  selectedDate,
  scheduleDetails,
}) {
  if (!isOpen) return null;

  const status = record?.status || interval?.status || "UNMARKED";
  const checkInTime = record?.checkInTime || interval?.checkInTime || "—";
  const checkOutTime = record?.checkOutTime || interval?.checkOutTime || "—";
  const notes = record?.notes || interval?.notes || "No session remarks logged for this shift.";
  const remarks = record?.remarks || interval?.remarks || "";
  const photo = getTrainerPhoto(trainer);

  const actualPresenceMinutes = interval?.actualDurationMinutes || record?.actualPresenceMinutes || 0;
  const teachingDurationMinutes = interval?.totalTeachingDurationMinutes || record?.durationMinutes || 0;
  const sessionOverlaps = interval?.sessionOverlaps || [];
  const isContinuous = Boolean(interval?.isContinuous || sessionOverlaps.length > 1);
  const isException = Boolean(record?.isException || interval?.isException || (!checkOutTime && checkInTime !== "—"));

  const getStatusBadge = () => {
    if (status === "PRESENT" || status === "CONDUCTED" || checkInTime !== "—") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
          <ShieldCheck size={13} />
          <span>Present</span>
        </span>
      );
    }
    if (status === "LEAVE") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 px-3 py-1 text-xs font-bold text-sky-400">
          <Calendar size={13} />
          <span>Approved Leave</span>
        </span>
      );
    }
    if (status === "ABSENT") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400">
          <XCircle size={13} />
          <span>Absent</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
        <span>Pending Check-in</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-2xl space-y-4 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <Eye size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-foreground">
                Faculty Attendance & Session Duration Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Verified timestamps, presence duration, and teaching overlap calculations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Faculty Overview Card */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-border/70 bg-slate-50/60 dark:bg-muted/20">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border/60">
            {photo ? (
              <img src={photo} alt={trainer?.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center font-bold text-sm bg-blue-50 dark:bg-accent/15 text-blue-700 dark:text-accent uppercase">
                {trainer?.name?.[0] || "T"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 dark:text-foreground truncate text-sm">
              {trainer?.name || record?.trainerName || "Faculty Coach"}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground font-mono">
              <span>ID: {trainer?.id || record?.trainerId}</span>
              {trainer?.phone && <span>• {trainer.phone}</span>}
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Timestamps & Presence Durations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1 mb-1">
              <LogIn size={11} className="text-emerald-500" />
              <span>Check-In</span>
            </span>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{checkInTime}</p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1 mb-1">
              <LogOut size={11} className="text-blue-600 dark:text-blue-400" />
              <span>Check-Out</span>
            </span>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{checkOutTime}</p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1 mb-1">
              <Timer size={11} className="text-indigo-500" />
              <span>Actual Presence</span>
            </span>
            <p className="font-mono font-bold text-foreground">
              {actualPresenceMinutes > 0 ? `${actualPresenceMinutes}m` : checkInTime !== "—" ? "Active" : "—"}
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1 mb-1">
              <Clock size={11} className="text-amber-500" />
              <span>Teaching Overlap</span>
            </span>
            <p className="font-mono font-bold text-foreground">
              {teachingDurationMinutes > 0 ? `${teachingDurationMinutes}m` : "—"}
            </p>
          </div>
        </div>

        {/* Remarks / Exception Banner */}
        {remarks && (
          <div className="p-3 rounded-lg border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-muted/20 text-xs">
            <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
              Remarks & Exceptions:
            </span>
            <p className="text-foreground font-semibold flex items-center gap-1.5">
              {isException && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
              <span>{remarks}</span>
            </p>
          </div>
        )}

        {/* Consecutive Sessions Breakdown (if continuous) */}
        {isContinuous && sessionOverlaps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Layers size={13} className="text-accent" />
                <span>Continuous Consecutive Sessions Breakdown</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {sessionOverlaps.length} Classes Joined
              </span>
            </div>

            <div className="divide-y divide-border/60 rounded-xl border border-border/80 bg-muted/15 overflow-hidden text-xs">
              {sessionOverlaps.map((s, idx) => (
                <div key={s.sessionId || idx} className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{s.className || s.batchName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({s.startTime} - {s.endTime})
                      </span>
                      {s.isSubstituted && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/25">
                          Substitute Session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground italic mt-0.5">{s.remarks}</p>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-emerald-500 block">
                      {s.overlapMinutes}m / {s.scheduledDurationMinutes}m
                    </span>
                    <span className="text-[10px] text-muted-foreground">Scheduled Overlap</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Shift / Schedule Notes */}
        <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
            <FileText size={11} className="text-blue-700 dark:text-accent" />
            <span>Shift Details & Notes</span>
          </span>
          <p className="font-medium text-slate-800 dark:text-foreground italic">{notes}</p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
