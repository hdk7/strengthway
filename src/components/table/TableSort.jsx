import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import ThemeSelect from "../form/ThemeSelect";

/**
 * Universal Reusable Table Sort Dropdown Component
 *
 * Supports two variants:
 * - "icon" (default): Popover menu with "SORT BY" header, active indicator dot/pill.
 * - "select": Themed select dropdown.
 */
const TableSort = ({
  options = [
    { label: "Date (Newest)", value: "date-desc" },
    { label: "Date (Oldest)", value: "date-asc" },
    { label: "Name A–Z", value: "name-asc" },
    { label: "Name Z–A", value: "name-desc" },
  ],
  value = "date-desc",
  onChange,
  variant = "icon",
  compact = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  if (!options || options.length === 0) return null;

  const currentOption = options.find((opt) => opt.value === value) || options[0];

  // Variant A: Themed Select Dropdown
  if (variant === "select") {
    return (
      <div
        className={`flex items-center gap-1.5 text-xs text-foreground font-medium shrink-0 min-w-[150px] ${className}`}
      >
        <SlidersHorizontal size={13} className="text-primary shrink-0" />
        <ThemeSelect
          value={value}
          onChange={(val) => onChange && onChange(val)}
          options={options}
          triggerClassName={`${compact ? "h-8" : "h-9"} rounded-xl border-border bg-card text-xs`}
        />
      </div>
    );
  }

  // Variant B: Popover Menu
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Sort: ${currentOption?.label || "Sort records"}`}
        className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
          isOpen
            ? "border-primary bg-primary/10 text-primary shadow-xs"
            : "border-border bg-card text-foreground hover:border-foreground/40"
        }`}
      >
        <ArrowUpDown size={15} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-52 p-2 rounded-2xl bg-card border border-border shadow-2xl animate-in fade-in duration-150">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            SORT BY
          </div>

          <div className="space-y-0.5 mt-1">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange && onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-foreground hover:bg-muted font-medium"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableSort;
