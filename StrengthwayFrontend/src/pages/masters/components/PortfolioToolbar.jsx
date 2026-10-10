import { Search, LayoutGrid, List, X } from "lucide-react";

export function PortfolioToolbar({
  statusFilter,
  setStatusFilter,
  stats,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  totalResults,
}) {
  const statusOptions = [
    { id: "ALL", label: "All Items" },
    { id: "Active", label: "Active" },
    { id: "Draft", label: "Draft" },
    { id: "Archived", label: "Archived" },
  ];

  return (
    <div className="shrink-0 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        {statusOptions.map((opt) => {
          const isSelected = statusFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setStatusFilter(opt.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                isSelected
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{opt.label}</span>
              {opt.id === "Archived" && stats?.archived > 0 && (
                <span className="rounded-full bg-destructive/20 border border-destructive/30 px-1.5 py-0.2 text-[10px] text-destructive font-extrabold">
                  {stats.archived}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Search Input & View Switcher */}
      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search assets, titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* View Switcher: Grid vs Table */}
        <div className="flex items-center border border-border rounded-xl p-0.5 bg-background shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-muted text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-muted text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Table View"
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
