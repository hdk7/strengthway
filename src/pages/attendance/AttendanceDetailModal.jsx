import {
  Eye,
  X,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  Layers,
  User,
  ShieldCheck,
  FileText,
  Sparkles,
} from "lucide-react";

export function AttendanceDetailModal({
  isOpen,
  onClose,
  attendee,
  record,
  selectedDate,
  batchName,
}) {
  if (!isOpen) return null;

  const status = record?.status || "UNMARKED";
  const checkInTime = record?.checkInTime || "—";
  const checkOutTime = record?.checkOutTime || "—";
  const markedBy = record?.markedBy || "Coach";
  const notes = record?.notes || "No notes logged for this session.";
  const isFlex = Boolean(record?.isFlexAttendance || attendee?.isFlexIn);

  const getStatusBadge = () => {
    if (status === "PRESENT" || record?.checkInTime || status === "CHECKED_IN" || status === "CHECKED_OUT") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
          <ShieldCheck size={13} />
          <span>Present</span>
        </span>
      );
    }
    if (status === "ABSENT") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400">
          <X size={13} />
          <span>Absent</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
        <span>Absent / Not Recorded</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <Eye size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Attendance Record Details
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Verified historical attendance log (Read-Only).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Athlete Overview Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/20">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-sm uppercase">
            {attendee?.name?.[0] || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-foreground truncate text-sm">
              {attendee?.name || record?.memberName || "Athlete"}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span>{attendee?.memberId || record?.memberId}</span>
              {attendee?.mobile && <span>• {attendee.mobile}</span>}
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Date */}
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar size={13} className="text-accent" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">Attendance Date</span>
            </div>
            <p className="font-bold font-mono text-foreground">{record?.date || selectedDate}</p>
          </div>

          {/* Batch */}
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Layers size={13} className="text-accent" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">Scheduled Batch</span>
            </div>
            <p className="font-bold text-foreground truncate">{batchName || "Batch Class"}</p>
          </div>

          {/* Check-In Time */}
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <LogIn size={13} className="text-emerald-500" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">Check-In Time</span>
            </div>
            <p className="font-bold font-mono text-foreground">{checkInTime}</p>
          </div>

          {/* Check-Out Time */}
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <LogOut size={13} className="text-blue-400" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">Check-Out Time</span>
            </div>
            <p className="font-bold font-mono text-foreground">{checkOutTime}</p>
          </div>
        </div>

        {/* Flex info if applicable */}
        {isFlex && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold">
            <Sparkles size={14} className="shrink-0" />
            <span>Flex Pass Attendance: Attended session outside home batch container.</span>
          </div>
        )}

        {/* Marked By & Notes */}
        <div className="space-y-2 rounded-xl border border-border bg-background/40 p-3 text-xs">
          <div className="flex items-center justify-between text-muted-foreground border-b border-border/50 pb-1.5">
            <span className="flex items-center gap-1 font-semibold">
              <User size={12} className="text-accent" />
              <span>Marked By:</span>
            </span>
            <span className="font-mono text-foreground font-semibold">{markedBy}</span>
          </div>
          <div className="pt-1">
            <span className="flex items-center gap-1 text-muted-foreground font-semibold mb-1">
              <FileText size={12} className="text-accent" />
              <span>Session Notes:</span>
            </span>
            <p className="text-foreground italic bg-background/60 p-2 rounded-lg border border-border/40 text-[11px]">
              "{notes}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] text-muted-foreground italic">
            Historical attendance records are archived and locked.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-accent px-4 py-1.5 text-xs font-bold text-accent-foreground hover:bg-accent/90 transition-all cursor-pointer shadow-xs"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
