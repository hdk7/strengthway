/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  Users,
  LogIn,
  LogOut,
  Eye,
  Lock,
  ShieldCheck,
  XCircle,
  Sparkles,
  ArrowRightLeft,
} from "lucide-react";
import {
  isDateToday,
  isDatePast,
  isDateFuture,
  isAttendancePeriodExpired,
  checkBatchScheduleAccess,
} from "./memberAttendanceUtils";

export function MemberDailyCheckInTable({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  handleMarkAllPresent,
  isBulkSubmitting,
  isLoadingDaily,
  filteredAttendees,
  paginatedAttendees,
  dailyRecordsMap,
  handleQuickCheckIn,
  handleQuickCheckOut,
  onOpenViewModal,
  currentBatch,
  batches,
  selectedDate,
}) {
  const isToday = isDateToday(selectedDate);
  const isPast = isDatePast(selectedDate);
  const isFuture = isDateFuture(selectedDate);
  const periodExpired = isAttendancePeriodExpired(selectedDate, currentBatch);
  const currentBatchAccess = checkBatchScheduleAccess(selectedDate, currentBatch);

  const getEffectiveStatus = (attendee, scheduleAccess) => {
    const record = dailyRecordsMap[attendee.memberId];
    if (record?.checkInTime || record?.status === "PRESENT") {
      return "PRESENT";
    }
    const isRestrictedOrExpired =
      isPast ||
      periodExpired ||
      (scheduleAccess && !scheduleAccess.isScheduledDay) ||
      (scheduleAccess && scheduleAccess.isAfterEnd);
    if (record?.status === "ABSENT" || isRestrictedOrExpired) {
      return "ABSENT";
    }
    return "PENDING";
  };

  const renderStatusBadge = (effectiveStatus, hasCheckedOut) => {
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
              placeholder="Search athlete by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Filters: Retaining only All, Present, Absent */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            {["ALL", "PRESENT", "ABSENT"].map((f) => (
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
                {f === "ALL" ? "All" : f === "PRESENT" ? "Present" : "Absent"}
              </button>
            ))}
          </div>

          {/* Mark All Present: Only active for Today during open batch schedule */}
          {isToday && (
            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={isBulkSubmitting || isLoadingDaily || !currentBatchAccess.isAllowed}
              title={
                !currentBatchAccess.isAllowed
                  ? currentBatchAccess.reason
                  : "Mark All Present for current batch session"
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-xs transition-all ${
                currentBatchAccess.isAllowed
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
                currentBatchAccess.isAllowed
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/25"
              }`}
              title={currentBatchAccess.reason}
            >
              {!currentBatchAccess.isAllowed ? <Lock size={11} /> : <ShieldCheck size={11} />}
              <span>
                {!currentBatchAccess.isScheduledDay
                  ? `Restricted • Non-Batch Day (${currentBatchAccess.dayOfWeek || "Today"})`
                  : currentBatchAccess.isBeforeStart
                  ? `Restricted • Opens at ${currentBatchAccess.startTime}`
                  : currentBatchAccess.isAfterEnd
                  ? `Restricted • Closed at ${currentBatchAccess.endTime}`
                  : `Schedule Open • ${currentBatchAccess.timingLabel}`}
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

      {/* Attendee Roster Table */}
      {isLoadingDaily ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-8 text-center text-muted-foreground">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-accent border-r-transparent" />
          <p className="mt-2 text-xs font-semibold">Loading daily session roster…</p>
        </div>
      ) : filteredAttendees.length > 0 ? (
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar flex flex-col">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-card border-b border-border/80 text-[10px] uppercase tracking-wider text-muted-foreground shadow-xs">
              <tr>
                <th className="px-4 py-2.5 font-bold">Athlete</th>
                <th className="px-4 py-2.5 font-bold">Check-In / Out Time</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold text-center min-w-40">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {paginatedAttendees.map((attendee) => {
                const record = dailyRecordsMap[attendee.memberId];
                const hasCheckedIn = Boolean(record?.checkInTime);
                const hasCheckedOut = Boolean(record?.checkOutTime);
                const attendeeBatch =
                  (attendee.batchId && batches?.find((b) => b.id === attendee.batchId)) ||
                  currentBatch;
                const scheduleAccess = checkBatchScheduleAccess(selectedDate, attendeeBatch);
                const effectiveStatus = getEffectiveStatus(attendee, scheduleAccess);

                return (
                  <tr
                    key={attendee.memberId}
                    className={`hover:bg-muted/20 transition-colors ${
                      attendee.isFlexOut ? "opacity-60 bg-muted/10" : ""
                    }`}
                  >
                    {/* Athlete Info */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase">
                          {attendee.name?.[0] || "A"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/admin/trainers-members/members/${attendee.memberId}`}
                              className="font-bold text-foreground hover:text-accent transition-colors block truncate"
                            >
                              {attendee.name}
                            </Link>
                            {attendee.isFlexIn && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-400">
                                <Sparkles size={9} />
                                <span>Flex-In</span>
                              </span>
                            )}
                            {attendee.isFlexOut && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 text-[9px] font-bold text-purple-400">
                                <ArrowRightLeft size={9} />
                                <span>Flexed Out</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <span>{attendee.memberId}</span>
                            {attendee.mobile && <span>• {attendee.mobile}</span>}
                          </div>
                        </div>
                      </div>
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
                      ) : (
                        <span className="text-muted-foreground font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {renderStatusBadge(effectiveStatus, hasCheckedOut)}
                    </td>

                    {/* Action Column: Retain ONLY Check In and Check Out, governed by schedule */}
                    <td className="px-4 py-2.5 text-center">
                      {attendee.isFlexOut ? (
                        <span className="text-xs font-semibold text-muted-foreground italic">
                          Handled at target batch
                        </span>
                      ) : isPast ? (
                        /* Past Records: Retain only View action */
                        <div className="inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenViewModal(attendee, {
                                ...record,
                                status: effectiveStatus,
                                memberId: attendee.memberId,
                                memberName: attendee.name,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted hover:border-accent/40 transition-all cursor-pointer shadow-xs"
                            title="View past attendance record"
                          >
                            <Eye size={12} className="text-accent" />
                            <span>View</span>
                          </button>
                        </div>
                      ) : isFuture ? (
                        /* Future Records: Disabled until scheduled date, not accessible through View */
                        <div className="inline-flex items-center justify-center gap-1 text-muted-foreground/60 select-none">
                          <Lock size={12} className="text-muted-foreground/50" />
                          <span className="text-[11px] italic">Disabled until {selectedDate}</span>
                        </div>
                      ) : !scheduleAccess.isScheduledDay ? (
                        /* Restricted: Outside Assigned Batch Days */
                        <div
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-[11px] font-semibold text-amber-400 select-none"
                          title={scheduleAccess.reason}
                        >
                          <Lock size={11} className="shrink-0" />
                          <span>Restricted • Outside Days</span>
                        </div>
                      ) : scheduleAccess.isBeforeStart ? (
                        /* Restricted: Before Scheduled Start Time */
                        <div
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-[11px] font-semibold text-amber-400 select-none"
                          title={scheduleAccess.reason}
                        >
                          <Lock size={11} className="shrink-0" />
                          <span>Restricted • Opens at {scheduleAccess.startTime}</span>
                        </div>
                      ) : (
                        /* Active Schedule Slot OR After Class End */
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* 1. If NOT checked in yet */}
                          {!hasCheckedIn && (
                            scheduleAccess.isAfterEnd ? (
                              <div
                                className="inline-flex items-center gap-1 rounded-lg bg-muted/40 border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground select-none"
                                title={scheduleAccess.reason}
                              >
                                <Lock size={11} className="shrink-0 text-muted-foreground/60" />
                                <span>Restricted • Class Ended</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleQuickCheckIn(attendee)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-xs transition-all cursor-pointer"
                                title="Check In Athlete (Automatically marks status as Present)"
                              >
                                <LogIn size={12} />
                                <span>Check In</span>
                              </button>
                            )
                          )}

                          {/* 2. If checked in but NOT checked out: ONLY Check Out action */}
                          {hasCheckedIn && !hasCheckedOut && (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(attendee, record)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-xs font-bold shadow-xs transition-all cursor-pointer"
                              title="Check Out Athlete (Records check-out time)"
                            >
                              <LogOut size={12} />
                              <span>Check Out</span>
                            </button>
                          )}

                          {/* 3. If checked out: Session completed */}
                          {hasCheckedIn && hasCheckedOut && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 size={12} />
                              <span>Checked Out</span>
                            </span>
                          )}
                        </div>
                      )}
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
          <h4 className="text-sm font-bold text-foreground">No Athletes Found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No athletes matched the selected filter for {currentBatch?.name || "this batch"} on {selectedDate}.
          </p>
        </div>
      )}
    </div>
  );
}
