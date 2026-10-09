export function BatchReportStatsCards({ batchesReport, filteredBatches }) {
  return (
    <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Active Batches
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-foreground">
            {batchesReport?.summary?.totalBatches ?? filteredBatches.length}
          </span>
          <span className="text-xs text-muted-foreground">containers</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Primary Enrolled
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-foreground">
            {batchesReport?.summary?.totalEnrolledPrimary ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">athletes</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Active Flex Passes
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-foreground">
            {batchesReport?.summary?.totalActiveFlexPasses ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">roster adds</span>
        </div>
      </div>
    </div>
  );
}
