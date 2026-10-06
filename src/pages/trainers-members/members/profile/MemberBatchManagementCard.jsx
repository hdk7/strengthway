import { Link } from "react-router-dom";
import {
  Layers,
  ArrowRightLeft,
  ExternalLink,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";
import { MemberAttendanceCalendar } from "./MemberAttendanceCalendar";
import { MemberBatchHistoryTable } from "./MemberBatchHistoryTable";

export function MemberBatchManagementCard({
  primaryBatchDetails,
  activeFlexPasses,
  setTransferModalTab,
  setIsTransferModalOpen,
  selectedMonth,
  setSelectedMonth,
  formattedSelectedMonth,
  handlePrevMonth,
  handleNextMonth,
  handleCurrentMonth,
  attendanceSummary,
  calendarDays,
  assignmentHistory,
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-8">
      {/* Card Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Batch Assignments & History
              </h3>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/20">
                Container Management
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current batch container allocation, active flexible passes, month-wise attendance tracking, and transition audit trail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTransferModalTab("transfer");
              setIsTransferModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowRightLeft size={14} />
            <span>Transfer Batch / Flex Pass</span>
          </button>
        </div>
      </div>

      {/* 1. Current Assignments Badges (Primary Allocation & Active Flex Passes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Primary Batch Container Tile */}
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Primary Batch Allocation
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Primary Active
            </span>
          </div>

          {primaryBatchDetails ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/admin/batches/${primaryBatchDetails.id}`}
                    className="text-base font-bold text-foreground hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    <span>{primaryBatchDetails.name}</span>
                    <ExternalLink size={13} className="text-muted-foreground" />
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Batch ID: {primaryBatchDetails.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-2 rounded-xl bg-card border border-border/60 p-2.5">
                  <Clock size={14} className="text-accent shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Timing
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {primaryBatchDetails.timingLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-card border border-border/60 p-2.5">
                  <Calendar size={14} className="text-accent shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                      Days
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {primaryBatchDetails.daysLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">No primary batch currently allocated.</p>
              <button
                type="button"
                onClick={() => {
                  setTransferModalTab("transfer");
                  setIsTransferModalOpen(true);
                }}
                className="mt-2 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowRightLeft size={12} />
                <span>Assign Primary Batch</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Flex Passes Tile */}
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Temporary Flex Passes
              </span>
            </div>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-500">
              {activeFlexPasses.length} Active {activeFlexPasses.length === 1 ? "Pass" : "Passes"}
            </span>
          </div>

          {activeFlexPasses.length > 0 ? (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {activeFlexPasses.map((pass, idx) => (
                <div
                  key={pass.id || idx}
                  className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/admin/batches/${pass.targetBatchId}`}
                      className="text-xs font-bold text-foreground hover:text-amber-500 transition-colors flex items-center gap-1"
                    >
                      <span>{pass.targetBatchName || pass.targetBatchId}</span>
                      <ExternalLink size={11} className="text-muted-foreground" />
                    </Link>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {pass.startDate} → {pass.endDate || "Ongoing"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
                      Permitted Days:
                    </span>
                    {Array.isArray(pass.selectedDays) && pass.selectedDays.length > 0 ? (
                      pass.selectedDays.map((day) => (
                        <span
                          key={day}
                          className="rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400"
                        >
                          {day.slice(0, 3)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">All batch days</span>
                    )}
                  </div>

                  {pass.reason && (
                    <p className="text-[11px] text-muted-foreground italic border-t border-amber-500/15 pt-1.5">
                      "{pass.reason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No active temporary flex passes. Member is authorized solely for primary batch sessions.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTransferModalTab("flex");
                  setIsTransferModalOpen(true);
                }}
                className="mt-2 text-xs font-semibold text-amber-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Grant Flex Pass</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Month-Wise Attendance History & Visual Day-by-Day Calendar Pills */}
      <MemberAttendanceCalendar
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        formattedSelectedMonth={formattedSelectedMonth}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        handleCurrentMonth={handleCurrentMonth}
        attendanceSummary={attendanceSummary}
        calendarDays={calendarDays}
      />

      {/* 3. Batch Assignment History Ledger (Audit Trail) */}
      <MemberBatchHistoryTable assignmentHistory={assignmentHistory} />
    </div>
  );
}
