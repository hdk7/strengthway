import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  FileText,
} from "lucide-react";
import { isMember, isAdmin, isTrainer, getCurrentUser } from "@/auth/currentUser";
import { hasClassStarted } from "@/lib/batchUtils";

export default function SessionNotesModal(props) {
  if (!props.selectedSessionForNotes || typeof document === "undefined") {
    return null;
  }
  return <SessionNotesModalDialog {...props} />;
}

function SessionNotesModalDialog({
  selectedSessionForNotes,
  onClose,
  batch,
  trainers = [],
  sessionNotes = [],
  onSaveTrainerNote,
  initialTrainerId,
}) {
  const currentUser = useMemo(() => getCurrentUser() || {}, []);
  const isReadOnlyMember = isMember();
  const userIsAdmin = isAdmin();
  const userIsTrainer = isTrainer();
  const myTrainerId = currentUser.trainerId || currentUser.id;

  // ─── 1. Determine Assigned Trainers for this Class Session ─────────────────
  const assignedTrainers = useMemo(() => {
    const ids = new Set();
    if (Array.isArray(batch?.trainerIds)) {
      batch.trainerIds.forEach((tid) => tid && ids.add(tid));
    }
    if (selectedSessionForNotes?.coachId) {
      ids.add(selectedSessionForNotes.coachId);
    }
    // Also include logged-in trainer if assigned to session
    if (userIsTrainer && myTrainerId) {
      ids.add(myTrainerId);
    }

    const trainerMap = new Map();
    trainers.forEach((t) => {
      if (t?.id) trainerMap.set(t.id, t);
    });

    const list = Array.from(ids).map((tid) => {
      const match = trainerMap.get(tid);
      const name =
        match?.name ||
        `${match?.firstName || ""} ${match?.lastName || ""}`.trim() ||
        (selectedSessionForNotes?.coachId === tid ? selectedSessionForNotes.coachName : tid);
      return {
        id: tid,
        name,
        role: match?.role || "Faculty Coach",
      };
    });

    if (list.length === 0) {
      list.push({
        id: selectedSessionForNotes?.coachId || myTrainerId || "TRN-101",
        name: selectedSessionForNotes?.coachName || currentUser.name || "Assigned Coach",
        role: "Faculty Coach",
      });
    }

    return list;
  }, [batch, selectedSessionForNotes, trainers, userIsTrainer, myTrainerId, currentUser]);

  // ─── 2. Active Selected Trainer Tab ─────────────────────────────────────────
  const [activeTrainerId, setActiveTrainerId] = useState(() => {
    if (initialTrainerId && assignedTrainers.some((t) => t.id === initialTrainerId)) {
      return initialTrainerId;
    }
    if (userIsTrainer && assignedTrainers.some((t) => t.id === myTrainerId)) {
      return myTrainerId;
    }
    return assignedTrainers[0]?.id || "";
  });

  // Sync if assigned trainers change
  useEffect(() => {
    if (!assignedTrainers.some((t) => t.id === activeTrainerId)) {
      if (userIsTrainer && assignedTrainers.some((t) => t.id === myTrainerId)) {
        setActiveTrainerId(myTrainerId);
      } else {
        setActiveTrainerId(assignedTrainers[0]?.id || "");
      }
    }
  }, [assignedTrainers, activeTrainerId, userIsTrainer, myTrainerId]);

  // Find note for active trainer
  const activeNote = useMemo(() => {
    return (sessionNotes || []).find(
      (n) => n.sessionId === selectedSessionForNotes.id && n.trainerId === activeTrainerId
    );
  }, [sessionNotes, selectedSessionForNotes.id, activeTrainerId]);

  // ─── 3. Form State: Single Clean Session Note Field ─────────────────────────
  const [sessionNotesText, setSessionNotesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form inputs when switching trainer tab or note loads
  useEffect(() => {
    if (activeNote) {
      setSessionNotesText(activeNote.sessionSummary || "");
    } else {
      setSessionNotesText("");
    }
  }, [activeNote, activeTrainerId]);

  // ─── 4. Eligibility: Strictly for past completed classes or today's ongoing classes (NOT future classes) ─────
  const isEligibleForNotes = useMemo(() => {
    if (!selectedSessionForNotes) return false;
    if (selectedSessionForNotes.status === "CANCELLED") return false;
    if (selectedSessionForNotes.status === "COMPLETED") return true;
    return hasClassStarted(selectedSessionForNotes);
  }, [selectedSessionForNotes]);

  // ─── 5. 30-Day Deadline & Permission Checks ─────────────────────────────────
  const daysSinceSession = useMemo(() => {
    const rawDate = selectedSessionForNotes?.sessionDate;
    if (!rawDate) return 0;
    const [y, m, d] = String(rawDate).slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return 0;
    const schedDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((todayMidnight.getTime() - schedDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [selectedSessionForNotes?.sessionDate]);

  const isExpired30Days = daysSinceSession > 30;

  const canEditCurrentTrainerNote = useMemo(() => {
    if (isReadOnlyMember) return false;
    if (!isEligibleForNotes) return false; // Strictly disallowed for future or upcoming classes!
    if (userIsAdmin) return true;
    if (userIsTrainer) {
      if (myTrainerId && activeTrainerId && myTrainerId !== activeTrainerId) return false;
      if (isExpired30Days) return false;
      return true;
    }
    return false;
  }, [isReadOnlyMember, isEligibleForNotes, userIsAdmin, userIsTrainer, myTrainerId, activeTrainerId, isExpired30Days]);

  const activeTrainerObj = assignedTrainers.find((t) => t.id === activeTrainerId) || assignedTrainers[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEditCurrentTrainerNote || !isEligibleForNotes) {
      alert("Session notes are only allowed for past completed classes and today's ongoing classes.");
      return;
    }
    if (!sessionNotesText.trim()) {
      alert("Session note content is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveTrainerNote({
        sessionId: selectedSessionForNotes.id,
        trainerId: activeTrainerId,
        trainerName: activeTrainerObj?.name || activeTrainerId,
        sessionSummary: sessionNotesText.trim(),
        memberPerformance: "",
        observations: "",
        followUpRequired: false,
      });
      onClose();
    } catch {
      // Handled by toast in caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSubmittedNotes = useMemo(() => {
    return (sessionNotes || []).some(
      (n) => n.sessionId === selectedSessionForNotes?.id && n.sessionSummary && n.sessionSummary.trim().length > 0
    );
  }, [sessionNotes, selectedSessionForNotes?.id]);

  if (!isEligibleForNotes && !hasSubmittedNotes) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/80 bg-background/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                Class #{selectedSessionForNotes.classNumber}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedSessionForNotes.sessionDate} • {selectedSessionForNotes.timing || batch?.timingLabel || "Standard Schedule"}
              </span>
            </div>
            <h3 className="mt-1 font-bold text-foreground text-base sm:text-lg">
              {selectedSessionForNotes.subject || selectedSessionForNotes.className || "Scheduled Class Session"} — Session Notes
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Batch: <span className="font-semibold text-foreground">{batch?.name}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Multi-Trainer Navigation Strip (Visible whenever multiple trainers are assigned) */}
        {assignedTrainers.length > 1 && (
          <div className="border-b border-border/70 bg-card px-5 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <User size={13} />
              <span>Assigned Faculty:</span>
            </span>

            {assignedTrainers.map((t) => {
              const hasNote = (sessionNotes || []).some(
                (n) => n.sessionId === selectedSessionForNotes.id && n.trainerId === t.id && n.status === "SUBMITTED"
              );
              const isSelected = activeTrainerId === t.id;
              const isMyTab = userIsTrainer && t.id === myTrainerId;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTrainerId(t.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-primary text-background shadow-xs scale-[1.01]"
                      : "border border-border/80 bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{t.name}{isMyTab ? " (You)" : ""}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${
                      hasNote
                        ? isSelected
                          ? "bg-background/25 text-background"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : isSelected
                          ? "bg-background/25 text-background"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        hasNote ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span>{hasNote ? "Submitted" : "Pending"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Status & Deadline Notices */}
          {!isEligibleForNotes && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
              <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400">Upcoming / Future Class</p>
                <p className="text-amber-200/80 mt-0.5">
                  Session notes are strictly allowed for past completed classes and today&apos;s ongoing classes once the session begins.
                  Notes will unlock once this class starts on {selectedSessionForNotes.displayDate || selectedSessionForNotes.sessionDate}.
                </p>
              </div>
            </div>
          )}

          {userIsTrainer && isEligibleForNotes && isExpired30Days && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-200">
              <Lock size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400">30-Day Edit Deadline Expired</p>
                <p className="text-amber-200/80 mt-0.5">
                  Trainer session notes can only be modified within 30 days of the scheduled class ({selectedSessionForNotes.sessionDate}).
                  This log is now locked in archived view-only mode.
                </p>
              </div>
            </div>
          )}

          {userIsAdmin && isEligibleForNotes && isExpired30Days && (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 flex items-center gap-2 text-xs text-foreground">
              <Clock size={15} className="text-primary shrink-0" />
              <span>
                The 30-day edit window has expired for coaches. You have administrative override permissions to edit or audit this record.
              </span>
            </div>
          )}

          {/* Note Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-background/50 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">
                {userIsTrainer && activeTrainerId === myTrainerId
                  ? "My Notes"
                  : `Coach: ${activeTrainerObj?.name}`}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono text-muted-foreground">{activeTrainerId}</span>
              {userIsTrainer && activeTrainerId !== myTrainerId && (
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border/70 px-2 py-0.5 rounded-md">
                  Read-Only • Another Coach&apos;s Note
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeNote ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 size={13} />
                  <span>Submitted</span>
                </span>
              ) : !isEligibleForNotes ? (
                <span className="inline-flex items-center gap-1 font-bold text-muted-foreground bg-muted border border-border/60 px-2.5 py-1 rounded-lg">
                  <Clock size={13} />
                  <span>Upcoming (Locked)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <AlertCircle size={13} />
                  <span>Notes Pending</span>
                </span>
              )}
            </div>
          </div>

          {/* Single Clean Session Notes Form */}
          <form id="trainer-note-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Session Notes *</span>
                {canEditCurrentTrainerNote && (
                  <span className="text-[10px] font-normal text-muted-foreground">Required</span>
                )}
              </label>
              {canEditCurrentTrainerNote ? (
                <textarea
                  rows={6}
                  required
                  value={sessionNotesText}
                  onChange={(e) => setSessionNotesText(e.target.value)}
                  placeholder="Enter session summary, workout delivery, athlete progress, floor pacing, or notes for today's class..."
                  className="w-full rounded-2xl border border-border bg-background p-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
                />
              ) : (
                <div className="min-h-[120px] rounded-2xl border border-border/80 bg-background/60 p-4 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {sessionNotesText || (!isEligibleForNotes ? "Session notes are not available for future upcoming classes. Notes will unlock once this class starts." : userIsTrainer && activeTrainerId !== myTrainerId ? `No session notes recorded yet by Coach ${activeTrainerObj?.name || activeTrainerId}.` : "No session notes recorded.")}
                </div>
              )}
            </div>

            {/* Audit Metadata */}
            {activeNote && (
              <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                <span>
                  Submitted: {activeNote.submittedAt ? new Date(activeNote.submittedAt).toLocaleString() : "Recently"}
                </span>
                {activeNote.lastUpdatedBy && (
                  <span>
                    Last updated by <strong className="text-foreground">{activeNote.lastUpdatedBy}</strong> ({activeNote.lastUpdatedRole || "user"})
                  </span>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-background/50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            {!isEligibleForNotes ? (
              <span className="text-amber-400 font-semibold">Locked (Upcoming class)</span>
            ) : canEditCurrentTrainerNote ? (
              <span>Saving as <strong className="text-foreground">{currentUser.name || "User"}</strong></span>
            ) : (
              <span>Read-only view</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
            >
              Close
            </button>

            {canEditCurrentTrainerNote && (
              <button
                type="submit"
                form="trainer-note-form"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-background px-5 py-2 text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-sm transition-all disabled:opacity-50"
              >
                <FileText size={13} />
                <span>{isSubmitting ? "Saving..." : activeNote ? "Update Note" : "Submit Note"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
