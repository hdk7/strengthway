import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { getClassCalendar } from "@/lib/classProgramService";
import { MonthPicker } from "@/components/ui/MonthPicker";

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

  // Handle month/year change from MonthPicker
  const handleMonthChange = (newYM) => {
    if (!newYM || !/^\d{4}-\d{2}$/.test(newYM)) return;
    const [y, m] = newYM.split("-").map(Number);
    setCurrentDate(new Date(y, m - 1, 1));
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

    // Trailing blank cells to complete the last week row
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ isCurrentMonth: false, dateStr: "", dayNumber: null });
      }
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
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5 overflow-hidden animate-in fade-in duration-150">
      {/* Month Toolbar & Controls - Fixed at top */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2.5 sm:p-3 shadow-xs lg:flex-row lg:items-center lg:justify-between shrink-0">
        {/* Month Navigator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
              <CalendarDays size={16} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground leading-tight">
                {monthLabel}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Month-wise multi-batch scheduled classes matrix
              </p>
            </div>
          </div>

          {/* Month & Year Picker with Previous & Next Month Navigation buttons */}
          <div className="flex items-center ml-0 sm:ml-2">
            <MonthPicker
              value={monthStr}
              onChange={handleMonthChange}
              align="left"
              showTodayButton={true}
            />
          </div>
        </div>

        {/* Filter Controls & Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Batch Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Batch:
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-foreground cursor-pointer"
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
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Day:
            </label>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:border-foreground cursor-pointer"
            >
              <option value="ALL">All Days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Month Summary KPI Bar - Fixed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-xs">
          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
            Scheduled Month Classes
          </span>
          <span className="text-lg font-extrabold text-foreground">
            {stats.total}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-xs">
          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
            Active Scheduled
          </span>
          <span className="text-lg font-extrabold text-accent">
            {stats.scheduled}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-xs">
          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
            Today Sessions
          </span>
          <span className="text-lg font-extrabold text-amber-500">
            {stats.today}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-xs">
          <span className="text-[10px] text-muted-foreground font-bold uppercase block">
            Completed Classes
          </span>
          <span className="text-lg font-extrabold text-emerald-500">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Calendar Matrix Grid - Fixed weekday header + vertically scrollable calendar weeks */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {/* Days of Week Header - Fixed in place */}
        <div className="shrink-0 grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-bold text-foreground z-10">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2 px-1 truncate">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Day Cells - Independently scrollable vertically */}
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-7 gap-px bg-border/60">
          {calendarCells.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-24 sm:min-h-28 bg-muted/10 p-1.5"
                />
              );
            }

            const daySessions = sessionsByDate.get(cell.dateStr) || [];

            return (
              <div
                key={cell.dateStr}
                className={`min-h-24 sm:min-h-28 p-1.5 flex flex-col justify-between transition-colors ${
                  cell.isToday
                    ? "bg-card ring-1 ring-inset ring-accent/40"
                    : "bg-card hover:bg-muted/30"
                }`}
              >
                {/* Cell Header: Day Number & Count */}
                <div className="flex items-center justify-between pb-1 shrink-0">
                  <span
                    className={`flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-full text-[11px] font-bold ${
                      cell.isToday
                        ? "bg-accent text-accent-foreground font-black"
                        : "text-foreground"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {daySessions.length > 0 && (
                    <span className="rounded bg-accent/10 text-accent font-bold px-1.5 py-0.2 text-[10px]">
                      {daySessions.length} cls
                    </span>
                  )}
                </div>

                {/* Day Sessions List */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-24 pr-0.5 no-scrollbar">
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onOpenSessionDetail && onOpenSessionDetail(s)}
                      className="group/item rounded border border-border/80 bg-background/80 p-1 hover:border-accent shadow-2xs hover:shadow-xs cursor-pointer transition-all"
                      title={`${s.subject || s.className} (${s.batchName || s.batchId})`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[10px] text-foreground truncate block group-hover/item:text-accent">
                          {s.subject || s.className}
                        </span>
                        {s.classId && (
                          <span className="font-mono text-[8px] text-muted-foreground bg-muted px-1 rounded shrink-0">
                            {s.classId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-0.5">
                        <span className="truncate max-w-[70px]">
                          {s.batchName || s.batchId}
                        </span>
                        <span className="font-medium text-muted-foreground">
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
