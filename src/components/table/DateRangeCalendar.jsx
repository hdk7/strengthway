import { ChevronLeft, ChevronRight } from "lucide-react";
import ThemeSelect from "../form/ThemeSelect";
import {
  MONTH_NAMES,
  WEEKDAY_NAMES,
  YEAR_OPTIONS,
  getCalendarDays,
} from "./dateRangeUtils";

export default function DateRangeCalendar({
  viewYear,
  viewMonth,
  setViewYear,
  setViewMonth,
  tempStart,
  tempEnd,
  onDayClick,
}) {
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = getCalendarDays(viewYear, viewMonth);

  return (
    <div className="space-y-3">
      {/* Month & Year Navigation Bar */}
      <div className="flex items-center justify-between gap-1.5 px-0.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1.5 flex-1 justify-center">
          <div className="w-28">
            <ThemeSelect
              value={viewMonth}
              onChange={(val) => setViewMonth(Number(val))}
              options={MONTH_NAMES.map((name, idx) => ({
                value: idx,
                label: name,
              }))}
              triggerClassName="h-8 px-2 rounded-xl border-border bg-card text-xs font-semibold"
              maxMenuHeight="max-h-44"
            />
          </div>

          <div className="w-24">
            <ThemeSelect
              value={viewYear}
              onChange={(val) => setViewYear(Number(val))}
              options={YEAR_OPTIONS.map((yr) => ({
                value: yr,
                label: String(yr),
              }))}
              triggerClassName="h-8 px-2 rounded-xl border-border bg-card text-xs font-semibold"
              maxMenuHeight="max-h-44"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAY_NAMES.map((w) => (
          <span
            key={w}
            className="text-[11px] font-semibold text-muted-foreground py-1"
          >
            {w}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {calendarDays.map((day, idx) => {
          const isStart = tempStart === day.dateString;
          const isEnd = tempEnd === day.dateString;
          const inRange =
            tempStart &&
            tempEnd &&
            day.dateString > tempStart &&
            day.dateString < tempEnd;

          if (!day.isCurrentMonth) {
            return (
              <div
                key={`other-${idx}`}
                className="w-8 h-8 mx-auto flex items-center justify-center text-xs text-muted-foreground/30 select-none"
              >
                {day.dayNumber}
              </div>
            );
          }

          return (
            <button
              key={`day-${day.dateString}`}
              type="button"
              onClick={() => onDayClick(day.dateString, true)}
              className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                isStart || isEnd
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : inRange
                  ? "bg-primary/15 text-primary font-semibold rounded-none first:rounded-l-full last:rounded-r-full"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {day.dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
