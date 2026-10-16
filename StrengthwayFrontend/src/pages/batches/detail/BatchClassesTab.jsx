/* eslint-disable max-lines */
import { useState, useEffect } from "react";
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
  ArrowLeftRight,
  History,
  Flag,
  User,
  AlertTriangle,
} from "lucide-react";
import Pagination from "@/components/table/Pagination";
import { hasClassStarted } from "@/lib/batchUtils";
import { ShuffleClassModal } from "../../schedule/components/ShuffleClassModal";
import { ScheduleHistoryDrawer } from "../../schedule/components/ScheduleHistoryDrawer";
import { ClassCancellationRescheduleModal } from "../../schedule/components/ClassCancellationRescheduleModal";
import { isSessionEligibleForInterchange } from "@/lib/classInterchangeUtils";
import { isAdmin, isMember, isTrainer, getCurrentUser } from "@/auth/currentUser";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDateAndMonth(session) {
  const rawDate = session?.sessionDate || session?.date;
  if (rawDate && typeof rawDate === "string") {
    const parts = rawDate.slice(0, 10).split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIndex >= 0 && monthIndex < 12) {
        return `${day} ${MONTH_NAMES[monthIndex]}`;
      }
    }
  }

  if (session?.displayDate && typeof session.displayDate === "string") {
    const parsed = new Date(session.displayDate);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getDate()} ${MONTH_NAMES[parsed.getMonth()]}`;
    }
    return session.displayDate;
  }

  if (session?.weekNumber && session?.dayOfWeek) {
    return `Week ${session.weekNumber} • ${session.dayOfWeek}`;
  }

  return "—";
}

function getSessionAssignedTrainers(session, batch, trainers = []) {
  const trainerMap = new Map();
  (trainers || []).forEach((t) => {
    if (t?.id) trainerMap.set(t.id, t);
    if (t?._id) trainerMap.set(String(t._id), t);
  });

  const getTrainerName = (id, fallback) => {
    const t = trainerMap.get(id);
    if (!t) return fallback || id || "Unassigned";
    const name = t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim();
    return name || fallback || id || "Unassigned";
  };

  const list = [];
  const processedIds = new Set();

  // If a substitute is assigned, the SUBSTITUTE coach conducts the class and goes FIRST
  if (session?.isSubstituted && session?.substituteCoachId) {
    const subId = session.substituteCoachId;
    processedIds.add(subId);
    list.push({
      id: subId,
      name: getTrainerName(subId, session.substituteCoachName),
      role: `Substitute Coach (${session?.substitutionReason || "Leave Coverage"})`,
      isSubstitute: true,
      isConducting: true,
    });

    // If an original coach exists and is replaced, show them next
    const origId = session.originalCoachId;
    if (origId && origId !== subId) {
      processedIds.add(origId);
      list.push({
        id: origId,
        name: getTrainerName(origId, session.originalCoachName),
        role: "Original Coach (On Leave)",
        isOriginalReplaced: true,
        isSubstitute: false,
      });
    }
  } else {
    // Normal session: conducting coach is session.coachId or primary batch trainer
    if (session?.coachId) {
      processedIds.add(session.coachId);
      list.push({
        id: session.coachId,
        name: getTrainerName(session.coachId, session.coachName),
        role: "Conducting Coach",
        isSubstitute: false,
        isConducting: true,
      });
    }
  }

  // Next, include any batch trainers who are not already processed
  if (Array.isArray(batch?.trainerIds)) {
    batch.trainerIds.forEach((tid) => {
      if (tid && !processedIds.has(tid)) {
        processedIds.add(tid);
        list.push({
          id: tid,
          name: getTrainerName(tid, ""),
          role: "Assigned Coach",
          isSubstitute: false,
        });
      }
    });
  }

  // Include any extra assignedTrainerIds from session
  if (Array.isArray(session?.assignedTrainerIds)) {
    session.assignedTrainerIds.forEach((tid) => {
      if (tid && !processedIds.has(tid)) {
        processedIds.add(tid);
        list.push({
          id: tid,
          name: getTrainerName(tid, ""),
          role: "Assigned Coach",
          isSubstitute: false,
        });
      }
    });
  }

  if (list.length === 0) {
    const fallbackId = session?.coachId || batch?.trainerId;
    if (fallbackId) {
      list.push({
        id: fallbackId,
        name: getTrainerName(fallbackId, session?.coachName || "Assigned Coach"),
        role: "Assigned Coach",
        isSubstitute: false,
      });
    }
  }

  return list;
}

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
  sessionNotes = [],
  trainers = [],
  onOpenNotes,
  onEditMasterItem,
  onMarkCompleted,
  onCancelSession,
  onRestoreSession,
  onCreateMasterSchedule,
  onOpenAddClasses,
  onOpenSubstituteModal,
  onRefresh,
}) {
  const currentUser = getCurrentUser() || {};
  const userIsTrainer = isTrainer();
  const myTrainerId = currentUser.trainerId || currentUser.id;

  const [isShuffleOpen, setIsShuffleOpen] = useState(false);
  const [shuffleSourceSessionId, setShuffleSourceSessionId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [cancellationInitialSessionId, setCancellationInitialSessionId] = useState("");

  const handleOpenShuffle = (sourceId = "") => {
    setShuffleSourceSessionId(sourceId);
    setIsShuffleOpen(true);
  };

  // Pagination for Scheduled Classes (fixed 6 classes per page)
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [sessionsTab, selectedWeekFilter]);

  const totalPages = Math.ceil(displayedSessions.length / PAGE_SIZE) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedSessions = displayedSessions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
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
                  id={`sessions-subtab-${tab.id.toLowerCase()}`}
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

            {/* Emergency Class Cancellation & Reschedule Action */}
            {isAdmin() && (
              <button
                id="btn-emergency-reschedule-batch"
                type="button"
                onClick={() => {
                  setCancellationInitialSessionId("");
                  setIsCancellationModalOpen(true);
                }}
                className="sm:ml-auto inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Reschedule emergency cancellations and calculate membership payment adjustments"
              >
                <AlertTriangle size={14} className="text-destructive" />
                <span>Emergency Reschedule / Cancel</span>
              </button>
            )}
          </div>

          {/* Today's Conduction & Coach Session Notes Overview Banner */}
          {sessionsTab === "Today" && displayedSessions.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs mb-1">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-500 shrink-0" />
                  <h4 className="font-bold text-foreground text-sm">
                    {userIsTrainer ? "Today's Class Session Notes" : "Today's Ongoing & Completed Classes Debrief"}
                  </h4>
                </div>
                <p className="text-muted-foreground text-xs">
                  {userIsTrainer
                    ? "Manage and submit your session notes for today's classes."
                    : "Real-time monitoring of session summary and trainer observations for today's classes."}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-1.5">
                  <span className="text-muted-foreground font-semibold">Today Classes:</span>
                  <span className="font-bold text-foreground">{displayedSessions.length}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-1.5">
                  <span className="text-muted-foreground font-semibold">Notes Logged:</span>
                  <span className="font-bold text-emerald-500">
                    {(sessionNotes || []).filter((n) => {
                      if (!displayedSessions.some((s) => s.id === n.sessionId)) return false;
                      if (userIsTrainer) return n.trainerId === myTrainerId;
                      return true;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              {paginatedSessions.map((session) => {
                const isCompleted = session.status === "COMPLETED";
                const isCancelled = session.status === "CANCELLED";
                const isToday =
                  session.status === "TODAY" ||
                  session.sessionDate === new Date().toISOString().slice(0, 10);
                const canComplete = hasClassStarted(session);
                const isEligibleForNotes = (isCompleted || canComplete) && !isCancelled;

                // Matching curriculum item
                const matchingItem = masterClassItems.find(
                  (i) =>
                    i.id === session.masterClassItemId ||
                    i.classNumber === session.classNumber
                );

                const currentUser = getCurrentUser() || {};
                const userIsTrainer = isTrainer();
                const myTrainerId = currentUser.trainerId || currentUser.id;

                const allAssignedCoaches = getSessionAssignedTrainers(session, batch, trainers);

                // Keep one card per scheduled class showing all assigned coaches
                const assignedCoaches = allAssignedCoaches.length > 0
                  ? allAssignedCoaches
                  : (session.coachId
                      ? [{ id: session.coachId, name: session.coachName || session.coachId, role: "Faculty Coach" }]
                      : [{ id: myTrainerId || "TRN-101", name: currentUser.name || "Assigned Coach", role: "Faculty Coach" }]);

                const notesForThisSession = (sessionNotes || []).filter(
                  (n) => n.sessionId === session.id && (!userIsTrainer || n.trainerId === myTrainerId)
                );

                const submittedNotesForSession = notesForThisSession.filter(
                  (n) => n.sessionSummary && n.sessionSummary.trim().length > 0
                );
                const submittedCount = submittedNotesForSession.length;
                const visibleCoaches = assignedCoaches.slice(0, 2);
                const hasMoreCoaches = assignedCoaches.length > 2;

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

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {session.isCancelled && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-[10px] font-bold text-destructive">
                              <XCircle size={11} className="shrink-0" />
                              <span>Cancelled{session.rescheduledToDate ? ` → ${session.rescheduledToDate}` : ""}</span>
                            </span>
                          )}
                          {session.isRescheduled && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              <RotateCcw size={11} className="shrink-0" />
                              <span>Rescheduled{session.rescheduledFromDate ? ` from ${session.rescheduledFromDate}` : ""}</span>
                            </span>
                          )}
                          {session.isSubstituted && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                              <UserCheck size={11} className="text-amber-500 shrink-0" />
                              <span>Substitute Assigned</span>
                            </span>
                          )}
                          <span
                            className="rounded-md bg-muted border border-border/70 px-2.5 py-1 text-xs font-bold text-foreground"
                            title={session.displayDate || session.sessionDate || ""}
                          >
                            {formatDateAndMonth(session)}
                          </span>
                        </div>
                      </div>

                      {/* Title, Subject & Workouts */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-foreground leading-snug">
                            {session.subject || session.className}
                          </h4>
                          {session.classId && (
                            <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                              {session.classId}
                            </span>
                          )}
                        </div>

                        {session.isCancelled && session.cancellationReason && (
                          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <AlertTriangle size={13} className="text-destructive shrink-0" />
                              <span className="font-bold text-destructive truncate text-[11px]">
                                Cancelled: {session.cancellationReason}
                              </span>
                            </div>
                            {session.rescheduledToDate && (
                              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                Shifted to: {session.rescheduledToDate}
                              </span>
                            )}
                          </div>
                        )}

                        {session.beginnerWorkouts || session.intermediateWorkouts ? (
                          <div className="space-y-1 text-xs pt-0.5">
                            {session.beginnerWorkouts && session.beginnerWorkouts !== "Not specified" && (
                              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[11px] text-foreground">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">Beg: </span>
                                <span className="text-muted-foreground line-clamp-2">{session.beginnerWorkouts}</span>
                              </div>
                            )}
                            {session.intermediateWorkouts && session.intermediateWorkouts !== "Not specified" && (
                              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-[11px] text-foreground">
                                <span className="font-bold text-blue-600 dark:text-blue-400">Int: </span>
                                <span className="text-muted-foreground line-clamp-2">{session.intermediateWorkouts}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {session.message ||
                              "Standard functional training session curriculum."}
                          </p>
                        )}
                      </div>

                      {/* Substituted Trainer Banner */}
                      {session.isSubstituted && session.substituteCoachId && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <UserCheck size={13} className="text-amber-500 shrink-0" />
                            <span className="font-bold text-amber-700 dark:text-amber-400 truncate text-[11px]">
                              Conducting: {session.substituteCoachName || session.substituteCoachId}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold shrink-0">
                              {session.substitutionReason || "Leave Coverage"}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            Original: {session.originalCoachName || session.coachName}
                          </span>
                        </div>
                      )}

                      {/* Assigned Trainers & Individual Notes Submission Status */}
                      <div className="space-y-1.5 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-primary" />
                            <span>
                              {session.isSubstituted
                                ? "Conducting Coach (Substitute):"
                                : `Assigned ${assignedCoaches.length > 1 ? "Coaches" : "Coach"}:`}
                            </span>
                          </span>
                          {(isEligibleForNotes || submittedCount > 0) && (
                            <span className="text-[10px] text-muted-foreground/80 font-mono">
                              {userIsTrainer
                                ? (submittedCount > 0 ? "1 note" : "0 notes")
                                : `${submittedCount}/${assignedCoaches.length} notes`}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          {visibleCoaches.map((coach) => {
                            const coachNote = notesForThisSession.find((n) => n.trainerId === coach.id);
                            const isSubmitted = !!(coachNote && coachNote.sessionSummary?.trim());
                            const isMyCoach = userIsTrainer && coach.id === myTrainerId;

                            // If this coach is the active substitute conducting coach
                            if (coach.isSubstitute) {
                              return (
                                <span
                                  key={coach.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300 font-bold shadow-2xs"
                                  title={`Conducting Substitute Trainer: ${coach.name}`}
                                >
                                  <UserCheck size={11} className="text-amber-500 shrink-0" />
                                  <span className="truncate max-w-[120px]">{coach.name}</span>
                                  <span className="rounded bg-amber-500/25 px-1 py-0.2 text-[8px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-200">
                                    Substitute
                                  </span>
                                </span>
                              );
                            }

                            // If this coach was the original replaced trainer (on leave)
                            if (coach.isOriginalReplaced) {
                              return (
                                <span
                                  key={coach.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground/75"
                                  title={`Original Assigned Trainer: ${coach.name} (On Leave)`}
                                >
                                  <span className="line-through truncate max-w-[100px]">{coach.name}</span>
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    (On Leave)
                                  </span>
                                </span>
                              );
                            }

                            // When logged in as trainer, restrict interactive notes button to own coach profile only
                            if (userIsTrainer && !isMyCoach) {
                              return (
                                <span
                                  key={coach.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground"
                                  title={`Assigned Faculty: ${coach.name}`}
                                >
                                  <span className="font-semibold truncate max-w-[130px]">{coach.name}</span>
                                </span>
                              );
                            }

                            if (isEligibleForNotes || isSubmitted) {
                              return (
                                <button
                                  key={coach.id}
                                  type="button"
                                  onClick={() => onOpenNotes(session, coach.id)}
                                  className={`group/trainer inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-all cursor-pointer ${
                                    isSubmitted
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                                  }`}
                                  title={
                                    isSubmitted
                                      ? `${coach.name}${isMyCoach ? " (You)" : ""} • Notes Submitted. Click to view notes.`
                                      : `${coach.name}${isMyCoach ? " (You)" : ""} • Notes Pending. Click to view or edit notes.`
                                  }
                                >
                                  <span className="font-semibold truncate max-w-[110px]">
                                    {coach.name}{isMyCoach ? " (You)" : ""}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                      isSubmitted
                                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                        : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {isSubmitted ? (
                                      <>
                                        <CheckCircle2 size={9} />
                                        <span>Submitted</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock size={9} />
                                        <span>Notes Pending</span>
                                      </>
                                    )}
                                  </span>
                                </button>
                              );
                            }

                            return (
                              <span
                                key={coach.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground"
                                title={`Assigned Faculty: ${coach.name}`}
                              >
                                <span className="font-semibold truncate max-w-[130px]">{coach.name}</span>
                              </span>
                            );
                          })}

                          {hasMoreCoaches && (
                            (!userIsTrainer && (isEligibleForNotes || submittedCount > 0)) ? (
                              <button
                                type="button"
                                onClick={() => onOpenNotes(session, "")}
                                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border bg-card/80 px-2 py-1 text-[10px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                title="View all assigned coaches"
                              >
                                <span>+{assignedCoaches.length - 2} More</span>
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border bg-card/80 px-2 py-1 text-[10px] font-bold text-muted-foreground"
                                title="Additional assigned coaches"
                              >
                                <span>+{assignedCoaches.length - 2} More</span>
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Debrief & Session Notes for Today / Completed classes */}
                      {(isToday || isCompleted) && submittedNotesForSession.length > 0 ? (
                        <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
                              <FileText size={12} className="text-primary" />
                              <span>{userIsTrainer ? "My Session Notes" : "Coach Session Notes"}</span>
                            </span>
                          </div>

                          <div className="space-y-2 divide-y divide-border/40">
                            {submittedNotesForSession.map((note) => (
                              <div key={note.id || note.trainerId} className="pt-1.5 first:pt-0 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-foreground">
                                    {userIsTrainer ? "Session Notes" : (note.trainerName || note.trainerId)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {note.submittedAt ? new Date(note.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>

                                {note.sessionSummary && (
                                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                    &quot;{note.sessionSummary}&quot;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (isToday || isCompleted) && session.notes ? (
                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-2 text-xs text-foreground flex items-start gap-1.5">
                          <FileText size={13} className="text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-2 italic text-[11px]">
                            {session.notes}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Coach Notes Button: strictly hidden for upcoming/future classes unless notes already submitted */}
                        {(isEligibleForNotes || submittedCount > 0) && (
                          isMember() ? (
                            (submittedNotesForSession.length > 0 || session.notes) ? (
                              <button
                                type="button"
                                onClick={() => onOpenNotes(session, "")}
                                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                                title="View Coach Notes"
                              >
                                <FileText size={11} />
                                <span>Coach Note</span>
                              </button>
                            ) : null
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenNotes(session, userIsTrainer ? myTrainerId : "")}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                              title="View / Edit Coach Notes"
                            >
                              <FileText size={11} />
                              <span>
                                {userIsTrainer
                                  ? (submittedCount > 0 ? "My Notes" : "Add Note")
                                  : (submittedCount > 0 ? `Notes (${submittedCount}/${assignedCoaches.length})` : "Add Notes")}
                              </span>
                            </button>
                          )
                        )}

                        {isAdmin() && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEditMasterItem(session, matchingItem)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                              title="Edit Class Program & Workouts"
                            >
                              <Edit3 size={11} />
                              <span>Edit Item</span>
                            </button>

                            {!isCompleted && !isCancelled && (
                              <button
                                type="button"
                                onClick={() => onOpenSubstituteModal && onOpenSubstituteModal(session)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                                  session.isSubstituted
                                    ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 shadow-2xs"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                                title={
                                  session.isSubstituted
                                    ? `Substitute Assigned: ${session.substituteCoachName} (${session.substitutionReason || "Leave"}). Click to manage or cancel.`
                                    : "Optionally assign a substitute trainer for this session."
                                }
                              >
                                <UserCheck size={11} className={session.isSubstituted ? "text-amber-500" : ""} />
                                <span>{session.isSubstituted ? "Substituted" : "Substitute"}</span>
                                {session.isSubstituted && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                )}
                              </button>
                            )}

                            {!isCompleted && !isCancelled && isSessionEligibleForInterchange(session, batch) && currentBatchSessions.length >= 2 && (
                              <button
                                type="button"
                                onClick={() => handleOpenShuffle(session.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                                title="Swap this class with another scheduled day"
                              >
                                <ArrowLeftRight size={11} />
                                <span>Swap</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isCompleted && !isCancelled && (
                          <>
                            {isAdmin() && canComplete && (
                              <button
                                type="button"
                                onClick={() => onMarkCompleted(session.id, session.subject, session)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Mark class session completed"
                              >
                                <Check size={12} />
                                <span>Done</span>
                              </button>
                            )}
                            {(!isAdmin() || !canComplete) && (
                              <span
                                className="inline-flex items-center gap-1 rounded-lg bg-muted/40 text-muted-foreground/60 border border-border/40 px-2 py-1 text-[11px] font-medium cursor-not-allowed select-none"
                                title={`Class scheduled for ${session.displayDate || session.sessionDate || "future"}${session.timing ? ` (${session.timing})` : ""}.`}
                              >
                                <Clock size={11} />
                                <span>Scheduled</span>
                              </span>
                            )}

                            {isAdmin() && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellationInitialSessionId(session.id);
                                  setIsCancellationModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-destructive/25 bg-destructive/10 hover:bg-destructive/20 text-destructive px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Emergency cancel and reschedule this class"
                              >
                                <X size={12} />
                                <span>Cancel / Reschedule</span>
                              </button>
                            )}
                          </>
                        )}

                        {isAdmin() && (isCompleted || isCancelled) && (
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

          {/* Pinned Pagination for Classes (no per-page selector) */}
          {displayedSessions.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={displayedSessions.length}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => setCurrentPage(p)}
                itemLabel="classes"
                compact
              />
            </div>
          )}
        </div>
      ) : (
        /* Empty state if no master schedule mapped yet */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center bg-card/40">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">
            {isMember() ? "No Workout Classes Scheduled" : "No Scheduled Classes Yet"}
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {isMember()
              ? "There are currently no scheduled classes for your batch slot. Please check back soon or consult your coach."
              : "There are currently no scheduled classes for this batch."}
          </p>
          {!isMember() && (onOpenAddClasses ? (
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenAddClasses}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>Add Classes</span>
              </button>
            </div>
          ) : onCreateMasterSchedule ? (
            <div className="mt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={onCreateMasterSchedule}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Create New Program</span>
              </button>
            </div>
          ) : null)}
        </div>
      )}

      {/* Swap / Shuffle Modal (Phase 5) */}
      <ShuffleClassModal
        isOpen={isShuffleOpen}
        onClose={() => {
          setIsShuffleOpen(false);
          setShuffleSourceSessionId("");
        }}
        batch={batch}
        sessions={currentBatchSessions}
        initialSourceSessionId={shuffleSourceSessionId}
        onSuccess={onRefresh}
        allowRandomizeRange={false}
      />

      {/* Schedule History Audit Drawer (Phase 5) */}
      <ScheduleHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        batch={batch}
      />

      {/* Class Cancellation & Rescheduling Modal */}
      <ClassCancellationRescheduleModal
        isOpen={isCancellationModalOpen}
        onClose={() => {
          setIsCancellationModalOpen(false);
          setCancellationInitialSessionId("");
        }}
        batch={batch}
        sessions={currentBatchSessions}
        initialSessionId={cancellationInitialSessionId}
        onSuccess={onRefresh}
      />
    </div>
  );
}
