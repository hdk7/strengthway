import { Users, Archive } from "lucide-react";

export default function MemberMetricsRow({ stats, statusFilter, onStatusFilterChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
      {/* Total Members */}
      <div
        onClick={() => onStatusFilterChange("All")}
        className={`rounded-xl border bg-card p-2 sm:p-2.5 shadow-xs cursor-pointer transition-all hover:border-accent/40 ${
          statusFilter === "All" ? "border-accent ring-1 ring-accent/30" : "border-border"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Enrolled
          </span>
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
            <Users size={14} />
          </div>
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            {stats.total}
          </span>
          <span className="text-[11px] text-muted-foreground">Registered in gym</span>
        </div>
      </div>

      {/* Archived (Soft Deleted) */}
      <div
        onClick={() => onStatusFilterChange("Archived")}
        className={`rounded-xl border bg-card p-2 sm:p-2.5 shadow-xs cursor-pointer hover:border-accent/40 transition-colors ${
          statusFilter === "Archived"
            ? "border-destructive ring-1 ring-destructive/30"
            : "border-border"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Archived / Deleted
          </span>
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <Archive size={14} />
          </div>
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
            {stats.archived}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Click to view & restore
          </span>
        </div>
      </div>
    </div>
  );
}
