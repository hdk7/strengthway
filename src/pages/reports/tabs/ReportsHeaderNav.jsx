import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Layers,
  Users,
  Award,
  CalendarCheck,
} from "lucide-react";

export function ReportsHeaderNav({
  selectedMonth,
  setSelectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleCurrentMonth,
  handleExportCsv,
  isExporting,
  isLoading,
  activeTab,
  setActiveTab,
  batchesReport,
  membersReport,
  trainersReport,
  classesReport,
}) {
  return (
    <>
      {/* ─── Top Header & Controls Bar ─────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
         
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground font-display">
            Analytics & Executive Reports
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground max-w-2xl">
            Detailed month-by-month auditing of batch occupancy, capacity headroom, athlete compliance, coach floor hours, and standard 12-class curriculum progression.
          </p>
        </div>

        {/* Global Controls: Month Picker & Export Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Navigator */}
          <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={13} className="text-accent shrink-0" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border-0 bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Current Month shortcut */}
          <button
            type="button"
            onClick={handleCurrentMonth}
            className="rounded-2xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          >
            Current
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-foreground px-3.5 py-1.5 text-xs font-bold text-background hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Download size={14} className="text-accent" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Dedicated Analytical Views Tab Switcher ─────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 p-1 rounded-2xl bg-muted/60 border border-border/80">
        {/* Tab 1: Batches */}
        <button
          type="button"
          onClick={() => setActiveTab("batches")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "batches"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Layers size={17} className={activeTab === "batches" ? "text-accent" : ""} />
          <span>Batch Reports</span>
          {batchesReport?.summary?.totalBatches ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent">
              {batchesReport.summary.totalBatches}
            </span>
          ) : null}
        </button>

        {/* Tab 2: Members */}
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "members"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Users size={17} className={activeTab === "members" ? "text-accent" : ""} />
          <span>Member Reports</span>
          {membersReport?.summary?.atRiskMembersCount > 0 ? (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
              {membersReport.summary.atRiskMembersCount} At-Risk
            </span>
          ) : null}
        </button>

        {/* Tab 3: Trainers */}
        <button
          type="button"
          onClick={() => setActiveTab("trainers")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "trainers"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <Award size={17} className={activeTab === "trainers" ? "text-accent" : ""} />
          <span>Trainer Reports</span>
          {trainersReport?.summary?.totalTrainers ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
              {trainersReport.summary.totalTrainers} Faculty
            </span>
          ) : null}
        </button>

        {/* Tab 4: Scheduled Classes */}
        <button
          type="button"
          onClick={() => setActiveTab("classes")}
          className={`flex items-center justify-center gap-2.5 rounded-2xl py-3 px-4 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "classes"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          }`}
        >
          <CalendarCheck size={17} className={activeTab === "classes" ? "text-accent" : ""} />
          <span>Class Progression</span>
          {classesReport?.summary?.completionRatePercent !== undefined ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              {classesReport.summary.completionRatePercent}% Done
            </span>
          ) : null}
        </button>
      </div>
    </>
  );
}
