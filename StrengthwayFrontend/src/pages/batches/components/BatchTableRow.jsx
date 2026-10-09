import { Clock, Eye, Edit3, Trash2 } from "lucide-react";

const SHORT_DAYS_MAP = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export function BatchTableRow({
  batch: b,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="group transition-all duration-150 hover:-translate-y-px">
      {/* Batch ID */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border/40">
          #{b.id?.length > 7 ? b.id.slice(-6).toUpperCase() : b.id}
        </span>
      </td>

      {/* Batch Name */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
        <div
          onClick={() => onView(b.id)}
          className="font-bold text-foreground text-xs sm:text-sm hover:text-accent hover:underline cursor-pointer transition-colors"
        >
          {b.name}
        </div>
      </td>

      {/* Timing */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
          <Clock size={12} className="text-amber-600/80 dark:text-amber-400 shrink-0" />
          <span>{b.startTime || b.timingLabel}</span>
        </div>
      </td>

      {/* Days */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
        <span className="inline-flex items-center rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-foreground">
          {b.daysPattern === "MWF"
            ? "M W F"
            : b.daysPattern === "TTS"
              ? "T T S"
              : b.daysList
                  ?.map((d) => SHORT_DAYS_MAP[d] || d.slice(0, 3))
                  .join(" • ") || b.daysPattern}
        </span>
      </td>

      {/* Max Pax */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center font-bold text-foreground">
        {b.maxPax}
      </td>

      {/* Enrolled */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{b.currentPax || 0}</span>
        <span className="text-xs text-muted-foreground"> / {b.maxPax}</span>
      </td>

      {/* Status */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
            b.status === "Inactive"
              ? "bg-muted/60 text-muted-foreground border-border/60"
              : "bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${b.status === "Inactive" ? "bg-muted-foreground" : "bg-emerald-500"}`} />
          {b.status || "Active"}
        </span>
      </td>

      {/* Actions */}
      <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onView(b.id)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="View Details & Schedule"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(b)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Edit Batch"
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(b.id, b.name)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            title="Delete Batch"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
