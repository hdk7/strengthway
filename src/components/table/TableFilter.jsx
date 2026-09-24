import { useState, useRef, useEffect } from "react";
import { Filter, Check, ChevronDown, X } from "lucide-react";

/**
 * Universal Reusable Table Filter Component
 * Supports two modes:
 * - "pills" (default): Horizontal scrollable pill buttons
 * - "dropdown": Compact popover dropdown menu
 */
const TableFilter = ({
  options = [],
  value = "All",
  onChange,
  mode = "pills",
  label = "Filter",
  compact = true,
  className = "",
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!options || options.length === 0) return null;

  // ─── Mode A: Horizontal Filter Pills ─────────────────────────────────────────
  if (mode === "pills") {
    return (
      <div
        className={`flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar ${className}`}
      >
        {options.map((opt) => {
          const optVal = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? opt.label : opt;
          const optCount = typeof opt === "object" ? opt.count : undefined;
          const isSelected = value === optVal;

          return (
            <button
              type="button"
              key={optVal}
              onClick={() => onChange && onChange(optVal)}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border hover:bg-muted"
              }`}
            >
              <span>{optLabel}</span>
              {optCount !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {optCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Mode B: Compact Filter Dropdown Popover ──────────────────────────────────
  const isFiltered = value && value !== "All";

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
          compact ? "h-8 px-2.5" : "h-9 px-3"
        } ${
          isFiltered
            ? "border-primary bg-primary/10 text-primary font-semibold"
            : "border-border bg-card text-foreground hover:border-foreground/40"
        }`}
      >
        <Filter
          size={12}
          className={isFiltered ? "text-primary" : "text-muted-foreground"}
        />
        <span>{isFiltered ? `${label}: ${value}` : label}</span>
        {isFiltered ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange && onChange("All");
            }}
            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors ml-0.5"
          >
            <X size={10} />
          </button>
        ) : (
          <ChevronDown size={12} className="text-muted-foreground" />
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-1.5 z-50 w-48 p-1.5 rounded-2xl bg-card border border-border shadow-xl space-y-0.5 animate-in fade-in duration-150">
          {options.map((opt) => {
            const optVal = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const isSelected = value === optVal;

            return (
              <button
                type="button"
                key={optVal}
                onClick={() => {
                  onChange && onChange(optVal);
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && (
                  <Check size={12} className="text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TableFilter;
