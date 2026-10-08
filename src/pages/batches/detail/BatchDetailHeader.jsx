import { Clock, Calendar } from "lucide-react";

export default function BatchDetailHeader({ batch }) {
  return (
    <>
      {/* Hero Card matching requirement wireframe */}
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
        </div>
      </div>
    </>
  );
}
