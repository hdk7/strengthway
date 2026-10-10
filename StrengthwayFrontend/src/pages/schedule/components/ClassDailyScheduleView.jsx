import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Users,
  MapPin,
  Dumbbell,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  Layers,
  AlertCircle,
} from "lucide-react";
import { getClassCalendar } from "@/lib/classProgramService";

export function ClassDailyScheduleView({
  batches = [],
  onOpenSessionDetail,
  onOpenSwap,
  onOpenAssign,
}) {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedBatchId, setSelectedBatchId] = useState("ALL");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDailySessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { date: selectedDate };
      if (selectedBatchId !== "ALL") params.batchId = selectedBatchId;

      const data = await getClassCalendar(params);
      const sessionList = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setSessions(sessionList);
    } catch (err) {
      console.error("Failed to load daily sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedBatchId]);

  useEffect(() => {
    loadDailySessions();
  }, [loadDailySessions]);

  // Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Human date string
  const dateObj = new Date(selectedDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : selectedDate;

  const dayOfWeekName = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", { weekday: "long" })
    : "";

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Date-wise Controls Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-primary/10 text-indigo-700 dark:text-primary">
            <Calendar size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-foreground">
                {formattedDate}
              </h2>
              {dayOfWeekName && (
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-0.5 text-xs">
                  {dayOfWeekName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              Date-wise and day-wise floor classes schedule
            </p>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={handlePrevDay}
              className="rounded-lg p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
              title="Previous Day"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-primary hover:bg-indigo-50 dark:hover:bg-primary/10 cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="rounded-lg p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
              title="Next Day"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Date Input & Batch Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-indigo-600 cursor-pointer"
          />

          <div className="flex items-center gap-1.5">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.shortName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadDailySessions}
            className="rounded-xl p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-muted cursor-pointer transition-colors"
            title="Refresh Day Schedule"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Daily Sessions Cards */}
      {loading ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card text-slate-500">
          <RefreshCw size={24} className="animate-spin text-indigo-600 dark:text-primary" />
          <span className="text-xs font-semibold">Loading daily classes schedule…</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-border bg-white dark:bg-card p-6 text-center">
          <Calendar size={32} className="text-slate-300 dark:text-muted-foreground" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-foreground">
              No Classes Scheduled for {formattedDate}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
              None of the operational batches have sessions scheduled for this date.
              Use the Assign Classes modal to schedule curriculum slots.
            </p>
          </div>
          {onOpenAssign && (
            <button
              type="button"
              onClick={onOpenAssign}
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-indigo-700 dark:bg-primary px-3.5 py-1.5 text-xs font-bold text-white dark:text-primary-foreground hover:bg-indigo-800 cursor-pointer shadow-xs"
            >
              <Layers size={13} />
              <span>Assign Classes to Batches</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4.5 shadow-xs hover:border-indigo-300 dark:hover:border-primary/60 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Card Header: Batch & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-indigo-700 dark:text-primary bg-indigo-50 dark:bg-primary/10 px-2.5 py-1 rounded-lg">
                      {s.batchName || s.batchId}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Clock size={12} />
                      <span>{s.timing}</span>
                    </span>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      s.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : s.status === "TODAY"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                    }`}
                  >
                    {s.status || "SCHEDULED"}
                  </span>
                </div>

                {/* Class Title & ID */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-foreground">
                      {s.subject || s.className}
                    </h3>
                    {s.classId && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-muted px-1.5 py-0.5 rounded">
                        {s.classId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                    Coach: <strong>{s.coachName || "Coach"}</strong> • Studio:{" "}
                    <strong>{s.roomName || s.room || "Studio 1"}</strong>
                  </p>
                </div>

                {/* Workout Routines */}
                <div className="space-y-2 pt-1">
                  {s.beginnerWorkouts && s.beginnerWorkouts !== "Not specified" && (
                    <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/15 p-2.5 text-xs space-y-0.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] uppercase tracking-wider">
                        Beginner Routine
                      </span>
                      <p className="text-slate-700 dark:text-foreground leading-relaxed line-clamp-3">
                        {s.beginnerWorkouts}
                      </p>
                    </div>
                  )}

                  {s.intermediateWorkouts && s.intermediateWorkouts !== "Not specified" && (
                    <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/15 p-2.5 text-xs space-y-0.5">
                      <span className="font-bold text-blue-700 dark:text-primary block text-[11px] uppercase tracking-wider">
                        Intermediate Routine
                      </span>
                      <p className="text-slate-800 dark:text-foreground leading-relaxed line-clamp-3">
                        {s.intermediateWorkouts}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-border/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Users size={12} />
                  <span>{s.attendeesCount ?? 0} Pax</span>
                </span>

                <div className="flex items-center gap-2">
                  {onOpenSwap && s.status !== "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => onOpenSwap(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors"
                      title="Swap this class with another date"
                    >
                      <ArrowLeftRight size={11} />
                      <span>Swap</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenSessionDetail && onOpenSessionDetail(s)}
                    className="rounded-lg border border-slate-200 dark:border-border px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-foreground hover:bg-slate-50 dark:hover:bg-muted cursor-pointer transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
