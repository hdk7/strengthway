import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  XCircle,
} from "lucide-react";

export function MemberAttendanceCalendar({
  selectedMonth,
  setSelectedMonth,
  formattedSelectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleCurrentMonth,
  attendanceSummary,
  calendarDays,
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/50 p-5 sm:p-6 space-y-6">
      {/* Section Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <span>Month-Wise Attendance History</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily attendance check-ins, flex pass attendances, and attendance tracking.
          </p>
        </div>

        {/* Month Navigator Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="relative px-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                title="Select Month"
              />
              <span className="text-xs font-bold text-foreground font-mono cursor-pointer select-none">
                {formattedSelectedMonth}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">

        {/* Present in Primary */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Primary Present</span>
            <CheckCircle2 size={15} className="text-emerald-500" />
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-500">
            {attendanceSummary.primaryPresentCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Sessions in primary container</p>
        </div>

        {/* Flex Attendance */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Flex Present</span>
            <Sparkles size={15} className="text-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-black text-amber-500">
            {attendanceSummary.flexPresentCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Authorized flex pass visits</p>
        </div>

        {/* Absent Sessions */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Absent / Excused</span>
            <XCircle size={15} className="text-rose-500" />
          </div>
          <p className="mt-3 text-2xl font-black text-rose-500">
            {attendanceSummary.absentCount}
            {attendanceSummary.excusedCount > 0 && (
              <span className="text-xs text-muted-foreground font-normal ml-1">
                (+{attendanceSummary.excusedCount} exc)
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Missed scheduled sessions</p>
        </div>
      </div>

      {/* Visual Day-by-Day Calendar Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Day-by-Day Session Pills ({formattedSelectedMonth})
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {calendarDays.length} Days in Month
          </span>
        </div>

        {/* Pills Container */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-16 gap-2">
          {calendarDays.map((d) => {
            let badgeClass =
              "border-border/50 bg-muted/20 text-muted-foreground/60 hover:border-border";
            let textClass = "text-muted-foreground/80";

            if (d.variant === "present") {
              badgeClass =
                "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25";
              textClass = "text-emerald-400 font-black";
            } else if (d.variant === "flex") {
              badgeClass =
                "border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 shadow-xs";
              textClass = "text-amber-400 font-black";
            } else if (d.variant === "absent") {
              badgeClass =
                "border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25";
              textClass = "text-rose-400 font-bold";
            } else if (d.variant === "excused") {
              badgeClass =
                "border-sky-500/40 bg-sky-500/15 text-sky-400 hover:bg-sky-500/25";
              textClass = "text-sky-400 font-bold";
            }

            return (
              <div
                key={d.dateStr}
                title={`${d.dateStr} (${d.weekdayName}): ${d.statusLabel}`}
                className={`group relative flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-default select-none ${badgeClass}`}
              >
                <span className="text-[10px] font-mono text-muted-foreground">
                  {d.day}
                </span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground/80">
                  {d.weekdayName}
                </span>
                <span className={`mt-1 text-xs font-mono ${textClass}`}>
                  {d.code}
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-border/40 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
            Legend:
          </span>
          <div className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
              P
            </span>
            <span>Present (Primary Batch)</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
              F
            </span>
            <span>Flex Pass Session</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
              A
            </span>
            <span>Absent</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded bg-sky-500/20 text-sky-400 text-[10px] font-black border border-sky-500/30">
              E
            </span>
            <span>Excused</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded bg-muted/40 text-muted-foreground text-[10px] font-bold border border-border/60">
              —
            </span>
            <span>No Session / Rest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
