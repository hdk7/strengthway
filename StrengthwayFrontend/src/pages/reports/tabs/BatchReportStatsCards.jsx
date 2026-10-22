import { Boxes, Users, UserCheck } from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";

export function BatchReportStatsCards({ batchesReport, filteredBatches }) {
  return (
    <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <KpiCard
        title="Active Batches"
        value={batchesReport?.summary?.totalBatches ?? filteredBatches.length}
        subtext="containers"
        icon={Boxes}
        colorScheme="terracotta"
      />
      <KpiCard
        title="Primary Enrolled"
        value={batchesReport?.summary?.totalEnrolledPrimary ?? 0}
        subtext="athletes"
        icon={Users}
        colorScheme="sky"
      />
      <KpiCard
        title="Active Flex Passes"
        value={batchesReport?.summary?.totalActiveFlexPasses ?? 0}
        subtext="roster adds"
        icon={UserCheck}
        colorScheme="emerald"
      />
    </div>
  );
}
