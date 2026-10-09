import { Link } from "react-router-dom";
import {
  BookOpen,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ClassReportStatsCards } from "./ClassReportStatsCards";

export function ClassesReportTab({
  classesReport,
  classSearch,
  setClassSearch,
  classBatchFilter,
  setClassBatchFilter,
  allBatchesList,
  isLoading,
  formatMonthTitle,
  selectedMonth,
  filteredClassesProgress,
  paginatedClassesProgress,
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Executive KPI Summary Cards */}
      <ClassReportStatsCards classesReport={classesReport} />

      {/* Filters & Search Control Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search batch or curriculum..."
              value={classSearch}
              onChange={(e) => setClassSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Batch Container Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">Batch:</span>
            <select
              value={classBatchFilter}
              onChange={(e) => setClassBatchFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {allBatchesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Curriculum Progression by Batch */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw size={18} className="animate-spin text-accent" />
              <span className="font-semibold text-xs">Loading curriculum milestones...</span>
            </div>
          </div>
        ) : filteredClassesProgress.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <BookOpen size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="font-bold text-foreground">
              No batch curriculum sessions found for {formatMonthTitle(selectedMonth)}
            </p>
            <p className="text-xs">Schedule sessions using the Calendar & Master Schedule generator.</p>
          </div>
        ) : (
          paginatedClassesProgress.map((bp) => {
            const pct = bp.completionPercentage || 0;
            return (
              <div
                key={bp.batchId}
                className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4 hover:border-foreground/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/admin/batches/${bp.batchId}`}
                      className="font-bold text-foreground hover:text-accent text-base flex items-center gap-1.5"
                    >
                      <span>{bp.batchName}</span>
                      <ExternalLink size={13} className="text-muted-foreground" />
                    </Link>
                    <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                      Standard 12-Class Curriculum Cycle
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                      pct >= 100
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    {pct}% Done
                  </span>
                </div>

                {/* Visual 12-Class Step Progress Indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>
                      Class {bp.completedCount} of {bp.totalCurriculumClasses} completed
                    </span>
                    <span className="font-mono text-foreground">
                      {bp.remainingClasses} remaining
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {Array.from({ length: bp.totalCurriculumClasses }).map((_, idx) => {
                      const isDone = idx < bp.completedCount;
                      const isNext = idx === bp.completedCount;
                      return (
                        <div
                          key={idx}
                          className={`h-2.5 rounded-sm transition-all ${
                            isDone
                              ? "bg-emerald-500"
                              : isNext
                              ? "bg-accent animate-pulse"
                              : "bg-muted"
                          }`}
                          title={`Class #${idx + 1} • ${isDone ? "Completed" : isNext ? "Next Session" : "Scheduled"}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Batch Stats Footer */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      Next Class Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {bp.nextClassDate || "Cycle Finished"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                      Avg Class Size
                    </span>
                    <span className="font-semibold text-foreground">
                      {bp.averageAttendance || 0} athletes
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
