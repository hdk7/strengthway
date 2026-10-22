/* eslint-disable max-lines */
import { useState } from "react";
import {
  Calendar,
  Clock,
  Layers,
  UserCheck,
  UserX,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";
import SubstituteCoachModal from "@/pages/batches/detail/SubstituteCoachModal";

export function AffectedSessionsModal({
  isOpen,
  onClose,
  leave,
  sessions = [],
  onSubstituteAssigned,
}) {
  const [activeSubstituteSession, setActiveSubstituteSession] = useState(null);

  if (!isOpen || !leave) return null;

  const handleOpenSubstituteModal = (session) => {
    setActiveSubstituteSession(session);
  };

  const handleSubstituteSuccess = () => {
    setActiveSubstituteSession(null);
    if (onSubstituteAssigned) onSubstituteAssigned();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150">
        <div onClick={onClose} className="fixed inset-0 bg-transparent" />
        <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Affected Batch Sessions During Leave
                </h3>
                <p className="text-xs text-muted-foreground">
                  Leave approved for <strong className="text-foreground">{leave.trainerName}</strong> (
                  {leave.approvedStartDate || leave.leaveStartDate} to{" "}
                  {leave.approvedEndDate || leave.leaveEndDate}). Decide whether substitute coaches are required.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Operational Policy Note */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" />
              <span>Coverage Governance:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              The faculty trainer is marked unavailable for the approved leave duration. Substitutes are{" "}
              <strong>never automatically assigned</strong>. You can assign eligible replacement coaches below or confirm
              that existing floor coaches will cover without a formal replacement.
            </p>
          </div>

          {/* Sessions List */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
            {sessions.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/80 bg-background/50">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <h4 className="text-sm font-bold text-foreground">No Conflicting Batch Sessions</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {leave.trainerName} has no scheduled class sessions during this approved leave window.
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const hasSub = Boolean(session.isSubstituted && session.substituteCoachId);
                return (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-background hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {session.batchName || session.batchId}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {session.sessionDate}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {session.timing || `${session.startTime} - ${session.endTime}`}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Class: {session.className || `Class #${session.classNumber || 1}`}</span>
                        <span>•</span>
                        {hasSub ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <UserCheck size={12} />
                            Substitute: {session.substituteCoachName}
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <UserX size={12} />
                            Coverage Required
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenSubstituteModal(session)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                          hasSub
                            ? "border border-border bg-card hover:bg-muted text-foreground"
                            : "bg-primary text-background hover:bg-primary/90"
                        }`}
                      >
                        <UserCheck size={13} />
                        <span>{hasSub ? "Change Substitute" : "Assign Substitute"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/70">
            <span className="text-xs text-muted-foreground">
              {sessions.length} affected session{sessions.length === 1 ? "" : "s"} identified
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>

      {/* Substitute Coach Modal */}
      {activeSubstituteSession && (
        <SubstituteCoachModal
          isOpen={Boolean(activeSubstituteSession)}
          onClose={() => setActiveSubstituteSession(null)}
          session={activeSubstituteSession}
          batch={{
            id: activeSubstituteSession.batchId,
            name: activeSubstituteSession.batchName,
          }}
          onSuccess={handleSubstituteSuccess}
        />
      )}
    </>
  );
}

export default AffectedSessionsModal;
