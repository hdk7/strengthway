/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Check,
} from "lucide-react";

export function MembersReportTab({
  membersReport,
  filteredMembers,
  memberSearch,
  setMemberSearch,
  memberStatusFilter,
  setMemberStatusFilter,
  memberBatchFilter,
  setMemberBatchFilter,
  allBatchesList,
  isLoading,
  formatMonthTitle,
  selectedMonth,
  paginatedMembers,
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Tracked Athletes
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {membersReport?.summary?.totalMembers ?? filteredMembers.length}
            </span>
            <span className="text-xs text-muted-foreground">rostered</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Average Compliance
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {membersReport?.summary?.averageAttendanceRate ?? 0}%
            </span>
            <span className="text-xs text-muted-foreground">monthly turnout</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-destructive/5 p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-destructive block">
            At-Risk Athletes (&lt; 60%)
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-destructive">
              {membersReport?.summary?.atRiskMembersCount ?? 0}
            </span>
            <span className="text-xs font-semibold text-destructive/80">requires outreach</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Flex Pass Athletes
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-accent">
              {membersReport?.summary?.flexPassUsersCount ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">roster swaps</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search athlete by name, email, or member ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Status / Risk Quick Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">Compliance:</span>
            <select
              value={memberStatusFilter}
              onChange={(e) => setMemberStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Athletes</option>
              <option value="AT_RISK">🚨 At-Risk Only (&lt; 60%)</option>
              <option value="COMPLIANT">✓ Compliant (≥ 60%)</option>
              <option value="FLEX">Flex Pass Athletes</option>
            </select>
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">Batch:</span>
            <select
              value={memberBatchFilter}
              onChange={(e) => setMemberBatchFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {allBatchesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4">Athlete</th>
                <th className="py-3.5 px-4">Primary Batch</th>
                <th className="py-3.5 px-4 text-center">Sessions Logged</th>
                <th className="py-3.5 px-4 text-center">Present (Primary vs Flex)</th>
                <th className="py-3.5 px-4 text-center">Absences</th>
                <th className="py-3.5 px-4 text-center">Attendance %</th>
                <th className="py-3.5 px-4 text-center">Retention Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-accent" />
                      <span className="font-semibold text-xs">Computing member attendance compliance for {formatMonthTitle(selectedMonth)}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Users size={32} className="mx-auto text-muted-foreground/50" />
                      <p className="font-bold text-foreground">No athletes found matching criteria</p>
                      <p className="text-xs">Adjust compliance filter or search keywords.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const primaryPresent = m.primaryPresentCount ?? Math.max(0, m.presentCount - (m.flexCount || 0));
                  return (
                    <tr key={m.memberId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent font-bold text-xs uppercase">
                            {m.name ? m.name.charAt(0) : "M"}
                          </div>
                          <div>
                            <Link
                              to={`/admin/members/${m.memberId}`}
                              className="font-bold text-foreground hover:text-accent flex items-center gap-1.5"
                            >
                              <span>{m.name}</span>
                              <ExternalLink size={12} className="text-muted-foreground" />
                            </Link>
                            <span className="text-[11px] text-muted-foreground block font-mono">
                              {m.memberId} • {m.mobile || m.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-foreground block">{m.batchName || "Unassigned"}</span>
                        {m.batchTiming && (
                          <span className="text-xs text-muted-foreground block">{m.batchTiming}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {m.totalLoggedSessions}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {primaryPresent} primary
                          </span>
                          {m.flexCount > 0 && (
                            <span className="rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-extrabold text-accent">
                              +{m.flexCount} flex
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-destructive">
                        {m.absentCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-24 mx-auto space-y-1">
                          <span
                            className={`text-xs font-black ${
                              m.attendanceRate >= 80
                                ? "text-emerald-600 dark:text-emerald-400"
                                : m.attendanceRate >= 60
                                ? "text-accent"
                                : "text-destructive"
                            }`}
                          >
                            {m.attendanceRate}%
                          </span>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.attendanceRate >= 80
                                ? "bg-emerald-500"
                                : m.attendanceRate >= 60
                                ? "bg-amber-500"
                                : "bg-destructive"
                              }`}
                              style={{ width: `${m.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {m.isAtRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-[11px] font-extrabold text-destructive animate-pulse">
                            <AlertTriangle size={12} />
                            <span>Needs Outreach</span>
                          </span>
                        ) : m.totalLoggedSessions > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Check size={12} />
                            <span>On Track</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium">No Sessions</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
