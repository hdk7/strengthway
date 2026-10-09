/* eslint-disable max-lines */
import { Link } from "react-router-dom";
import {
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
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
             
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Class delivery execution, total coaching hours on gym floor, and athlete turnouts.
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
    </div>
  );
}
