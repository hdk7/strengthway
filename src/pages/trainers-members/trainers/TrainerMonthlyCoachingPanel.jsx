/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import {
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  Clock,
  Repeat,
  Layers,
  TrendingUp,
} from "lucide-react";

export function TrainerMonthlyCoachingPanel({
  id,
  selectedMonth,
  setSelectedMonth,
  formattedSelectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleCurrentMonth,
  coachingSummary,
  activelyCoachedBatches,
  substituteSessions,
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-8">
      {/* Header with Title and Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Monthly Coaching & Class Conduction
              </h3>
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent border border-accent/20">
                Performance Ledger
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Class delivery execution, total coaching hours on gym floor, athlete turnouts, and substitute session logs.
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="relative px-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                title="Select Month"
              />
              <span className="text-xs font-bold text-foreground font-mono cursor-pointer select-none">
                {formattedSelectedMonth}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Current
          </button>
        </div>
      </div>


      {/* 2. Batches Actively Coached This Month */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-accent" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Batches Actively Coached This Month ({formattedSelectedMonth})
            </h4>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {activelyCoachedBatches.length} Containers
          </span>
        </div>

        {activelyCoachedBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activelyCoachedBatches.map((b) => {
              const maxPax = b.maxPax || 25;
              const currentPax = b.currentPax || 0;
              const pct = Math.min(Math.round((currentPax / maxPax) * 100), 100);

              return (
                <div
                  key={b.id}
                  className="group rounded-2xl border border-border/70 bg-background/60 p-4.5 space-y-3 transition-all hover:border-accent/40 hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/admin/batches/${b.id}`}
                        className="font-bold text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{b.name}</span>
                        <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                      </Link>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        ID: {b.id}
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={13} className="text-accent shrink-0" />
                      <span className="truncate">{b.timingLabel || "Standard Schedule"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={13} className="text-accent shrink-0" />
                      <span className="truncate">{b.daysLabel || "Weekly Days"}</span>
                    </div>
                  </div>

                  {/* Capacity Indicator */}
                  <div className="pt-2 border-t border-border/40 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Enrolled Capacity</span>
                      <span className="font-semibold text-foreground">
                        {currentPax} / {maxPax} Athletes ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 90
                            ? "bg-rose-500"
                            : pct >= 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No batch containers currently assigned to this coach.
          </div>
        )}
      </div>

      {/* 3. Substitute Coaching Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-amber-500" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Substitute Coaching Log ({formattedSelectedMonth})
            </h4>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {substituteSessions.length} {substituteSessions.length === 1 ? "Session" : "Sessions"}
          </span>
        </div>

        {substituteSessions.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-95 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 sm:px-5">Session Date & Time</th>
                  <th className="py-2.5 px-4 sm:px-5">Batch Container</th>
                  <th className="py-2.5 px-4 sm:px-5">Coverage Nature</th>
                  <th className="py-2.5 px-4 sm:px-5">Assigned / Substitute Coach</th>
                  <th className="py-2.5 px-4 sm:px-5 text-center">Attendees</th>
                  <th className="py-2.5 px-4 sm:px-5 text-right">Status / Notes</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm font-medium">
                {substituteSessions.map((log, idx) => {
                  const isSteppedIn = log.substituteTrainerId === id || log.trainerId !== id;

                  return (
                    <tr key={log.id || idx} className="group transition-all duration-150 hover:-translate-y-px">
                      {/* Date & Time */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="font-mono font-medium text-foreground">
                          {log.date}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          {log.checkInTime || "Scheduled Session"}
                        </span>
                      </td>

                      {/* Batch Container */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                        <Link
                          to={`/admin/batches/${log.batchId}`}
                          className="font-bold text-foreground hover:text-accent transition-colors flex items-center gap-1"
                        >
                          <span>{log.batchName || log.batchId}</span>
                          <ExternalLink size={11} className="text-muted-foreground shrink-0" />
                        </Link>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {log.batchId}
                        </span>
                      </td>

                      {/* Coverage Nature */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            isSteppedIn
                              ? "bg-accent/10 text-accent border-accent/30"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          }`}
                        >
                          {isSteppedIn ? (
                            <>
                              <Check size={11} />
                              <span>Stepped In as Substitute</span>
                            </>
                          ) : (
                            <>
                              <Repeat size={11} />
                              <span>Covered by Substitute</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Coach names */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div className="text-xs">
                          <span className="font-semibold text-foreground">
                            {isSteppedIn
                              ? `Covering for: ${log.trainerName || log.trainerId}`
                              : `Substituted by: ${log.substituteTrainerName || log.substituteTrainerId || "Substitute Coach"}`}
                          </span>
                        </div>
                      </td>

                      {/* Attendees */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <span className="font-bold text-foreground font-mono">
                          {log.attendeesCount || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {log.durationMinutes || 60}m
                        </span>
                      </td>

                      {/* Status / Notes */}
                      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 px-2.5 py-0.5 text-[10px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {log.status || "CONDUCTED"}
                        </span>
                        {log.notes && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate max-w-xs ml-auto" title={log.notes}>
                            {log.notes}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No substitute coaching sessions recorded for {formattedSelectedMonth}. All scheduled classes were conducted as planned.
          </div>
        )}
      </div>
    </div>
  );
}
