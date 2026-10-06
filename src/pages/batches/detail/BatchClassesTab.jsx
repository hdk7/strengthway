/* eslint-disable max-lines */
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Layers,
  Calendar,
  UserCheck,
  Users,
  FileText,
  Edit3,
  Check,
  X,
  RotateCcw,
  Plus,
} from "lucide-react";
import { hasClassStarted } from "@/lib/batchUtils";

export default function BatchClassesTab({
  batch,
  masterSchedule,
  currentBatchSessions = [],
  displayedSessions = [],
  sessionsTab,
  setSessionsTab,
  sessionTabCounts = {},
  selectedWeekFilter,
  setSelectedWeekFilter,
  masterClassItems = [],
  onOpenNotes,
  onEditMasterItem,
  onMarkCompleted,
  onCancelSession,
  onRestoreSession,
  onOpenAssignProgram,
  onCreateMasterSchedule,
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
        <span>
          Curriculum progression and floor sessions for <strong>{batch?.name}</strong>
        </span>
        <span>{currentBatchSessions.length} total classes</span>
      </div>

      {masterSchedule || currentBatchSessions.length > 0 ? (
        <div className="space-y-4">
          {/* Sessions Submodule Workflow Tabs inside Batch */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3 pt-1">
            {[
              {
                id: "Upcoming",
                label: "Upcoming",
                count: sessionTabCounts.upcoming || 0,
                icon: Clock,
                color: "text-blue-400",
              },
              {
                id: "Today",
                label: "Today Sessions",
                count: sessionTabCounts.today || 0,
                icon: AlertCircle,
                color: "text-amber-400",
              },
              {
                id: "Completed",
                label: "Completed",
                count: sessionTabCounts.completed || 0,
                icon: CheckCircle2,
                color: "text-emerald-400",
              },
              {
                id: "Cancelled",
                label: "Cancelled",
                count: sessionTabCounts.cancelled || 0,
                icon: XCircle,
                color: "text-destructive",
              },
              {
                id: "All",
                label: "All Classes",
                count: sessionTabCounts.all || 0,
                icon: Layers,
                color: "text-primary",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = sessionsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSessionsTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-background shadow-sm scale-[1.01]"
                      : "border border-border bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-background" : tab.color} />
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      isActive
                        ? "bg-background/20 text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Week Filter Pills & Status Info */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedWeekFilter("all")}
                className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                  selectedWeekFilter === "all"
                    ? "bg-primary text-background font-bold shadow-xs border border-transparent"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                All Weeks
              </button>
              {[1, 2, 3, 4].map((wk) => (
                <button
                  key={wk}
                  type="button"
                  onClick={() => setSelectedWeekFilter(wk)}
                  className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                    selectedWeekFilter === wk
                      ? "bg-primary text-background font-bold shadow-xs border border-transparent"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Week {wk}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground">
              Showing {displayedSessions.length}{" "}
              {sessionsTab === "All" ? "" : sessionsTab.toLowerCase()} classes for{" "}
              {batch?.name || batch?.shortName}
            </span>
          </div>

          {/* Floor Sessions & Curriculum Cards Grid */}
          {displayedSessions.length === 0 ? (
            <div className="flex min-h-45 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center bg-card/30">
              <CheckCircle2 className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <h4 className="text-sm font-bold text-foreground">
                No {sessionsTab} Classes in {batch?.name || batch?.shortName}
              </h4>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                There are currently no sessions in the &quot;{sessionsTab}&quot; status for
                this batch. Check other sub-tabs or view All Classes.
              </p>
              {sessionsTab !== "All" && (
                <button
                  type="button"
                  onClick={() => setSessionsTab("All")}
                  className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  View All Curriculum Classes →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedSessions.map((session) => {
                const isCompleted = session.status === "COMPLETED";
                const isCancelled = session.status === "CANCELLED";
                const isToday =
                  session.status === "TODAY" ||
                  session.sessionDate === new Date().toISOString().slice(0, 10);
                const canComplete = hasClassStarted(session);

                // Matching curriculum item
                const matchingItem = masterClassItems.find(
                  (i) =>
                    i.id === session.masterClassItemId ||
                    i.classNumber === session.classNumber
                );

                return (
                  <div
                    key={session.id || session.classNumber}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 backdrop-blur-sm transition-all hover:shadow-md ${
                      isCancelled
                        ? "opacity-75 border-destructive/30 bg-destructive/5"
                        : isCompleted
                          ? "border-emerald-500/25 bg-emerald-500/5"
                          : isToday
                            ? "border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20"
                            : "border-border bg-card/60 hover:border-primary/40 hover:bg-card"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Class Number & Date */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-black">
                            {session.classNumber}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            Class #{String(session.classNumber).padStart(2, "0")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-muted border border-border/70 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                            Week {session.weekNumber} • {session.dayOfWeek}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              isCancelled
                                ? "bg-destructive/15 text-destructive"
                                : isCompleted
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : isToday
                                    ? "bg-amber-500/15 text-amber-400"
                                    : "bg-blue-500/15 text-blue-400"
                            }`}
                          >
                            {session.status || "SCHEDULED"}
                          </span>
                        </div>
                      </div>

                      {/* Title & Subject */}
                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                          {session.subject}
                        </h4>
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {session.message ||
                            "Standard functional training session curriculum."}
                        </p>
                      </div>

                      {/* Session Floor Meta: Time, Coach, Room, Attendee Count */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                        <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                          <Clock size={12} className="text-amber-400 shrink-0" />
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {session.timing || batch?.timingLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                          <UserCheck size={12} className="text-emerald-400 shrink-0" />
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {session.coachName || masterSchedule?.coachName || "Coach"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                          <Layers size={12} className="text-blue-400 shrink-0" />
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {session.room || batch?.room || "Studio 1"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-background/50 border border-border/50 px-2.5 py-1.5">
                          <Users size={12} className="text-purple-400 shrink-0" />
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {session.attendeesCount ?? (session.attendees?.length || batch?.currentPax || 0)} Pax
                          </span>
                        </div>
                      </div>

                      {session.notes && (
                        <div className="rounded-xl bg-muted/60 p-2 text-xs text-foreground border border-border/70">
                          <strong className="text-primary font-bold">Coach Note:</strong>{" "}
                          {session.notes}
                        </div>
                      )}
                    </div>

                    {/* Action Footer: Complete, Cancel, Restore, Coach Note, Edit Syllabus */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenNotes(session)}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                          title="Add or edit coach note"
                        >
                          <FileText size={12} />
                          <span>{session.notes ? "Note" : "+ Note"}</span>
                        </button>

                        {matchingItem && (
                          <button
                            type="button"
                            onClick={() => onEditMasterItem(matchingItem)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Edit curriculum syllabus"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-primary font-semibold text-[11px] mr-1">
                          {session.displayDate || `Class ${session.classNumber}`}
                        </span>

                        {!isCompleted && !isCancelled && (
                          <>
                            {canComplete ? (
                              <button
                                type="button"
                                onClick={() => onMarkCompleted(session.id, session.subject, session)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Mark class session completed"
                              >
                                <Check size={12} />
                                <span>Done</span>
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg bg-muted/40 text-muted-foreground/60 border border-border/40 px-2 py-1 text-[11px] font-medium cursor-not-allowed select-none"
                                title={`Class scheduled for ${session.displayDate || session.sessionDate || "future"}${session.timing ? ` (${session.timing})` : ""}. Available once class starts.`}
                              >
                                <Clock size={11} />
                                <span>Scheduled</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onCancelSession(session.id, session.subject)}
                              className="inline-flex items-center gap-1 rounded-lg border border-destructive/25 bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                              title="Cancel class session"
                            >
                              <X size={12} />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {(isCompleted || isCancelled) && (
                          <button
                            type="button"
                            onClick={() => onRestoreSession(session.id, session.subject)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                            title="Restore class to scheduled"
                          >
                            <RotateCcw size={11} />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Empty state if no master schedule mapped yet */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center bg-card/40">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">
            No Scheduled Class Program Assigned Yet
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            This batch currently has no curriculum assigned. You can assign an existing
            reusable program or create a new program.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onOpenAssignProgram}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
            >
              <Layers size={15} />
              <span>Assign Existing Reusable Program</span>
            </button>
            <button
              type="button"
              onClick={onCreateMasterSchedule}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Create New Program for {batch?.shortName || batch?.name}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
