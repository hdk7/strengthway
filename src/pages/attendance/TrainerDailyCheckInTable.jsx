/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  Users,
  LogIn,
  LogOut,
  Lock,
  ShieldCheck,
  XCircle,
  Repeat,
  Layers,
  CalendarOff,
} from "lucide-react";
import {
  isDateToday,
  isDatePast,
  isDateFuture,
  isTrainerAttendancePeriodExpired,
  checkTrainerScheduleAccess,
  getEffectiveTrainerStatus,
} from "./trainerAttendanceUtils";

export function TrainerDailyCheckInTable({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  handleMarkAllPresent,
  isBulkSubmitting,
  isLoadingDaily,
  filteredTrainers,
  paginatedTrainers,
  dailyRecordsMap = {},
  handleQuickCheckIn,
  handleQuickCheckOut,
  handleOpenSubstituteModal,
  onOpenViewModal,
  onOpenLeaveDrawer,
  batches = [],
  selectedDate,
}) {

  const isToday = isDateToday(selectedDate);
  const isPast = isDatePast(selectedDate);
  const isFuture = isDateFuture(selectedDate);

  // Check if at least one coach on roster is eligible to check in right now
  const canAnyCoachCheckIn = isToday && filteredTrainers.some((trainer) => {
    const record = dailyRecordsMap[trainer.id];
    if (record?.checkInTime) return false;
    const access = checkTrainerScheduleAccess(selectedDate, trainer, batches);
    return access.isAllowed;
  });

  const renderStatusBadge = (effectiveStatus) => {
    if (effectiveStatus === "PRESENT") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
          <ShieldCheck size={11} />
          <span>Present</span>
        </span>
      );
    }
    if (effectiveStatus === "ABSENT") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
          <XCircle size={11} />
          <span>Absent</span>
        </span>
      );
    }
    if (effectiveStatus === "SUBSTITUTE") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
          <Repeat size={11} />
          <span>Substitute</span>
        </span>
      );
    }
    if (effectiveStatus === "LEAVE") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
          <CalendarOff size={11} />
          <span>On Leave</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-border/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
        <span>Pending Check-in</span>
      </span>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
      {/* Action Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search faculty by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Filters: Retaining All, Present, Absent, Substitute, On Leave */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            {["ALL", "PRESENT", "ABSENT", "SUBSTITUTE", "LEAVE"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === f
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "ALL"
                  ? "All"
                  : f === "PRESENT"
                  ? "Present"
                  : f === "ABSENT"
                  ? "Absent"
                  : f === "SUBSTITUTE"
                  ? "Substitute"
                  : "On Leave"}
              </button>
            ))}
          </div>

          {/* Mark All Present: Only active for Today during open shifts */}
          {isToday && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={isBulkSubmitting || isLoadingDaily || !canAnyCoachCheckIn}
              title={
                !canAnyCoachCheckIn
                  ? "No coaches currently have an open check-in window"
                  : "Mark all eligible scheduled coaches as Present"
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-xs transition-all ${
                canAnyCoachCheckIn
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  : "bg-muted text-muted-foreground/60 border border-border cursor-not-allowed opacity-60"
              } disabled:opacity-50`}
            >
              <CheckCircle2 size={13} />
              <span>Mark All Present</span>
            </button>
          )}

          {isToday && (
            <span
              className={`text-[11px] font-semibold px-2 py-1 rounded-md border flex items-center gap-1 select-none ${
                canAnyCoachCheckIn
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/25"
              }`}
            >
              {canAnyCoachCheckIn ? <ShieldCheck size={11} /> : <Lock size={11} />}
              <span>
                {canAnyCoachCheckIn
                  ? "Shift Operations Active"
                  : "Shift Window Closed / Restricted"}
              </span>
            </span>
          )}

          {isPast && (
            <span className="text-[11px] font-semibold text-muted-foreground/80 px-2 py-1 rounded-md bg-muted/40 border border-border/50">
              Past Records (View Only)
            </span>
          )}

          {isFuture && (
            <span className="text-[11px] font-semibold text-muted-foreground/60 px-2 py-1 rounded-md bg-muted/30 border border-border/40 flex items-center gap-1">
              <Lock size={11} />
              <span>Locked Until Scheduled Date</span>
            </span>
          )}
        </div>
      </div>


      {/* Faculty Attendance Table */}
      {isLoadingDaily ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-8 text-center text-muted-foreground">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-accent border-r-transparent" />
          <p className="mt-2 text-xs font-semibold">Loading daily faculty roster…</p>
        </div>
      ) : filteredTrainers.length > 0 ? (
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar flex flex-col">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-card border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground shadow-xs">
              <tr>
                <th className="px-4 py-2.5 font-bold">Faculty Coach</th>
                <th className="px-4 py-2.5 font-bold">Assigned Schedule / Timings</th>
                <th className="px-4 py-2.5 font-bold">Check-In / Out Time</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {paginatedTrainers.map((trainer) => {
                const record = dailyRecordsMap[trainer.id];
                const hasCheckedIn = Boolean(record?.checkInTime);
                const hasCheckedOut = Boolean(record?.checkOutTime);
                const scheduleAccess = checkTrainerScheduleAccess(selectedDate, trainer, batches);
                const periodExpired = isTrainerAttendancePeriodExpired(selectedDate, trainer, batches);
                const effectiveStatus = getEffectiveTrainerStatus(
                  trainer,
                  record,
                  scheduleAccess,
                  isPast,
                  periodExpired
                );

                const assignedBatchObjects = (batches || []).filter((b) =>
                  Array.isArray(trainer.batchIds) && trainer.batchIds.includes(b.id)
                );

                return (
                  <tr
                    key={trainer.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {/* Faculty Coach Info */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase">
                          {trainer.name?.[0] || "T"}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/trainers-members/trainers/${trainer.id}`}
                            className="font-bold text-foreground hover:text-accent transition-colors block truncate"
                          >
                            {trainer.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <span>ID: {trainer.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Batches */}
                    <td className="px-4 py-2.5">
                      {assignedBatchObjects.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {assignedBatchObjects.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-muted/60 text-[9px] font-mono text-muted-foreground border border-border/50"
                            >
                              <Layers size={8} />
                              <span>{b.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No batches assigned</span>
                      )}
                    </td>

                    {/* Check-In / Out Timestamps */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {hasCheckedIn ? (
                        <div className="font-mono text-xs flex flex-col gap-0.5">
                          <span className="text-emerald-500 font-semibold flex items-center gap-1 text-[11px]">
                            <LogIn size={11} className="shrink-0" />
                            <span>In: {record.checkInTime}</span>
                          </span>
                          {hasCheckedOut && (
                            <span className="text-blue-400 font-semibold flex items-center gap-1 text-[11px]">
                              <LogOut size={11} className="shrink-0" />
                              <span>Out: {record.checkOutTime}</span>
                            </span>
                          )}
                        </div>
                      ) : effectiveStatus === "ABSENT" ? (
                        <span className="text-rose-400/80 font-mono text-[11px]">
                          Absent (No Check-In)
                        </span>
                      ) : effectiveStatus === "SUBSTITUTE" ? (
                        <span className="text-amber-400/90 font-mono text-[11px] flex items-center gap-1">
                          <Repeat size={10} />
                          <span>Substitute Stepped-In</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {renderStatusBadge(effectiveStatus)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-2">
          <Users size={32} className="mx-auto text-muted-foreground/60" />
          <h4 className="text-sm font-bold text-foreground">No Faculty Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No trainers matched the selected filter criteria for {selectedDate}.
          </p>
        </div>
      )}
    </div>
  );
}
