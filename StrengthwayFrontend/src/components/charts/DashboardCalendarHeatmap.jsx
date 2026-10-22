import { useState, useMemo } from "react";

/**
 * DashboardCalendarHeatmap
 *
 * Renders an interactive calendar matrix for a specific month (1-12) and year.
 * Highlights attendance activity per day:
 * - 'present': Emerald
 * - 'absent': Rose / Red
 * - 'leave': Amber (Approved Leave)
 * - 'holiday': Blue / Sky
 * - 'scheduled': Slate / Muted
 *
 * @param {Object} props
 * @param {number} props.year
 * @param {number} props.month (1-12)
 * @param {Array<{ date: string, status: string, checkIn?: string, checkOut?: string, hours?: number, note?: string }>} props.records
 */
export default function DashboardCalendarHeatmap({
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  records = [],
}) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Map records by YYYY-MM-DD
  const recordMap = useMemo(() => {
    const map = new Map();
    for (const rec of records) {
      if (!rec?.date) continue;
      const key = rec.date.slice(0, 10);
      map.set(key, rec);
    }
    return map;
  }, [records]);

  // Calendar matrix calculations
  const { daysInMonth, firstDayOfWeek, monthName } = useMemo(() => {
    const d = new Date(year, month - 1, 1);
    const mName = d.toLocaleString("en-US", { month: "long" });
    const firstDay = d.getDay(); // 0 is Sunday
    const numDays = new Date(year, month, 0).getDate();
    return {
      daysInMonth: numDays,
      firstDayOfWeek: firstDay,
      monthName: mName,
    };
  }, [year, month]);

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Build grid slots
  const slots = useMemo(() => {
    const list = [];
    // leading blanks
    for (let i = 0; i < firstDayOfWeek; i++) {
      list.push({ isBlank: true, key: `blank-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const rec = recordMap.get(dateStr);
      list.push({
        isBlank: false,
        day,
        dateStr,
        record: rec,
        key: dateStr,
      });
    }
    return list;
  }, [firstDayOfWeek, daysInMonth, year, month, recordMap]);

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "present":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30";
      case "absent":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30";
      case "leave":
      case "approved_leave":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30";
      case "holiday":
        return "bg-sky-500/20 text-sky-400 border-sky-500/40 hover:bg-sky-500/30";
      case "scheduled":
        return "bg-muted/40 text-muted-foreground border-border/50";
      default:
        return "bg-muted/15 text-muted-foreground/60 border-transparent hover:border-border/60 hover:bg-muted/30";
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-3">
      {/* Calendar Header with Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground">
          {monthName} {year}
        </span>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Leave
          </span>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1 border-b border-border/50">
        {weekdays.map((w, i) => (
          <div key={i} className={i === 0 ? "text-terracotta" : ""}>
            {w}
          </div>
        ))}
      </div>

      {/* Day Slots */}
      <div className="grid grid-cols-7 gap-1.5">
        {slots.map((slot) => {
          if (slot.isBlank) {
            return <div key={slot.key} className="h-8 rounded-lg" />;
          }

          const isToday = slot.dateStr === todayStr;
          const status = slot.record?.status;
          const colorClass = getStatusColor(status);
          const isSelected = selectedDay?.dateStr === slot.dateStr;

          return (
            <button
              type="button"
              key={slot.key}
              onClick={() => setSelectedDay(isSelected ? null : slot)}
              className={`relative h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all duration-150 ${colorClass} ${
                isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
              } ${isToday ? "border-primary font-black" : ""}`}
              title={`${slot.dateStr}${status ? `: ${status}` : ""}`}
            >
              <span>{slot.day}</span>
              {status && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    status === "present"
                      ? "bg-emerald-400"
                      : status === "absent"
                      ? "bg-rose-400"
                      : status.includes("leave")
                      ? "bg-amber-400"
                      : "bg-sky-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day flyout drawer */}
      {selectedDay && (
        <div className="mt-2 p-3 rounded-xl border border-border/80 bg-muted/40 backdrop-blur text-xs flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">
              {new Date(selectedDay.dateStr).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedDay.record?.status === "present"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : selectedDay.record?.status === "absent"
                  ? "bg-rose-500/20 text-rose-400"
                  : selectedDay.record?.status?.includes("leave")
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {selectedDay.record?.status || "No Log"}
            </span>
          </div>

          {selectedDay.record ? (
            <div className="grid grid-cols-2 gap-2 mt-1 text-[11px] text-muted-foreground">
              {selectedDay.record.checkIn && (
                <div>
                  <span className="text-foreground/70">Check-in: </span>
                  <span className="font-semibold text-foreground">
                    {selectedDay.record.checkIn}
                  </span>
                </div>
              )}
              {selectedDay.record.checkOut && (
                <div>
                  <span className="text-foreground/70">Check-out: </span>
                  <span className="font-semibold text-foreground">
                    {selectedDay.record.checkOut}
                  </span>
                </div>
              )}
              {selectedDay.record.hours !== undefined && (
                <div>
                  <span className="text-foreground/70">Coaching Hours: </span>
                  <span className="font-semibold text-foreground">
                    {selectedDay.record.hours} hrs
                  </span>
                </div>
              )}
              {selectedDay.record.note && (
                <div className="col-span-2 text-foreground/80 italic">
                  "{selectedDay.record.note}"
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No session attendance punches recorded for this date.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
