import { Link } from "react-router-dom";
import {
  Award,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export function TrainersReportTab({
  trainersReport,
  filteredTrainers,
  trainerSearch,
  setTrainerSearch,
  trainerShiftFilter,
  setTrainerShiftFilter,
  isLoading,
  formatMonthTitle,
  selectedMonth,
  paginatedTrainers,
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Active Coaches
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {trainersReport?.summary?.totalTrainers ?? filteredTrainers.length}
            </span>
            <span className="text-xs text-muted-foreground">faculty</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Classes Delivered
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {trainersReport?.summary?.totalClassesConducted ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">sessions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Floor Coaching Hours
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-accent">
              {trainersReport?.summary?.totalCoachingHours ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Athletes Coached
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {trainersReport?.summary?.totalAttendeesCoached ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">athlete visits</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Avg Class Size
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {trainersReport?.summary?.avgAttendanceAcrossTrainers ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">athletes/session</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search coach by name, phone, or email..."
              value={trainerSearch}
              onChange={(e) => setTrainerSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">Shift:</span>
            <select
              value={trainerShiftFilter}
              onChange={(e) => setTrainerShiftFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
              <option value="General">General Shift</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trainers Table */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4">Faculty Coach</th>
                <th className="py-3.5 px-4">Assigned Shift</th>
                <th className="py-3.5 px-4 text-center">Classes Conducted</th>
                <th className="py-3.5 px-4 text-center">Floor Coaching Hours</th>
                <th className="py-3.5 px-4 text-center">Athletes Reached</th>
                <th className="py-3.5 px-4 text-center">Avg Class Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-accent" />
                      <span className="font-semibold text-xs">Computing faculty coaching delivery for {formatMonthTitle(selectedMonth)}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Award size={32} className="mx-auto text-muted-foreground/50" />
                      <p className="font-bold text-foreground">No coaches found matching criteria</p>
                      <p className="text-xs">Try selecting a different shift or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTrainers.map((t) => (
                  <tr key={t.trainerId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-xs uppercase">
                          {t.name ? t.name.charAt(0) : "C"}
                        </div>
                        <div>
                          <Link
                            to={`/admin/trainers/${t.trainerId}`}
                            className="font-bold text-foreground hover:text-accent flex items-center gap-1.5"
                          >
                            <span>{t.name}</span>
                            <ExternalLink size={12} className="text-muted-foreground" />
                          </Link>
                          <span className="text-[11px] text-muted-foreground block font-mono">
                            {t.trainerId} • {t.phone || t.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {t.shift || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                      {t.classesConducted}
                      {t.classesScheduled > 0 && (
                        <span className="text-muted-foreground text-xs font-normal"> / {t.classesScheduled} sched</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-accent">
                      {t.coachingHours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                      {t.totalAttendeesCoached}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                      {t.avgClassAttendance} athletes
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
