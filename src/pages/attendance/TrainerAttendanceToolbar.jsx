import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export function TrainerAttendanceToolbar({
  shiftOptions,
  selectedShift,
  setSelectedShift,
  viewMode,
  selectedDate,
  setSelectedDate,
  handlePrevDay,
  handleNextDay,
  selectedMonth,
  setSelectedMonth,
  formattedSelectedMonth,
}) {
  return (
    <div className="shrink-0 rounded-2xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Shift Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
          Faculty Shift:
        </span>
        {shiftOptions.map((shift) => (
          <button
            key={shift}
            type="button"
            onClick={() => setSelectedShift(shift)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              selectedShift === shift
                ? "bg-accent/15 text-accent border border-accent/25"
                : "border border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {shift}
          </button>
        ))}
      </div>

      {/* Date / Month Navigator */}
      {viewMode === "daily" ? (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex items-center gap-2 px-2.5">
              <Calendar size={14} className="text-accent" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border-0 bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          >
            Today
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-background p-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                const [y, m] = selectedMonth.split("-").map(Number);
                const d = new Date(y, m - 2, 1);
                setSelectedMonth(d.toISOString().slice(0, 7));
              }}
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="relative px-3">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                title="Select Month"
              />
              <span className="text-xs sm:text-sm font-black text-foreground font-mono cursor-pointer select-none">
                {formattedSelectedMonth}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const [y, m] = selectedMonth.split("-").map(Number);
                const d = new Date(y, m, 1);
                setSelectedMonth(d.toISOString().slice(0, 7));
              }}
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
            className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
          >
            Current Month
          </button>
        </div>
      )}
    </div>
  );
}
