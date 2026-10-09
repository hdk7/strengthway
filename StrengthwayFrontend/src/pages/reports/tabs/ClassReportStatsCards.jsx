export function ClassReportStatsCards({ classesReport }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Total Month Sessions
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-foreground">
            {classesReport?.summary?.totalSessions ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">classes</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Conducted Classes
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {classesReport?.summary?.completedCount ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">completed</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Upcoming / Scheduled
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-accent">
            {classesReport?.summary?.scheduledCount ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">on calendar</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Curriculum Completion
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-foreground">
            {classesReport?.summary?.completionRatePercent ?? 0}%
          </span>
          <span className="text-xs text-muted-foreground">rate</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Total Attendees Logged
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-foreground">
            {classesReport?.summary?.totalAttendeesCount ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">check-ins</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Avg Class Size
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-foreground">
            {classesReport?.summary?.averageAttendancePerClass ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">athletes</span>
        </div>
      </div>
    </div>
  );
}
