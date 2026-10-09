import { Search, X } from "lucide-react";
import DateRangePicker from "./DateRangePicker";
import TableSort from "./TableSort";
import TableFilter from "./TableFilter";
import TableFilterDropdown from "./TableFilterDropdown";

export default function DataTableToolbar({
  title,
  icon: HeaderIcon,
  badge,
  actions,
  searchable = true,
  searchPlaceholder = "Search records...",
  searchQuery = "",
  onSearchChange,
  showDateFilter = false,
  activeDateRange,
  onDateRangeChange,
  sortOptions = [],
  activeSortBy = "",
  onSortChange,
  filterDropdown,
  filterOptions = [],
  activeFilter = "All",
  onFilterChange,
  filterMode = "pills",
  filterLabel = "Filter",
  compact = false,
  filterPosition = "right",
}) {
  const hasControls =
    searchable ||
    showDateFilter ||
    (filterOptions && filterOptions.length > 0) ||
    (sortOptions && sortOptions.length > 0) ||
    Boolean(filterDropdown);

  const hasFilterOptions = filterOptions && filterOptions.length > 0;
  const isFilterInline = filterPosition === "right" || filterPosition === "inline";

  return (
    <div className={`${compact ? "space-y-2" : "space-y-3"} shrink-0`}>
      {/* 1. Optional Header Banner */}
      {title && (
        <div className="shrink-0 flex items-center justify-between gap-3 bg-card border border-border px-4 py-3 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {HeaderIcon && (
              <span className="p-1.5 rounded-xl bg-accent text-background shrink-0">
                <HeaderIcon size={18} />
              </span>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight truncate">
                {title}
              </h2>
              {badge !== undefined && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent shrink-0">
                  {badge}
                </span>
              )}
            </div>
          </div>

          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}

      {/* 2. Controls Toolbar */}
      {hasControls && (
        <div className="space-y-2.5">
          {/* Main Controls Row: Search Bar (Left) + Filters / Utility Icons / Actions (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {searchable && (
              <div className="relative flex-1 max-w-sm sm:max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className={`w-full ${
                    compact ? "h-9 sm:h-9.5 text-xs sm:text-sm" : "h-10 sm:h-11 text-sm"
                  } pl-10 pr-9 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors shadow-2xs`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-auto">
              {/* Inline filter pills / dropdown on the right side after search bar */}
              {hasFilterOptions && isFilterInline && (
                <div className="overflow-x-auto no-scrollbar">
                  <TableFilter
                    options={filterOptions}
                    value={activeFilter}
                    onChange={onFilterChange}
                    mode={filterMode}
                    label={filterLabel}
                    compact={compact}
                  />
                </div>
              )}

              {showDateFilter && (
                <DateRangePicker
                  startDate={activeDateRange?.startDate}
                  endDate={activeDateRange?.endDate}
                  onChange={onDateRangeChange}
                  variant="icon"
                  compact={compact}
                />
              )}

              {sortOptions && sortOptions.length > 0 && (
                <TableSort
                  options={sortOptions}
                  value={activeSortBy}
                  onChange={onSortChange}
                  variant="icon"
                  compact={compact}
                />
              )}

              {filterDropdown && <TableFilterDropdown {...filterDropdown} />}

              {actions && !title && <div className="shrink-0">{actions}</div>}
            </div>
          </div>

          {/* Row 2: Only used if filterPosition === "bottom" */}
          {hasFilterOptions && !isFilterInline && (
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              <div className="flex-1 overflow-x-auto no-scrollbar min-w-0">
                <TableFilter
                  options={filterOptions}
                  value={activeFilter}
                  onChange={onFilterChange}
                  mode={filterMode}
                  label={filterLabel}
                  compact={compact}
                />
              </div>

              {actions && !title && <div className="shrink-0 ml-auto">{actions}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
