/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import { SearchInput } from "@/components/ui";
import {
  CheckCircle2,
  Users,
  LogIn,
  LogOut,
  Lock,
  ShieldCheck,
  XCircle,
  Layers,
  CalendarOff,
  CalendarCheck,
  Clock,
  Timer,
  AlertTriangle,
  Edit3,
  Eye,
  Zap,
  PlusCircle,
} from "lucide-react";
import {
  isDateToday,
  isDatePast,
  isDateFuture,
  isTrainerAttendancePeriodExpired,
  checkTrainerScheduleAccess,
  getEffectiveTrainerStatus,
  getTrainerScheduleDetails,
  parseTimeToMinutes,
} from "./trainerAttendanceUtils";
import { isAdmin, getRoleBasePath } from "@/auth/currentUser";

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
  trainerIntervalsMap = {},
  trainerSchedulesMap = {},
  handleQuickCheckIn,
  handleQuickCheckOut,
  handleQuickCheckInSession,
  handleQuickCheckOutSession,
  handleTrainerAddAnotherSession,
  onOpenViewModal,
  onOpenEditModal,
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

  const renderStatusBadge = (effectiveStatus, isPendingCheckout) => {
    if (isPendingCheckout) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
          <AlertTriangle size={11} />
          <span>Check-out Pending</span>
        </span>
      );
    }
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
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Action Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl border border-border/80 bg-card shadow-xs shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <SearchInput
            placeholder="Search faculty by name, ID, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filters: All, Present, Absent, On Leave */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 text-xs">
            {["ALL", "PRESENT", "ABSENT", "LEAVE"].map((f) => (
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
                  : "On Leave"}
              </button>
            ))}
          </div>

          {/* Mark All Present: Only active for Today during open shifts (Admin Only) */}
          {isToday && isAdmin() && (
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
              Past Records (Admin Corrections Allowed)
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
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar flex flex-col pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs select-none">
              <tr className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Faculty Coach</th>
                <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Assigned Schedule / Timings</th>
                <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Check-In / Out Time</th>
                <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Duration (Teaching / Presence)</th>
                <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Status & Remarks</th>
                <th className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium whitespace-nowrap">
              {paginatedTrainers.map((trainer) => {
                const record = dailyRecordsMap[trainer.id];
                const interval = trainerIntervalsMap[trainer.id] || null;
                const hasCheckedIn = Boolean(record?.checkInTime || interval?.checkInTime);
                const hasCheckedOut = Boolean(record?.checkOutTime || interval?.checkOutTime);
                const isPendingCheckout = hasCheckedIn && !hasCheckedOut;

                const scheduleAccess = checkTrainerScheduleAccess(selectedDate, trainer, batches);
                const periodExpired = isTrainerAttendancePeriodExpired(selectedDate, trainer, batches);
                const effectiveStatus = getEffectiveTrainerStatus(
                  trainer,
                  record,
                  scheduleAccess,
                  isPast,
                  periodExpired
                );

                const schedule = getTrainerScheduleDetails(trainer, batches, selectedDate);
                const assignedBatchObjects = (batches || []).filter((b) =>
                  Array.isArray(trainer.batchIds) && trainer.batchIds.includes(b.id)
                );

                // Check continuous consecutive sessions
                const isConsecutive = interval?.isContinuous || (schedule.classes?.length > 1);

                // Duration calculations
                const actualPresence = interval?.actualDurationMinutes || record?.actualPresenceMinutes || (
                  hasCheckedIn && hasCheckedOut
                    ? Math.max(0, (parseTimeToMinutes(record.checkOutTime) || 0) - (parseTimeToMinutes(record.checkInTime) || 0))
                    : 0
                );
                const teachingDuration = interval?.totalTeachingDurationMinutes || record?.durationMinutes || 0;

                const remarks = record?.remarks || interval?.remarks || "";

                // Check for eligible consecutive next session for "Add Another Session"
                const trainerSchedule = trainerSchedulesMap[trainer.id];
                let eligibleTransition = null;
                if (trainerSchedule?.blocks) {
                  for (const block of trainerSchedule.blocks) {
                    for (const s of block.sessions) {
                      if (s.isEligibleForAddAnotherSession && s.consecutiveNextSession) {
                        eligibleTransition = { currentSession: s, nextSession: s.consecutiveNextSession };
                        break;
                      }
                    }
                    if (eligibleTransition) break;
                  }
                }

                return (
                  <tr
                    key={trainer.id}
                    className="group transition-all duration-150 hover:-translate-y-px whitespace-nowrap"
                  >
                    {/* Faculty Coach Info */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent font-bold text-xs uppercase">
                          {trainer.name?.[0] || "T"}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Link
                              to={`${getRoleBasePath()}/trainers-members/trainers/${trainer.id}`}
                              className="font-bold text-foreground hover:text-accent transition-colors truncate whitespace-nowrap"
                            >
                              {trainer.name}
                            </Link>
                            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                              (ID: {trainer.id})
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/80 font-medium">
                            {trainer.shift || "General Shift"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Batches & Scheduled Classes with Timings */}
                    <td className="bg-card py-3 px-4 sm:px-6 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="flex flex-col gap-1.5 min-w-[260px] max-w-md">
                        {isConsecutive && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[9px] px-1.5 py-0.5">
                              <Zap size={9} />
                              <span>Consecutive Shift ({trainerSchedule?.sessions?.length || schedule.classes?.length || 2} Sessions)</span>
                            </span>
                            {interval?.consecutiveSessionId && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-400 font-mono text-[9px] px-1 py-0.2" title={`Linked to consecutive session ${interval.consecutiveSessionId}`}>
                                Linked Session
                              </span>
                            )}
                          </div>
                        )}

                        {trainerSchedule?.sessions?.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {trainerSchedule.sessions.map((s) => {
                              const sIn = Boolean(s.hasCheckedIn || s.attendanceLog?.checkInTime);
                              const sOut = Boolean(s.hasCheckedOut || s.attendanceLog?.checkOutTime);

                              return (
                                <div
                                  key={s.id}
                                  className={`flex items-center justify-between gap-2 p-1.5 px-2 rounded-lg border text-xs transition-colors ${
                                    sOut
                                      ? "bg-blue-500/5 border-blue-500/25 text-foreground"
                                      : sIn
                                      ? "bg-emerald-500/5 border-emerald-500/30 text-foreground"
                                      : "bg-muted/30 border-border/60 text-muted-foreground"
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 pr-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[11px] text-foreground truncate max-w-[140px]">
                                        {s.batchName || s.className || "Class"}
                                      </span>
                                      {s.isSubstituted && (
                                        <span className="text-[8px] bg-purple-500/15 border border-purple-500/30 text-purple-400 px-1 rounded font-semibold shrink-0">
                                          Sub
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                                      <Clock size={10} className="text-accent shrink-0" />
                                      <span>{s.startTime} - {s.endTime}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Session Status Pill */}
                                    {sOut ? (
                                      <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[9px] px-1.5 py-0.2 font-bold" title={`Conducted: ${s.attendanceLog?.durationMinutes || 60}m`}>
                                        <CheckCircle2 size={8} /> {s.attendanceLog?.durationMinutes || 60}m
                                      </span>
                                    ) : sIn ? (
                                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] px-1.5 py-0.2 font-bold" title={`Checked In at ${s.attendanceLog?.checkInTime}`}>
                                        <LogIn size={8} /> {s.attendanceLog?.checkInTime}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-muted-foreground/80 font-mono bg-muted/60 px-1 rounded">
                                        Pending
                                      </span>
                                    )}

                                    {/* Session Check-In Button (Trainer/Admin) */}
                                    {isToday && !sIn && effectiveStatus !== "LEAVE" && (s.isCheckInWindowOpen || isAdmin()) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickCheckInSession
                                            ? handleQuickCheckInSession({
                                                trainerId: trainer.id,
                                                date: selectedDate,
                                                sessionId: s.id,
                                                batchId: s.batchId,
                                              })
                                            : handleQuickCheckIn(trainer)
                                        }
                                        title={`Check In for ${s.batchName || s.className} (${s.startTime} - ${s.endTime})`}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] cursor-pointer shadow-xs"
                                      >
                                        <LogIn size={9} />
                                        <span>In</span>
                                      </button>
                                    )}

                                    {/* Session Check-Out Button (Trainer/Admin) */}
                                    {isToday && sIn && !sOut && (s.isCheckOutWindowOpen || isAdmin()) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleQuickCheckOutSession
                                            ? handleQuickCheckOutSession({
                                                trainerId: trainer.id,
                                                date: selectedDate,
                                                sessionId: s.id,
                                                batchId: s.batchId,
                                              })
                                            : handleQuickCheckOut(trainer, s.attendanceLog || record)
                                        }
                                        title={`Check Out of ${s.batchName || s.className}`}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9px] cursor-pointer shadow-xs"
                                      >
                                        <LogOut size={9} />
                                        <span>Out</span>
                                      </button>
                                    )}

                                    {/* Consecutive Add Another Session */}
                                    {isToday && sIn && !sOut && s.isEligibleForAddAnotherSession && s.consecutiveNextSession && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleTrainerAddAnotherSession(
                                            trainer,
                                            s,
                                            s.consecutiveNextSession
                                          )
                                        }
                                        title={`Transition to consecutive session: ${s.consecutiveNextSession.batchName || s.consecutiveNextSession.startTime}`}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] cursor-pointer shadow-xs"
                                      >
                                        <PlusCircle size={9} />
                                        <span>Next</span>
                                      </button>
                                    )}

                                    {/* Admin Specific Session Mark / Override */}
                                    {isAdmin() && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenEditModal(trainer, s)}
                                        title={`Admin Mark / Correct Attendance for ${s.batchName || s.className}`}
                                        className="p-1 rounded border border-border/80 bg-background text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                      >
                                        <Edit3 size={10} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : assignedBatchObjects.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                            {assignedBatchObjects.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-muted/60 text-[10px] font-mono text-muted-foreground border border-border/50 whitespace-nowrap shrink-0"
                              >
                                <Layers size={9} />
                                <span>{b.name}</span>
                                {b.timingLabel && (
                                  <span className="text-[9px] opacity-75">({b.timingLabel})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic whitespace-nowrap">
                            No batches assigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Check-In / Out Timestamps */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      {hasCheckedIn ? (
                        <div className="font-mono text-xs flex flex-col gap-0.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 font-semibold flex items-center gap-1 text-[11px] whitespace-nowrap">
                              <LogIn size={11} className="shrink-0" />
                              <span>In: {record?.checkInTime || interval?.checkInTime}</span>
                            </span>
                            {hasCheckedOut ? (
                              <>
                                <span className="text-muted-foreground/60">•</span>
                                <span className="text-blue-400 font-semibold flex items-center gap-1 text-[11px] whitespace-nowrap">
                                  <LogOut size={11} className="shrink-0" />
                                  <span>Out: {record?.checkOutTime || interval?.checkOutTime}</span>
                                </span>
                                {(record?.checkoutBy === "ADMIN" || interval?.checkoutBy === "ADMIN" || record?.notes?.includes("Admin")) && (
                                  <span className="inline-flex items-center rounded bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-[9px] px-1 py-0.2" title="Attendance corrected by Admin">
                                    Admin
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.2 rounded">
                                Out: Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ) : effectiveStatus === "ABSENT" ? (
                        <span className="text-rose-400/80 font-mono text-[11px] whitespace-nowrap">
                          Absent (No Check-In)
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">—</span>
                      )}
                    </td>

                    {/* Duration (Teaching vs Presence) */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      {hasCheckedIn && hasCheckedOut ? (
                        <div className="flex flex-col font-mono text-xs">
                          <div className="flex items-center gap-1.5 text-foreground font-bold" title="Scheduled teaching duration">
                            <Timer size={12} className="text-emerald-400" />
                            <span>Teaching: {teachingDuration} min</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1" title="Actual presence on premises">
                            <Clock size={10} />
                            <span>Presence: {actualPresence} min</span>
                          </div>
                        </div>
                      ) : isPendingCheckout ? (
                        <span className="text-[10px] text-amber-400/90 font-mono">
                          Calculating on checkout…
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Status & Remarks */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        {renderStatusBadge(effectiveStatus, isPendingCheckout)}
                        {(record?.exceptionFlags?.requiresReview || record?.exceptionFlags?.missingCheckout) && (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[9px] px-1.5 py-0.5"
                            title="Missing checkout or continuous interval flagged for Admin review"
                          >
                            <AlertTriangle size={9} />
                            <span>Review Required</span>
                          </span>
                        )}
                        {remarks ? (
                          <span
                            title={remarks}
                            className="text-[10px] text-muted-foreground truncate max-w-[180px] font-sans"
                          >
                            {remarks}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Admin Mark Attendance Button */}
                        {isAdmin() && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(trainer, null)}
                            title="Mark attendance for coach's scheduled sessions"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all cursor-pointer shadow-xs"
                          >
                            <CalendarCheck size={11} />
                            <span>Mark Attendance</span>
                          </button>
                        )}

                        {/* Quick Check-In Button (Trainer) */}
                        {!isAdmin() && isToday && !hasCheckedIn && effectiveStatus !== "LEAVE" && (
                          <button
                            type="button"
                            onClick={() => handleQuickCheckIn(trainer)}
                            disabled={!scheduleAccess.isAllowed && !isAdmin()}
                            title={
                              scheduleAccess.isAllowed
                                ? "Check In faculty coach"
                                : scheduleAccess.reason
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              scheduleAccess.isAllowed || isAdmin()
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
                                : "bg-muted text-muted-foreground/50 border border-border cursor-not-allowed"
                            }`}
                          >
                            <LogIn size={11} />
                            <span>Check In</span>
                          </button>
                        )}

                        {/* Add Another Session Button (Consecutive Session Transition) */}
                        {!isAdmin() && isToday && isPendingCheckout && eligibleTransition && handleTrainerAddAnotherSession && (
                          <button
                            type="button"
                            onClick={() => handleTrainerAddAnotherSession(trainer, eligibleTransition.currentSession, eligibleTransition.nextSession)}
                            title={`End current session and transition to consecutive session: ${eligibleTransition.nextSession.batchName || eligibleTransition.nextSession.startTime}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-xs"
                          >
                            <PlusCircle size={11} />
                            <span>Add Another Session</span>
                          </button>
                        )}

                        {/* Quick Check-Out Button (Trainer) */}
                        {!isAdmin() && isToday && isPendingCheckout && (
                          <button
                            type="button"
                            onClick={() => handleQuickCheckOut(trainer, record || interval)}
                            title="Complete session check out"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer shadow-xs"
                          >
                            <LogOut size={11} />
                            <span>Check Out</span>
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => onOpenViewModal(trainer, record || interval)}
                          title="View Attendance Details"
                          className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
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

export default TrainerDailyCheckInTable;
