import { CalendarCheck, Grid3X3, Download } from "lucide-react";

export function MemberAttendanceHeader({
  viewMode,
  setViewMode,
  handleExportMatrixCSV,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
      <div>
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
          Facility Operations • Athlete Turnout
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Members Attendance Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time daily session check-ins, automated flexible pass attendee routing, and full monthly attendance compliance matrices.
        </p>
      </div>

      {/* View Mode Toggle & Primary Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "daily"
                ? "bg-accent text-accent-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <CalendarCheck size={14} />
            <span>Daily Check-in</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "matrix"
                ? "bg-accent text-accent-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Grid3X3 size={14} />
            <span>Monthly Matrix</span>
          </button>
        </div>

        {viewMode === "matrix" && (
          <button
            type="button"
            onClick={handleExportMatrixCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all shadow-xs cursor-pointer hover:border-foreground/30"
          >
            <Download size={13} className="text-accent" />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
