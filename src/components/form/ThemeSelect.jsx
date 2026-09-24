import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Universal Themed Select / Dropdown component
 * Supports custom options [{ label, value }], trigger classes, and menu heights.
 */
export default function ThemeSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  triggerClassName = "",
  maxMenuHeight = "max-h-48",
  disabled = false,
  className = "",
}) {
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

  const currentOption = options.find((opt) => {
    const optVal = typeof opt === "object" ? opt.value : opt;
    return String(optVal) === String(value);
  });

  const displayLabel = currentOption
    ? typeof currentOption === "object"
      ? currentOption.label
      : currentOption
    : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 rounded-xl border border-border bg-card text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1 z-50 p-1 rounded-xl bg-card border border-border shadow-xl overflow-y-auto ${maxMenuHeight} animate-in fade-in duration-100`}
        >
          {options.map((opt, idx) => {
            const optVal = typeof opt === "object" ? opt.value : opt;
            const optLabel = typeof opt === "object" ? opt.label : opt;
            const isSelected = String(optVal) === String(value);

            return (
              <button
                key={`${optVal}-${idx}`}
                type="button"
                onClick={() => {
                  onChange && onChange(optVal);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="truncate">{optLabel}</span>
                {isSelected && <Check size={13} className="text-primary shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
