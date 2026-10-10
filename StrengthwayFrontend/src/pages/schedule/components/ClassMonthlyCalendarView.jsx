import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Clock,
  Sparkles,
  RefreshCw,
  Dumbbell,
  ArrowLeftRight,
} from "lucide-react";
import { getClassCalendar } from "@/lib/classProgramService";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function ClassMonthlyCalendarView({
  batches = [],
  onOpenSessionDetail,
  onOpenAssign,
  onOpenSwap,
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedBatchId, setSelectedBatchId] = useState("ALL");
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadCalendarSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { month: monthStr };
      if (selectedBatchId !== "ALL") params.batchId = selectedBatchId;
      if (selectedDayFilter !== "ALL") params.dayOfWeek = selectedDayFilter;

      const data = await getClassCalendar(params);
      const sessionList = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setSessions(sessionList);
    } catch (err) {
      console.error("Failed to load calendar sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [monthStr, selectedBatchId, selectedDayFilter]);

  useEffect(() => {
    loadCalendarSessions();
  }, [loadCalendarSessions]);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate calendar grid days
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const numDays = lastDayOfMonth.getDate();

    // Monday is index 0 in our DAYS_OF_WEEK array (JS getDay(): 0 is Sunday, 1 is Monday... 6 is Saturday)
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex < 0) startDayIndex = 6; // Sunday becomes 6

    const cells = [];

    // Blank cells before the 1st
    for (let i = 0; i < startDayIndex; i++) {
      cells.push({ isCurrentMonth: false, dateStr: "", dayNumber: null });
    }

    // Days of current month
    const todayStr = new Date().toISOString().slice(0, 10);
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayDate = new Date(year, month, d);
      const dayOfWeekName = DAYS_OF_WEEK[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1];

      cells.push({
        isCurrentMonth: true,
        dateStr,
        dayNumber: d,
        dayOfWeek: dayOfWeekName,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month]);

  // Map sessions by date
  const sessionsByDate = useMemo(() => {
    const map = new Map();
    for (const s of sessions) {
      const d = s.sessionDate;
      if (!d) continue;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(s);
    }
    return map;
  }, [sessions]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: sessions.length,
      today: sessions.filter((s) => s.status === "TODAY").length,
      scheduled: sessions.filter((s) => s.status === "SCHEDULED").length,
      completed: sessions.filter((s) => s.status === "COMPLETED").length,
    };
  }, [sessions]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Month Toolbar & Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4 sm:p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary">
            <CalendarDays size={20} />
          </span>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-foreground">
              {monthLabel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Month-wise multi-batch scheduled classes matrix
            </p>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-primary hover:bg-blue-50 dark:hover:bg-primary/10 cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Filter Controls & Stats */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Batch Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground whitespace-nowrap">
              Batch:
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-muted-foreground whitespace-nowrap">
              Day:
            </label>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-blue-700 cursor-pointer"
            >
              <option value="ALL">All Days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadCalendarSessions}
            className="rounded-xl p-2 text-slate-400 hover:text-blue-700 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            title="Refresh Calendar"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Month Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            Scheduled Month Classes
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-foreground">
            {stats.total}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            Active Scheduled
          </span>
          <span className="text-xl font-extrabold text-blue-700 dark:text-primary">
            {stats.scheduled}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            Today Sessions
          </span>
          <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            {stats.today}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-3 shadow-2xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            Completed Classes
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Calendar Matrix Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card shadow-xs">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-border bg-slate-50/80 dark:bg-muted/40 text-center text-xs font-bold text-slate-700 dark:text-foreground">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2.5 px-1 truncate">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-border/60">
          {calendarCells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-28 bg-slate-50/40 dark:bg-muted/10 p-2"
                />
              );
            }

            const daySessions = sessionsByDate.get(cell.dateStr) || [];

            return (
              <div
                key={cell.dateStr}
                className={`min-h-28 p-2 flex flex-col justify-between transition-colors hover:bg-slate-50/60 dark:hover:bg-muted/20 ${
                  cell.isToday
                    ? "bg-blue-50/30 dark:bg-primary/5 ring-1 ring-inset ring-blue-500/30"
                    : "bg-white dark:bg-card"
                }`}
              >
                {/* Cell Header: Day Number & Count */}
                <div className="flex items-center justify-between pb-1">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      cell.isToday
                        ? "bg-blue-700 text-white dark:bg-primary dark:text-primary-foreground font-black"
                        : "text-slate-700 dark:text-foreground"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {daySessions.length > 0 && (
                    <span className="rounded-md bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary font-bold px-1.5 py-0.5 text-[10px]">
                      {daySessions.length} cls
                    </span>
                  )}
                </div>

                {/* Day Sessions List */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-24 pr-0.5 no-scrollbar">
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onOpenSessionDetail && onOpenSessionDetail(s)}
                      className="group/item rounded-lg border border-slate-200/80 dark:border-border/80 bg-white dark:bg-muted/40 p-1.5 hover:border-blue-600 dark:hover:border-primary shadow-2xs hover:shadow-xs cursor-pointer transition-all"
                      title={`${s.subject || s.className} (${s.batchName || s.batchId})`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-[11px] text-slate-900 dark:text-foreground truncate block group-hover/item:text-blue-700 dark:group-hover/item:text-primary">
                          {s.subject || s.className}
                        </span>
                        {s.classId && (
                          <span className="font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-muted px-1 rounded shrink-0">
                            {s.classId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-muted-foreground pt-0.5">
                        <span className="truncate max-w-[80px]">
                          {s.batchName || s.batchId}
                        </span>
                        <span className="font-semibold text-slate-400">
                          {s.timing ? s.timing.split("-")[0]?.trim() : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
