import { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  RotateCcw,
  X,
} from "lucide-react";
import { formatBoxDate } from "./dateRangeUtils";
import DateRangeCalendar from "./DateRangeCalendar";

/**
 * Universal Reusable Date Range Picker
 * Supports icon button or text trigger, dual From/To boxes, calendar range selection, and reset/apply.
 */
export default function DateRangePicker({
  startDate = "",
  endDate = "",
  onChange,
  placeholder = "Date Range",
  variant = "icon", // "icon" | "button"
  compact = true,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [selectingField, setSelectingField] = useState("start"); // "start" | "end"

  // Initial month/year navigation
  const initialDate = startDate ? new Date(startDate) : new Date(2026, 8, 1);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const containerRef = useRef(null);

  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    if (startDate) {
      const d = new Date(startDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hasRange = Boolean(startDate || endDate);

  const handleDayClick = (dateString, isCurrentMonth) => {
    if (!isCurrentMonth) return;

    if (selectingField === "start") {
      setTempStart(dateString);
      if (tempEnd && dateString > tempEnd) {
        setTempEnd("");
      }
      setSelectingField("end");
    } else {
      if (tempStart && dateString < tempStart) {
        setTempStart(dateString);
        setSelectingField("end");
      } else {
        setTempEnd(dateString);
      }
    }
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setTempStart("");
    setTempEnd("");
    setSelectingField("start");
    if (onChange) {
      onChange({ startDate: "", endDate: "" });
    }
  };

  const handleApply = () => {
    if (onChange) {
      onChange({ startDate: tempStart, endDate: tempEnd });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={hasRange ? `Date Range: ${tempStart} to ${tempEnd}` : "Filter by date range"}
          className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer relative ${
            isOpen || hasRange
              ? "border-primary bg-primary/10 text-primary shadow-xs"
              : "border-border bg-card text-foreground hover:border-foreground/40"
          }`}
        >
          <CalendarIcon size={15} />
          {hasRange && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-card" />
          )}
        </button>
      ) : (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 rounded-2xl border text-xs font-medium cursor-pointer transition-all ${
            compact ? "h-8 px-2.5" : "h-9 px-3"
          } ${
            hasRange
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:border-foreground/40"
          }`}
        >
          <CalendarIcon size={13} className="text-primary" />
          <span className="truncate max-w-44 font-semibold text-xs">
            {hasRange ? `${formatBoxDate(startDate)} → ${formatBoxDate(endDate)}` : placeholder}
          </span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </div>
      )}

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-76 sm:w-80 p-4 rounded-3xl bg-card border border-border shadow-2xl animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Select Date Range</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReset}
                title="Reset Date Range"
                className="w-7 h-7 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="w-7 h-7 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Dual FROM and TO Input Boxes */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <div
              onClick={() => setSelectingField("start")}
              className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                selectingField === "start"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                FROM
              </span>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                {formatBoxDate(tempStart)}
              </p>
            </div>

            <div
              onClick={() => setSelectingField("end")}
              className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                selectingField === "end"
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                TO
              </span>
              <p className="text-xs font-semibold text-foreground mt-0.5 truncate">
                {formatBoxDate(tempEnd)}
              </p>
            </div>
          </div>

          {/* Calendar Grid & Nav */}
          <div className="mt-3.5">
            <DateRangeCalendar
              viewYear={viewYear}
              viewMonth={viewMonth}
              setViewYear={setViewYear}
              setViewMonth={setViewMonth}
              tempStart={tempStart}
              tempEnd={tempEnd}
              onDayClick={handleDayClick}
            />
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full mt-4 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs tracking-wide shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
