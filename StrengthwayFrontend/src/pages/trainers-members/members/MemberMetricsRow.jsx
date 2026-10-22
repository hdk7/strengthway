import { Users, Archive } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";

export default function MemberMetricsRow({ stats, statusFilter, onStatusFilterChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
      <KpiCard
        title="Total Enrolled"
        value={stats.total}
        subtext="Registered in gym"
        icon={Users}
        colorScheme="terracotta"
        onClick={() => onStatusFilterChange("All")}
        className={statusFilter === "All" ? "border-accent ring-1 ring-accent/30" : ""}
      />
      <KpiCard
        title="Archived / Deleted"
        value={stats.archived}
        subtext="Click to view & restore"
        icon={Archive}
        colorScheme="rose"
        onClick={() => onStatusFilterChange("Archived")}
        className={statusFilter === "Archived" ? "border-destructive ring-1 ring-destructive/30" : ""}
      />
    </div>
  );
}
