import {
  Users,
  UserCheck,
  Dumbbell,
  Calendar,
  ChevronRight,
} from "lucide-react";

export default function BatchOverviewTab({
  monthTracking,
  currentPax,
  capacity,
  occupancyPercent,
  remainingSlots,
  filteredFlexInMembers = [],
  formattedMonthLabel,
  trainers = [],
  members = [],
  masterSchedule,
  currentBatchSessions = [],
  sessionTabCounts = {},
  onSelectTab,
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Faculty Trainers */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty Trainers</span>
            <UserCheck size={18} className="text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{trainers.length}</div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {(monthTracking?.category1_Trainers || []).reduce(
              (acc, t) => acc + (t.classesConducted || 0),
              0
            )}{" "}
            classes conducted in {formattedMonthLabel}
          </p>
        </div>

        {/* Card 3: Capacity & Utilization */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Capacity & Pax</span>
            <Dumbbell size={18} className="text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-foreground">
              {monthTracking?.summary?.effectiveCapacityPax ?? currentPax}
            </span>
            <span className="text-lg font-semibold text-muted-foreground">/ {capacity}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-emerald-400 truncate">
            {monthTracking?.summary?.capacityUtilizationRate ?? occupancyPercent}% utilized •{" "}
            {remainingSlots} spots free
          </p>
        </div>

        {/* Card 4: Scheduled Classes Progress */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Classes Progress</span>
            <Calendar size={18} className="text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-foreground">
              {monthTracking?.summary?.classesConductedInMonth ?? (sessionTabCounts.completed || 0)}
            </span>
            <span className="text-lg font-semibold text-muted-foreground">
              / {monthTracking?.summary?.classesScheduledInMonth ?? currentBatchSessions.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {monthTracking?.summary?.overallAttendanceRate ?? 0}% overall member attendance
          </p>
        </div>
      </div>

      {/* 3 Category Summary Preview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category A Preview: Trainers */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <UserCheck size={16} />
                </span>
                <h3 className="font-bold text-foreground text-sm">Trainers</h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                {trainers.length} Faculty
              </span>
            </div>

            {trainers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No coaches assigned to this batch slot.
              </p>
            ) : (
              <div className="space-y-2.5">
                {trainers.slice(0, 3).map((trn) => (
                  <div
                    key={trn.id}
                    className="flex items-center justify-between rounded-xl bg-muted/30 p-2.5 border border-border/50 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                        {trn.name?.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{trn.name}</p>
                        <p className="text-[11px] text-muted-foreground">{trn.experience || "Faculty"}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-background px-2 py-1 text-[11px] font-semibold text-emerald-400 shrink-0 border border-border">
                      {trn.classesConducted || 0} classes
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("trainers")}
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <span>Manage Faculty Coaches</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Category B Preview: Members & Flex Flow */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users size={16} />
                </span>
                <h3 className="font-bold text-foreground text-sm">Members</h3>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400">
                {members.length} Enrolled
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted/40 p-2.5 border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium">Primary Members</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{members.length}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5 border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium">Flex-In Attendees</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">{filteredFlexInMembers.length}</p>
              </div>
            </div>

            <div className="rounded-xl bg-background/50 border border-border p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Month Compliance Rate</span>
                <span className="font-bold text-emerald-400">
                  {monthTracking?.summary?.overallAttendanceRate ?? 0}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      monthTracking?.summary?.overallAttendanceRate ?? 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("members")}
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <span>Manage Members & Batch Transfers</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Category C Preview: Scheduled Classes */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Calendar size={16} />
                </span>
                <h3 className="font-bold text-foreground text-sm">Scheduled Classes</h3>
              </div>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-400">
                {currentBatchSessions.length} Sessions
              </span>
            </div>

            {masterSchedule ? (
              <div className="space-y-2.5">
                <div className="rounded-xl bg-muted/40 p-3 border border-border/70 space-y-1">
                  <p className="font-bold text-foreground text-xs">{masterSchedule.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Coach: {masterSchedule.coachName || "Faculty Coach"} • {masterSchedule.daysPattern || "MWF"}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Completed: <strong className="text-emerald-400">{sessionTabCounts.completed || 0}</strong></span>
                  <span>Today: <strong className="text-amber-400">{sessionTabCounts.today || 0}</strong></span>
                  <span>Upcoming: <strong className="text-foreground">{sessionTabCounts.upcoming || 0}</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No curriculum program currently assigned to this batch.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("classes")}
            className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <span>View Full Schedule & Sessions</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
