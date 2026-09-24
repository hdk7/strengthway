import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import ThemeSelect from "../form/ThemeSelect";

/**
 * Universal Reusable Table Filter Options Popover Component
 * Supports multiple filter sections with dropdown selects.
 */
const TableFilterDropdown = ({
  sections = [],
  label = "FILTER",
  options = [
    { label: "All", value: "All" },
  ],
  value = "All",
  onChange,
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

  const activeSections =
    sections && sections.length > 0
      ? sections
      : [
          {
            key: "default",
            label,
            options,
            value,
            onChange,
          },
        ];

  const hasActiveFilter = activeSections.some(
    (sec) => sec.value && sec.value !== "All" && sec.value !== "All Locations"
  );

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Filter Options"
        className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-all cursor-pointer relative ${
          isOpen || hasActiveFilter
            ? "border-primary bg-primary/10 text-primary shadow-xs"
            : "border-border bg-card text-foreground hover:border-foreground/40"
        }`}
      >
        <SlidersHorizontal size={15} />
        {hasActiveFilter && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-card" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-60 p-4 rounded-3xl bg-card border border-border shadow-2xl space-y-3.5 animate-in fade-in duration-150">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            FILTER OPTIONS
          </div>

          <div className="space-y-3">
            {activeSections.map((section, sIdx) => {
              const secValue = section.value || "All";

              return (
                <div key={section.key || `sec-${sIdx}`} className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-foreground">
                    {section.label}
                  </label>

                  <ThemeSelect
                    value={secValue}
                    onChange={(val) => {
                      if (section.onChange) {
                        section.onChange(val);
                      }
                    }}
                    options={section.options}
                    triggerClassName="h-9 rounded-2xl border-border bg-card text-xs"
                    maxMenuHeight="max-h-48"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilterDropdown;
