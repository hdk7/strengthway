import { Link } from "react-router-dom";
import {
  Search,
  ExternalLink,
  Layers,
  Clock,
  CheckCircle2,
  Repeat,
  Users,
} from "lucide-react";

export function TrainerDailyRoster({
  searchQuery,
  setSearchQuery,
  isLoading,
  paginatedTrainers,
  trainerLogs,
  batches,
  selectedDate,
  handleOpenSubstituteModal,
  handleQuickMark,
}) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search faculty by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0 p-3 sm:p-4 no-scrollbar">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
            <p className="mt-3 text-xs font-semibold">Loading faculty roster…</p>
          </div>
        ) : paginatedTrainers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {paginatedTrainers.map((trainer) => {
              const logsForTrainer = trainerLogs.filter(
                (l) => l.trainerId === trainer.id || l.substituteTrainerId === trainer.id
              );
              const assignedBatchObjects = batches.filter((b) =>
                trainer.batchIds?.includes(b.id)
              );

              return (
                <div
                  key={trainer.id}
                  className="rounded-3xl border border-border/80 bg-background/60 p-5 sm:p-6 space-y-4 hover:border-accent/40 transition-all shadow-xs"
                >
                  {/* Trainer Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent font-bold text-sm uppercase">
                        {trainer.name?.[0] || "T"}
                      </div>
                      <div>
                        <Link
                          to={`/admin/trainers-members/trainers/${trainer.id}`}
                          className="font-bold text-foreground text-sm hover:text-accent transition-colors flex items-center gap-1.5"
                        >
                          <span>{trainer.name}</span>
                          <ExternalLink size={12} className="text-muted-foreground" />
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                          <span>ID: {trainer.id}</span>
                          <span>•</span>
                          <span className="text-foreground font-semibold">
                            {trainer.shift || "General Shift"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        trainer.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {trainer.status || "Active"}
                    </span>
                  </div>

                  {/* Assigned Batches Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Assigned Containers
                    </span>
                    {assignedBatchObjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedBatchObjects.map((b) => (
                          <Link
                            key={b.id}
                            to={`/admin/batches/${b.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-card border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                          >
                            <Layers size={11} className="text-accent" />
                            <span>{b.name}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No containers assigned
                      </span>
                    )}
                  </div>

                  {/* Today's Logged Conductions */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Logged Conduction for {selectedDate}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {logsForTrainer.length} {logsForTrainer.length === 1 ? "Class" : "Classes"}
                      </span>
                    </div>

                    {logsForTrainer.length > 0 ? (
                      <div className="space-y-2">
                        {logsForTrainer.map((l, idx) => {
                          const isSub = l.status === "SUBSTITUTE" || l.substituteTrainerId;
                          const isSteppedIn = l.substituteTrainerId === trainer.id;

                          return (
                            <div
                              key={l.id || idx}
                              className="rounded-2xl border border-border/80 bg-card p-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-foreground">
                                    {l.batchName || l.batchId}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.2 text-[9px] font-extrabold ${
                                      l.status === "CONDUCTED"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : isSub
                                        ? "bg-amber-500/10 text-amber-400"
                                        : "bg-rose-500/10 text-rose-400"
                                    }`}
                                  >
                                    {l.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <Clock size={11} className="text-accent" />
                                  <span>{l.checkInTime || "Logged"}</span>
                                  <span>•</span>
                                  <span>{l.attendeesCount || 0} Athletes</span>
                                  {isSteppedIn && (
                                    <span className="text-amber-400 font-semibold">
                                      (Subbed for {l.trainerName || l.trainerId})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenSubstituteModal(trainer, l.batchId)}
                                className="rounded-xl border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                Edit Log
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 p-3 text-center text-xs text-muted-foreground">
                        No coaching sessions logged yet today.
                      </div>
                    )}
                  </div>

                  {/* Single-Click Conduction Actions */}
                  <div className="pt-2 border-t border-border/40 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleQuickMark(trainer, trainer.batchIds?.[0], "CONDUCTED")}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 size={13} />
                      <span>Conducted</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSubstituteModal(trainer, trainer.batchIds?.[0])}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <Repeat size={13} />
                      <span>Assign Substitute</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickMark(trainer, trainer.batchIds?.[0], "ABSENT")}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickMark(trainer, trainer.batchIds?.[0], "LEAVE")}
                      className="rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
            <Users size={32} className="mx-auto text-muted-foreground/60" />
            <h4 className="text-sm font-bold text-foreground">No Faculty Found</h4>
            <p className="text-xs text-muted-foreground">
              No trainers found matching the selected shift and search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
