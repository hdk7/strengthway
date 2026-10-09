import { Link } from "react-router-dom";
import {
  Layers,
  Search,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { BatchReportStatsCards } from "./BatchReportStatsCards";

export function BatchesReportTab({
  batchesReport,
  filteredBatches,
  batchSearch,
  setBatchSearch,
  selectedBatchFilter,
  setSelectedBatchFilter,
  allBatchesList,
  occupancyThreshold,
  setOccupancyThreshold,
  isLoading,
  formatMonthTitle,
  selectedMonth,
  paginatedBatches,
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* Executive KPI Summary Cards */}
      <BatchReportStatsCards
        batchesReport={batchesReport}
        filteredBatches={filteredBatches}
      />


      {/* Filters & Search Control Bar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search batch by name, timing, or code..."
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Batch Container Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">Container:</span>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Active Batches</option>
              {allBatchesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.timingLabel || b.timing})
                </option>
              ))}
            </select>
          </div>

          {/* Occupancy Threshold */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-muted-foreground">Utilization:</span>
            <select
              value={occupancyThreshold}
              onChange={(e) => setOccupancyThreshold(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Levels</option>
              <option value="HIGH">High Congestion (≥ 90%)</option>
              <option value="OPTIMAL">Optimal (60% - 89%)</option>
              <option value="LOW">Low Utilization (&lt; 60%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Analytics Table */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Batch Container</th>
                <th className="py-3 px-4">Schedule & Days</th>
                <th className="py-3 px-4 text-center">Pax (Primary + Flex / Max)</th>
                <th className="py-3 px-4 text-center">Occupancy Rate</th>
                <th className="py-3 px-4 text-center">Capacity Headroom</th>
                <th className="py-3 px-4 text-center">Flex In : Out</th>
                <th className="py-3 px-4 text-center">Sessions (Done / Sched)</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-accent" />
                      <span className="font-semibold text-xs">Computing batch analytics for {formatMonthTitle(selectedMonth)}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Layers size={32} className="mx-auto text-muted-foreground/50" />
                      <p className="font-bold text-foreground">No batch reports match the filters</p>
                      <p className="text-xs">Try selecting a different month or adjusting search queries.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((b) => {
                  const occ = b.occupancyPercent || 0;
                  const headroom = b.capacityHeadroom ?? Math.max(0, b.maxPax - (b.primaryPax + b.flexInPax));
                  return (
                    <tr key={b.batchId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <Link
                            to={`/admin/batches/${b.batchId}`}
                            className="font-bold text-foreground hover:text-accent flex items-center gap-1.5"
                          >
                            <span>{b.name}</span>
                            <ExternalLink size={12} className="text-muted-foreground" />
                          </Link>
                          <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                            {b.batchId} {b.shortName ? `• ${b.shortName}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground block">{b.timingLabel}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">{b.daysLabel}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold">
                          <span className="text-foreground">{b.primaryPax}</span>
                          {b.flexInPax > 0 && (
                            <span className="rounded-full bg-accent/15 text-accent px-1.5 py-0.2 text-[10px]">
                              +{b.flexInPax} flex
                            </span>
                          )}
                          <span className="text-muted-foreground">/ {b.maxPax}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-28 mx-auto space-y-1">
                          <div className="flex justify-between text-[11px] font-extrabold">
                            <span className={
                              occ >= 90 ? "text-destructive" : occ >= 70 ? "text-accent" : "text-emerald-500"
                            }>
                              {occ}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {occ >= 95 ? "FULL" : occ >= 80 ? "HIGH" : "OPEN"}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                occ >= 90 ? "bg-destructive" : occ >= 75 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, occ)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            headroom <= 1
                              ? "bg-destructive/15 text-destructive"
                              : headroom <= 4
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {headroom} spots
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        <span className="font-bold text-accent">{b.flexInPax || 0}</span>
                        <span className="text-muted-foreground"> in / </span>
                        <span className="font-bold text-muted-foreground">{b.flexOutPax || 0}</span>
                        <span className="text-muted-foreground"> out</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-foreground">{b.completedSessions || 0}</span>
                        <span className="text-muted-foreground"> / {b.totalSessions || 0}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground">
                          {b.attendanceRate || 0}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}