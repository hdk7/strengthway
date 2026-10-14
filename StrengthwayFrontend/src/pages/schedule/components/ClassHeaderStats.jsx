import {
  Dumbbell,
  Plus,
  CheckCircle2,
  Search,
  Sparkles,
  CalendarDays,
  LayoutGrid,
  List,
} from "lucide-react";
import { isAdmin } from "@/auth/currentUser";

export function ClassHeaderStats({
  activeView = "library",
  setActiveView,
  viewMode = "table",
  setViewMode,
  onOpenCreate,
  stats = { total: 0, active: 0 },
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
  onSelectAll,
  isAllSelected = false,
  selectedCount = 0,
  hasClasses = false,
  onClearSelection,
}) {
  return (
    <div className="flex flex-col gap-2.5 shrink-0">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8.5 w-8.5 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-xs shrink-0">
              <Dumbbell size={18} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground font-display">
                Class Schedule & Library
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Manage reusable workout classes independently and map them to batch calendar schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {setActiveView && (
            <div className="flex items-center rounded-xl bg-muted p-1 border border-border text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setActiveView("library")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === "library"
                    ? "bg-card text-accent shadow-xs font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Dumbbell size={13} />
                <span>Class Library</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("month")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === "month"
                    ? "bg-card text-accent shadow-xs font-extrabold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays size={13} />
                <span>Month Calendar</span>
              </button>
            </div>
          )}

          {isAdmin() && (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 dark:bg-primary px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white dark:text-primary-foreground shadow-md hover:bg-blue-800 dark:hover:bg-primary/90 cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
            >
              <Plus size={16} />
              <span>Create Class</span>
            </button>
          )}
        </div>
      </div>

      {activeView === "library" && (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
            {/* KPI 1: Total Reusable Classes */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Classes
                </span>
                <Dumbbell size={16} className="text-accent" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-foreground">{stats.total}</span>
                <span className="text-[11px] text-muted-foreground">TSW curriculum workouts</span>
              </div>
            </div>

            {/* KPI 2: Active Classes */}
            <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Active Library
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-500">{stats.active}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Ready for batch assignment
                </span>
              </div>
            </div>
          </div>

          {/* Search, Filter Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-card p-2 sm:p-2.5 shadow-xs shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classes by name, workout..."
                className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            {/* Status Filter Controls & Select All */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-semibold">
                {["ALL", "ACTIVE", "ARCHIVED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-all cursor-pointer ${
                      selectedStatusFilter === status
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {isAdmin() && onSelectAll && hasClasses && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="text-xs font-bold text-blue-700 dark:text-primary hover:underline cursor-pointer transition-colors px-1 py-1"
                  >
                    Select All
                  </button>
                </div>
              )}

              {/* View Toggle (Grid / Table) */}
              {setViewMode && (
                <div className="flex items-center border border-border rounded-lg p-0.5 bg-background">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      viewMode === "table"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Table View"
                  >
                    <List size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
