import { Link } from "react-router-dom";
import {
  Layers,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
} from "lucide-react";

export function MemberAttendanceToolbar({
  selectedBatchId,
  setSelectedBatchId,
  batches,
  isLoadingBatches,
  currentBatch,
  viewMode,
  selectedDate,
  setSelectedDate,
  selectedDayOfWeek,
  handlePrevDay,
  handleNextDay,
  handleToday,
  loadDailyData,
  isLoadingDaily,
  selectedMonth,
  setSelectedMonth,
  formattedSelectedMonth,
  handlePrevMonth,
  handleNextMonth,
  loadMatrixData,
  isLoadingMatrix,
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
      {/* Batch Container Selector */}
      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <Layers size={16} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-tight">
            Active Batch
          </span>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={isLoadingBatches}
            className="mt-0.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.timingLabel || b.timing} • {b.daysLabel || b.daysPattern})
              </option>
            ))}
          </select>
        </div>

        {currentBatch && (
          <Link
            to={`/admin/batches/${currentBatch.id}`}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0 ml-1"
          >
            <span>Batch Details</span>
            <ExternalLink size={11} />
          </Link>
        )}
      </div>

      {/* Date Navigator (Daily Mode) or Month Navigator (Matrix Mode) */}
      {viewMode === "daily" ? (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <Calendar size={13} className="text-accent" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border-0 bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              />
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                {selectedDayOfWeek}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          >
            Today
          </button>

          <button
            type="button"
            onClick={loadDailyData}
            disabled={isLoadingDaily}
            className="rounded-xl border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Roster"
          >
            <RefreshCw size={14} className={isLoadingDaily ? "animate-spin text-accent" : ""} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="relative px-2.5">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                title="Select Month"
              />
              <span className="text-xs font-black text-foreground font-mono cursor-pointer select-none">
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

          <button
            type="button"
            onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          >
            Current Month
          </button>

          <button
            type="button"
            onClick={loadMatrixData}
            disabled={isLoadingMatrix}
            className="rounded-xl border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Grid"
          >
            <RefreshCw size={14} className={isLoadingMatrix ? "animate-spin text-accent" : ""} />
          </button>
        </div>
      )}
    </div>
  );
}
