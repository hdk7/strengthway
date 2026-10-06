import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft, Clock, Calendar } from "lucide-react";

export default function BatchDetailHeader({
  batch,
  formattedMonthLabel,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
}) {
  return (
    <>
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/batches" className="hover:text-foreground transition-colors">
          Batches
        </Link>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="font-semibold text-foreground">{batch?.shortName || batch?.name}</span>
      </nav>

      {/* 2. Hero Card matching requirement wireframe */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all">
        {/* Glow Accent Effect */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            {/* Title & Status Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {batch?.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            {/* Timings & Days */}
            <div className="space-y-1.5 text-sm sm:text-base">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Clock size={16} className="text-muted-foreground shrink-0" />
                <span>{batch?.timingLabel}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={16} className="text-muted-foreground shrink-0" />
                <span>{batch?.daysLabel}</span>
              </div>
            </div>
          </div>

          {/* Month Selector Component in Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 z-10">
            <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-1.5 shadow-sm">
              <button
                type="button"
                onClick={onPrevMonth}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1 text-xs sm:text-sm font-bold text-foreground min-w-35 justify-center">
                <Calendar size={15} className="text-primary shrink-0" />
                <span>{formattedMonthLabel}</span>
              </div>
              <button
                type="button"
                onClick={onNextMonth}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={onCurrentMonth}
                className="ml-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
