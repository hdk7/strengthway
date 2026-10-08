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
  UserCheck,
} from "lucide-react";
import { getTrainerPhoto } from "@/lib/trainersService";

export function TrainerAttendanceDetailModal({
  isOpen,
  onClose,
  trainer,
  record,
  selectedDate,
  scheduleDetails,
}) {
  if (!isOpen) return null;

  const status = record?.status || "UNMARKED";
  const checkInTime = record?.checkInTime || "—";
  const checkOutTime = record?.checkOutTime || "—";
  const notes = record?.notes || "No session remarks logged for this shift.";
  const photo = getTrainerPhoto(trainer);

  const getStatusBadge = () => {
    if (status === "PRESENT" || status === "CONDUCTED" || record?.checkInTime) {
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
        className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
              <Eye size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-foreground">
                Faculty Attendance Record Details
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Verified historical attendance log & floor shift timing (Read-Only).
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

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
              <Calendar size={11} className="text-blue-700 dark:text-accent" />
              <span>Session Date</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-foreground">
              {selectedDate} ({scheduleDetails?.dayOfWeek || "Scheduled Day"})
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
              <Layers size={11} className="text-blue-700 dark:text-accent" />
              <span>Assigned Container / Slot</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-foreground truncate" title={scheduleDetails?.timingLabel}>
              {scheduleDetails?.timingLabel || trainer?.shift || "Faculty Shift"}
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
              <LogIn size={11} className="text-emerald-500" />
              <span>Check-In Timestamp</span>
            </span>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{checkInTime}</p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
              <LogOut size={11} className="text-blue-600 dark:text-blue-400" />
              <span>Check-Out Timestamp</span>
            </span>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{checkOutTime}</p>
          </div>

          <div className="col-span-2 p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
              <Clock size={11} className="text-blue-700 dark:text-accent" />
              <span>Recorded Duration & Floor Hours</span>
            </span>
            <p className="font-semibold text-slate-900 dark:text-foreground">
              {record?.durationMinutes || 60} minutes ({Math.round(((record?.durationMinutes || 60) / 60) * 10) / 10} hrs)
            </p>
          </div>

          <div className="col-span-2 p-2.5 rounded-lg border border-slate-200 dark:border-border/60 bg-slate-50/40 dark:bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-muted-foreground flex items-center gap-1">
              <FileText size={11} className="text-blue-700 dark:text-accent" />
              <span>Session Remarks / Notes</span>
            </span>
            <p className="font-medium text-slate-800 dark:text-foreground italic">{notes}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-4 py-2 text-xs font-semibold text-slate-700 dark:text-foreground hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
