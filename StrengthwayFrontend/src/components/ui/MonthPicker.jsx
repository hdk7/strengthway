import { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Pure integer-based month stepper — immune to UTC/timezone skews.
 *
 * @param {string} ymStr Format: "YYYY-MM"
 * @param {number} delta e.g. -1 or +1
 * @returns {string} Format: "YYYY-MM"
 */
export function stepMonth(ymStr, delta) {
  if (!ymStr || !/^\d{4}-\d{2}$/.test(ymStr)) {
    const now = new Date();
    ymStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  const [yearStr, monthStr] = ymStr.split("-");
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);

  const totalMonths = y * 12 + (m - 1) + delta;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;

  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

/**
 * Format "YYYY-MM" into a readable display string.
 *
 * @param {string} ymStr Format: "YYYY-MM"
 * @param {boolean} short
 * @returns {string} e.g. "April 2026" or "Apr 2026"
 */
export function formatYearMonth(ymStr, short = false) {
  if (!ymStr || !/^\d{4}-\d{2}$/.test(ymStr)) return ymStr || "";
  const [yearStr, monthStr] = ymStr.split("-");
  const mIndex = parseInt(monthStr, 10) - 1;
  const list = short ? MONTH_NAMES_SHORT : MONTH_NAMES_FULL;
  const name = list[mIndex] || monthStr;
  return `${name} ${yearStr}`;
}

export function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * MonthPicker Component
 *
 * A fully themed, timezone-safe Month Navigator and Popover Grid Selector.
 * Replaces unreliable native <input type="month"> with an interactive, accessible UI.
 */
export function MonthPicker({
  value,
  onChange,
  className = "",
  compact = false,
  showTodayButton = true,
  align = "right", // "left" | "right" | "center"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current value
  const currentYM = useMemo(() => {
    return value && /^\d{4}-\d{2}$/.test(value) ? value : getCurrentYearMonth();
  }, [value]);

  const [selectedYear, selectedMonthNum] = useMemo(() => {
    const [y, m] = currentYM.split("-").map(Number);
    return [y, m];
  }, [currentYM]);

  // View state inside popover (can browse years without changing value until month selected)
  const [viewYear, setViewYear] = useState(selectedYear);

  // Sync viewYear when popover opens
  useEffect(() => {
    if (isOpen) {
      setViewYear(selectedYear);
    }
  }, [isOpen, selectedYear]);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handlePrev = (e) => {
    e.stopPropagation();
    onChange(stepMonth(currentYM, -1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    onChange(stepMonth(currentYM, 1));
  };

  const handleSelectMonth = (monthIndex) => {
    const newYM = `${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    onChange(newYM);
    setIsOpen(false);
  };

  const handleJumpToCurrent = (e) => {
    e.stopPropagation();
    const todayYM = getCurrentYearMonth();
    onChange(todayYM);
    setViewYear(new Date().getFullYear());
    setIsOpen(false);
  };

  const todayYM = getCurrentYearMonth();
  const [todayY, todayM] = todayYM.split("-").map(Number);
  const isCurrentMonthActive = currentYM === todayYM;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Hidden native input for accessibility and test automation */}
      <input
        type="month"
        aria-label="Select month and year"
        value={currentYM}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="sr-only"
        tabIndex={-1}
      />

      {/* Control Bar Strip */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs transition-all">
        {/* Step Backward Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Formatted Label Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold font-mono transition-colors cursor-pointer select-none ${
            isOpen
              ? "bg-accent/15 text-accent"
              : "text-foreground hover:bg-muted/80"
          }`}
          title="Click to open month calendar picker"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Calendar size={13} className="text-accent shrink-0" />
          <span>{formatYearMonth(currentYM, compact)}</span>
          <ChevronDown
            size={12}
            className={`text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180 text-accent" : ""
            }`}
          />
        </button>

        {/* Step Forward Button */}
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight size={15} />
        </button>

        {/* Quick Current Month Button */}
        {showTodayButton && (
          <button
            type="button"
            onClick={handleJumpToCurrent}
            className={`hidden sm:inline-flex items-center gap-1 ml-0.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
              isCurrentMonthActive
                ? "border-accent/40 bg-accent/10 text-accent font-bold"
                : "border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Jump to Current Month"
          >
            <RotateCcw size={10} className={isCurrentMonthActive ? "text-accent" : "text-muted-foreground"} />
            <span>Today</span>
          </button>
        )}
      </div>

      {/* Popover Dropdown Grid */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Month selection popover"
          className={`absolute top-full mt-2 z-50 w-68 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
            align === "right"
              ? "right-0"
              : align === "center"
                ? "left-1/2 -translate-x-1/2"
                : "left-0"
          }`}
        >
          {/* Year Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-card border border-border/80 rounded-lg px-2 py-0.5 text-xs font-extrabold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent hover:bg-muted/50 transition-colors"
                aria-label="Select Year"
              >
                {Array.from({ length: 21 }, (_, i) => 2020 + i).map((y) => (
                  <option key={y} value={y} className="bg-card text-foreground">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 12-Month Interactive Grid (4 cols x 3 rows) */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES_SHORT.map((name, index) => {
              const isSelected =
                viewYear === selectedYear && index + 1 === selectedMonthNum;
              const isCurrentCalendarMonth =
                viewYear === todayY && index + 1 === todayM;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  className={`relative flex items-center justify-center rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-black shadow-xs scale-[1.02]"
                      : isCurrentCalendarMonth
                        ? "border border-accent/50 text-accent bg-accent/5 hover:bg-accent/15"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{name}</span>
                  {isCurrentCalendarMonth && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Popover Footer Strip */}
          <div className="mt-3.5 pt-2.5 border-t border-border/70 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleJumpToCurrent}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer text-[11px]"
            >
              <RotateCcw size={11} />
              <span>Current Month</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthPicker;
