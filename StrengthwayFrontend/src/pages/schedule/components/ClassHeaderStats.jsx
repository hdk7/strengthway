import {
  Dumbbell,
  Plus,
  CheckCircle2,
  Search,
  Sparkles,
  CalendarDays,
  Clock,
} from "lucide-react";

export function ClassHeaderStats({
  activeView = "library",
  setActiveView,
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-primary/10 text-blue-700 dark:text-primary shadow-xs shrink-0">
              <Dumbbell size={22} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-foreground">
                Class Schedule & Library
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-muted-foreground">
                Manage reusable workout classes independently and map them to batch calendar schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {setActiveView && (
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-muted p-1 border border-slate-200/80 dark:border-border text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setActiveView("library")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === "library"
                    ? "bg-white dark:bg-card text-blue-700 dark:text-primary shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                }`}
              >
                <Dumbbell size={14} />
                <span>Class Library</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("month")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === "month"
                    ? "bg-white dark:bg-card text-blue-700 dark:text-primary shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                }`}
              >
                <CalendarDays size={14} />
                <span>Month Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("daily")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeView === "daily"
                    ? "bg-white dark:bg-card text-blue-700 dark:text-primary shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground"
                }`}
              >
                <Clock size={14} />
                <span>Daily Schedule</span>
              </button>
            </div>
          )}

          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 dark:bg-primary px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white dark:text-primary-foreground shadow-md hover:bg-blue-800 dark:hover:bg-primary/90 cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Create Class</span>
          </button>
        </div>
      </div>

      {activeView === "library" && (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* KPI 1: Total Reusable Classes */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Total Classes
                </span>
                <Dumbbell size={18} className="text-blue-700 dark:text-primary" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-foreground">
                {stats.total}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 dark:text-muted-foreground">
                TSW curriculum workouts
              </div>
            </div>

            {/* KPI 2: Active Classes */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Active Library
                </span>
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.active}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 dark:text-muted-foreground">
                Ready for batch assignment
              </div>
            </div>
          </div>

          {/* Search, Filter Action Banner */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classes by name, beginner or intermediate workout..."
                className="w-full rounded-xl border border-slate-200 dark:border-border bg-slate-50/60 dark:bg-muted/40 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-700 dark:focus:border-primary focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Status Filter Controls & Select All */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-muted p-1 border border-slate-200/70 dark:border-border/70 text-xs font-semibold">
                {["ALL", "ACTIVE", "ARCHIVED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                      selectedStatusFilter === status
                        ? "bg-white dark:bg-card text-slate-900 dark:text-foreground shadow-xs font-bold"
                        : "text-slate-500 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {onSelectAll && hasClasses && (
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
