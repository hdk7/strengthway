import { Search, LayoutGrid, List } from "lucide-react";

export function MembershipPlanToolbar({
  statusFilter,
  setStatusFilter,
  stats,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
}) {
  return (
    <div className="shrink-0 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        {["ALL", "Active", "Inactive", "Archived"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === s
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s === "ALL" ? "All Plans" : s}
            {s === "Archived" && stats.archived > 0 && (
              <span className="ml-1.5 rounded-full bg-destructive/20 border border-destructive/30 px-1.5 py-0.2 text-[10px] text-destructive font-extrabold">
                {stats.archived}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search plans, features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>

        <div className="flex items-center border border-border rounded-xl p-0.5 bg-background">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-muted text-foreground"
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
                ? "bg-muted text-foreground"
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
