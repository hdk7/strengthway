import { Clock, ArrowRight, Edit3, Trash2 } from "lucide-react";

export function BatchGridCard({
  batch: b,
  onView,
  onEdit,
  onDelete,
}) {
  const cap = b.maxPax || 28;
  const pax = b.currentPax || 0;
  const pct = Math.min(100, Math.round((pax / cap) * 100));
  const remaining = Math.max(0, cap - pax);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-foreground/30 hover:shadow-sm">
      <div className="space-y-3">
        {/* Header & Status */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">{b.name}</h3>
            <p className="text-xs text-muted-foreground">{b.daysLabel}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
              b.status === "Inactive"
                ? "bg-muted text-muted-foreground border-border"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {b.status !== "Inactive" && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {b.status || "Active"}
          </span>
        </div>

        {/* Timing */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground">
          <Clock size={15} className="text-muted-foreground shrink-0" />
          <span>{b.timingLabel}</span>
        </div>

        {/* Capacity Gauge */}
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Capacity Occupancy</span>
            <span className="font-bold text-foreground">
              {pax} / {cap}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {remaining} seats left for registration
          </p>
        </div>

        {/* Trainers */}
        <div className="flex items-center justify-between border-t border-border/80 pt-2.5 text-xs">
          <span className="text-muted-foreground">Assigned Trainers:</span>
          <span className="font-semibold text-foreground">
            {Array.isArray(b.trainerIds) ? b.trainerIds.length : 0} Trainer
            {b.trainerIds?.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-2.5 border-t border-border flex items-center gap-2">
        <button
          type="button"
          onClick={() => onView(b.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={() => onEdit(b)}
          className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Edit Batch"
        >
          <Edit3 size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(b.id, b.name)}
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
          title="Delete Batch"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
