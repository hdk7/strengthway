import { Boxes, Users, ArrowUpRight, Plus } from "lucide-react";
import { hasClassStarted } from "@/lib/batchUtils";

export function BatchTrackingTab({
  viewingBatchTracking,
  viewingSchedule,
  onOpenAssignModal,
  navigate,
  handleUpdateBatchSessionStatus,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
            Separate Batch-Wise Tracking ({viewingBatchTracking.length} Batches)
          </h3>
          <p className="text-xs text-muted-foreground">
            Each batch tracks this reusable program independently. Updating session
            status for one batch does not affect others.
          </p>
        </div>

        <button
          onClick={() => onOpenAssignModal(viewingSchedule)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          <Users size={14} />
          <span>Assign More Batches</span>
        </button>
      </div>

      {viewingBatchTracking.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Boxes size={32} className="mx-auto text-muted-foreground mb-2" />
          <h4 className="font-bold text-foreground text-sm">
            No Batches Assigned Yet
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            This program is currently an unassigned reusable template. Assign it to
            one or more batches to start tracking batch classes.
          </p>
          <button
            onClick={() => onOpenAssignModal(viewingSchedule)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-background cursor-pointer hover:bg-primary/90"
          >
            <Plus size={14} />
            <span>Assign Batches Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {viewingBatchTracking.map((batchTrack) => (
            <div
              key={batchTrack.batchId}
              className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4"
            >
              {/* Batch Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    <Boxes size={16} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">
                        {batchTrack.batchName}
                      </h4>
                      <span className="rounded-md bg-muted border border-border/70 px-2 py-0.5 text-xs font-semibold text-foreground">
                        {batchTrack.timing}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {batchTrack.daysLabel} • {batchTrack.currentPax} /{" "}
                      {batchTrack.maxPax} Members
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/batches/${batchTrack.batchId}`)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>View Batch Page</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>

              {/* Batch Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-foreground">
                    Batch Cycle Progress: {batchTrack.completed} of{" "}
                    {batchTrack.totalSessions} Classes Completed
                  </span>
                  <span className="font-extrabold text-primary">
                    {batchTrack.percentComplete}%
                  </span>
                </div>
                <div className="w-full bg-muted border border-border/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 rounded-full"
                    style={{ width: `${batchTrack.percentComplete}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{batchTrack.completed} Completed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>{batchTrack.today} Today</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>{batchTrack.scheduled} Scheduled</span>
                  </span>
                </div>
              </div>

              {/* Batch Sessions List */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] uppercase font-bold text-muted-foreground block">
                  Floor Sessions for {batchTrack.batchName} (
                  {batchTrack.sessions.length}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-55 overflow-y-auto pr-1">
                  {batchTrack.sessions.map((session) => {
                    const isComp = session.status === "COMPLETED";
                    const isTod = session.status === "TODAY";
                    const isCanc = session.status === "CANCELLED";
                    const canComplete = hasClassStarted(session);

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background text-xs"
                      >
                        <div className="truncate mr-2">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span className="text-primary font-extrabold">
                              #{String(session.classNumber).padStart(2, "0")}
                            </span>
                            <span className="truncate">{session.subject}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {session.displayDate ||
                              session.sessionDate ||
                              "Scheduled Date"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              isComp
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : isTod
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                                  : isCanc
                                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            }`}
                          >
                            {session.status}
                          </span>

                          <select
                            value={session.status}
                            onChange={(e) =>
                              handleUpdateBatchSessionStatus(
                                session.id,
                                e.target.value,
                                session,
                              )
                            }
                            className="text-[10px] rounded-lg border border-border bg-card px-1.5 py-0.5 text-foreground cursor-pointer focus:outline-none"
                            title="Update session status specifically for this batch"
                          >
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="TODAY">Today</option>
                            <option value="COMPLETED" disabled={!canComplete}>
                              Completed{!canComplete ? " (Not Started)" : ""}
                            </option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
