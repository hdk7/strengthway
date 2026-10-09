import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Dumbbell,
  Boxes,
  Search,
  Filter,
} from "lucide-react";

export function ScheduleHeaderStats({
  onOpenCreate,
  stats,
  searchQuery,
  setSearchQuery,
  selectedStatusFilter,
  setSelectedStatusFilter,
}) {
  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays size={20} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Class Schedule
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Create reusable Scheduled Class Programs and assign a single program to multiple batches
            with separate batch-wise tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-background shadow-md transition-all hover:bg-primary/90 cursor-pointer active:scale-95"
          >
            <Plus size={18} />
            <span>Create Reusable Program</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Reusable Programs
            </span>
            <CalendarDays size={18} className="text-primary" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Curriculum programs</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Programs</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-500">
            {stats.active}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Running on floor</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Classes</span>
            <Dumbbell size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.totalClasses}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Syllabus units</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Batches Running</span>
            <Boxes size={18} className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.coveredBatches}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Assigned batches</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search programs by name or assigned batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9.5 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={14} />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchQuery || selectedStatusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatusFilter("ALL");
              }}
              className="rounded-xl border border-border/80 px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Reset filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </>
  );
}
