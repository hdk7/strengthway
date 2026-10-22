/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import { SearchInput } from "@/components/ui";
import {
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
  Clock,
  Pencil,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { isAdmin, getRoleBasePath } from "@/auth/currentUser";
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
  onOpenEditModal,
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
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Action Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-card shadow-xs shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <SearchInput
            placeholder="Search athlete by name, ID, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
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

          {/* Mark All Present: Only active for Today during open batch schedule (Admin Only) */}
          {isToday && isAdmin() && (
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
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar flex flex-col pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs select-none">
              <tr className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4 sm:px-6">Athlete</th>
                <th className="py-3 px-4 sm:px-6">Check-In / Out Time</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-center min-w-40">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
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
                    className={`group transition-all duration-150 hover:-translate-y-px ${
                      attendee.isFlexOut ? "opacity-60" : ""
                    }`}
                  >
                    {/* Athlete Info */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase">
                          {attendee.name?.[0] || "A"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`${getRoleBasePath()}/trainers-members/members/${attendee.memberId}`}
                              className="font-bold text-foreground hover:text-accent transition-colors block truncate"
                            >
                              {attendee.name}
                            </Link>
                            {attendee.isFlexIn && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                <Sparkles size={10} />
                                <span>Flex-In (Home: {attendee.flexFromBatchName || "Original"})</span>
                              </span>
                            )}
                            {attendee.isFlexOut && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                                <ArrowRightLeft size={10} />
                                <span>Flexed Out (to: {attendee.flexDestination || "Target"})</span>
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
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      {hasCheckedIn ? (
                        <div className="font-mono text-xs flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 font-semibold flex items-center gap-1 text-[11px]">
                              <LogIn size={11} className="shrink-0" />
                              <span>In: {record.checkInTime}</span>
                            </span>
                            {hasCheckedOut && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-blue-400 font-semibold flex items-center gap-1 text-[11px]">
                                  <LogOut size={11} className="shrink-0" />
                                  <span>Out: {record.checkOutTime}</span>
                                </span>
                                {record.isSystemGenerated || record.checkoutBy === "SYSTEM" ? (
                                  <span className="inline-flex items-center rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[9px] px-1 py-0.2" title="System Auto-Checkout at scheduled class end + 1 hour">
                                    System Auto
                                  </span>
                                ) : record.checkoutBy === "ADMIN" ? (
                                  <span className="inline-flex items-center rounded bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-[9px] px-1 py-0.2" title="Manual checkout recorded by Admin">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[9px] px-1 py-0.2" title="Member checkout action">
                                    Member
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {hasCheckedIn && hasCheckedOut && record?.durationMinutes > 0 && (
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                              <Timer size={10} className="text-indigo-400 shrink-0" />
                              <span>Visit: {record.durationMinutes} mins</span>
                            </span>
                          )}
                          {hasCheckedIn && !hasCheckedOut && (isPast || periodExpired) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit">
                              <AlertTriangle size={10} />
                              <span>Check-out Pending</span>
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

                    {/* Status Badge & Remarks */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {renderStatusBadge(effectiveStatus, hasCheckedOut)}
                        {record?.remarks && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[160px] font-sans" title={record.remarks}>
                            {record.remarks}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Column: Retain ONLY Check In and Check Out, governed by schedule */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
                      {attendee.isFlexOut ? (
                        <span className="text-xs font-semibold text-muted-foreground italic">
                          Handled at target batch
                        </span>
                      ) : isPast ? (
                        /* Past Records: View and Admin Correction */
                        <div className="inline-flex items-center justify-center gap-1.5">
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
                          {isAdmin() && onOpenEditModal && (
                            <button
                              type="button"
                              onClick={() => onOpenEditModal(attendee, record, selectedDate)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs"
                              title="Admin correction / override"
                            >
                              <Pencil size={11} className="text-amber-500" />
                              <span>Correct</span>
                            </button>
                          )}
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
                          {isAdmin() ? (
                            <>
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
                            </>
                          ) : (
                            /* Read-only Biometric Attendance Status for Trainers & Members */
                            hasCheckedIn && hasCheckedOut ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 size={12} />
                                <span>Checked Out</span>
                              </span>
                            ) : hasCheckedIn ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
                                <LogIn size={12} />
                                <span>On Floor</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/40 border border-border/50 px-2.5 py-1 rounded-lg">
                                <Clock size={12} />
                                <span>Awaiting Punch</span>
                              </span>
                            )
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
