/* eslint-disable max-lines */
import { useMemo } from "react";
import {
  Award,
  Users,
  Repeat,
  CalendarOff,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  FileText,
  Sparkles,
} from "lucide-react";

export function TrainerMonthlyLedger({
  formattedSelectedMonth,
  paginatedMonthlySummary = [],
  monthlyLeaveSummary = null,
  monthlyLeaves = [],
  onOpenLeaveDrawer,
}) {
  // ─── Aggregate KPIs for the Monthly View ──────────────────────────────────
  const stats = useMemo(() => {
    const totalConducted = paginatedMonthlySummary.reduce(
      (acc, curr) => acc + (curr.conductedCount || 0),
      0
    );
    const totalAthletes = paginatedMonthlySummary.reduce(
      (acc, curr) => acc + (curr.totalAttendees || 0),
      0
    );
    const totalLeaveDays = paginatedMonthlySummary.reduce(
      (acc, curr) => acc + (curr.leaveDaysCount || 0),
      0
    );
    const totalPaidLeaveDays = paginatedMonthlySummary.reduce(
      (acc, curr) => acc + (curr.paidLeaveDays || 0),
      0
    );
    const totalUnpaidLeaveDays = paginatedMonthlySummary.reduce(
      (acc, curr) => acc + (curr.unpaidLeaveDays || 0),
      0
    );
    const totalLeaveDeductions = paginatedMonthlySummary.reduce(
      (acc, curr) => acc + (curr.deductionAmount || 0),
      0
    );

    return {
      totalConducted,
      totalAthletes,
      totalLeaveDays,
      totalPaidLeaveDays,
      totalUnpaidLeaveDays,
      totalLeaveDeductions,
    };
  }, [paginatedMonthlySummary]);

  // Approved and active leave records in the selected month
  const activeMonthlyLeaves = useMemo(() => {
    return (monthlyLeaves || []).filter(
      (l) => l.status === "APPROVED" || l.status === "PENDING"
    );
  }, [monthlyLeaves]);

  const monthlyAllowance = monthlyLeaveSummary?.monthlyAllowance ?? 2;
  const deductionPerDay = monthlyLeaveSummary?.deductionPerDay ?? 1000;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar pr-1 pb-4">
      {/* ─── 1. Monthly Executive KPI Cards ──────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Sessions Delivered */}
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Classes Delivered
            </span>
            <Award size={15} className="text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {stats.totalConducted}
            </span>
            <span className="text-[10px] text-muted-foreground">sessions</span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Across all scheduled shifts
          </p>
        </div>

        {/* Leave Days Consumed */}
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Faculty Leave Days
            </span>
            <CalendarOff size={15} className="text-primary" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-foreground">
              {stats.totalLeaveDays}
            </span>
            <span className="text-[10px] text-muted-foreground">days</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[10px]">
            <span className="text-emerald-500 font-semibold">{stats.totalPaidLeaveDays}d paid</span>
            <span className="text-muted-foreground">•</span>
            <span className={stats.totalUnpaidLeaveDays > 0 ? "text-rose-500 font-bold" : "text-muted-foreground"}>
              {stats.totalUnpaidLeaveDays}d unpaid
            </span>
          </div>
        </div>

        {/* Estimated Leave Deductions */}
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              Payroll Deduction
            </span>
            <IndianRupee size={15} className={stats.totalLeaveDeductions > 0 ? "text-rose-500" : "text-emerald-500"} />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black ${
                stats.totalLeaveDeductions > 0 ? "text-rose-500" : "text-foreground"
              }`}
            >
              {stats.totalLeaveDeductions > 0
                ? `-₹${stats.totalLeaveDeductions.toLocaleString("en-IN")}`
                : "₹0"}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {stats.totalLeaveDeductions > 0
              ? `Applied @ ₹${deductionPerDay}/unpaid day`
              : `All within ${monthlyAllowance}d allowance`}
          </p>
        </div>
      </div>

      {/* ─── 2. Faculty Coaching & Leave Ledger Table ────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <span>Faculty Coaching &amp; Leave Ledger — {formattedSelectedMonth}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Aggregate coaching performance, leave balances ({monthlyAllowance} days paid/mo), and estimated payroll deductions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-96 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-3 px-4 sm:px-6">Faculty Member</th>
                <th className="py-3 px-3 sm:px-4">Shift</th>
                <th className="py-3 px-3 sm:px-4 text-center">Conducted</th>
                <th className="py-3 px-3 sm:px-4 text-center">Athletes</th>
                <th className="py-3 px-3 sm:px-4 text-center">Leaves Consumed</th>
                <th className="py-3 px-3 sm:px-4 text-center">Leave Balance</th>
                <th className="py-3 px-3 sm:px-4 text-center">Payroll Impact</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              {paginatedMonthlySummary.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs"
                  >
                    <div className="max-w-xs mx-auto space-y-2">
                      <Users size={28} className="mx-auto text-muted-foreground/50" />
                      <p className="font-bold text-foreground text-sm">No Faculty Activity Recorded</p>
                      <p className="text-xs text-muted-foreground">
                        No coaching logs or leave applications found for {formattedSelectedMonth}.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMonthlySummary.map((item) => {
                  const {
                    trainer,
                    conductedCount,
                    totalAttendees,
                    leaveDaysCount = 0,
                    paidLeaveDays = 0,
                    unpaidLeaveDays = 0,
                    remainingBalance = monthlyAllowance,
                    deductionAmount = 0,
                  } = item;

                  return (
                    <tr key={trainer.id} className="group transition-all duration-150 hover:-translate-y-px">
                      {/* Faculty Member */}
                      <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-sm border border-accent/25 uppercase">
                            {trainer.name ? trainer.name.charAt(0) : "T"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{trainer.name}</span>
                              <span className="font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                                #{trainer.id?.length > 7 ? trainer.id.slice(-6).toUpperCase() : trainer.id}
                              </span>
                            </div>
                            {trainer.specialization && (
                              <span className="text-[11px] text-muted-foreground block mt-0.5 font-normal">
                                {trainer.specialization}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {trainer.shift || "General Shift"}
                        </span>
                      </td>

                      {/* Classes Conducted */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                            {conductedCount}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">sessions</span>
                        </div>
                      </td>

                      {/* Athletes Reached */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                            {totalAttendees}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">athletes</span>
                        </div>
                      </td>

                      {/* Leaves Consumed */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {leaveDaysCount === 0 ? (
                          <span className="font-mono text-xs text-muted-foreground font-semibold">
                            0 Days
                          </span>
                        ) : unpaidLeaveDays === 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={11} />
                              <span>{leaveDaysCount}d Paid</span>
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-500">
                              <AlertTriangle size={11} />
                              <span>{leaveDaysCount}d ({unpaidLeaveDays}d unpaid)</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Leave Balance */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1 min-w-24">
                          <span
                            className={`text-xs font-bold ${
                              remainingBalance > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-500"
                            }`}
                          >
                            {remainingBalance > 0
                              ? `${remainingBalance}d of ${monthlyAllowance}d left`
                              : "Exhausted"}
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                remainingBalance === 0
                                  ? "bg-rose-500"
                                  : remainingBalance === 1
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(100, (paidLeaveDays / monthlyAllowance) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Payroll Impact */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {deductionAmount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-xs text-rose-500">
                              -₹{deductionAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {unpaidLeaveDays}d unpaid deduction
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Full Stipend
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 3. Faculty Leave Breakdown & Policy Audit ─────────────────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <CalendarOff size={18} className="text-primary" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Faculty Leave Breakdown &amp; Policy Audit — {formattedSelectedMonth}
              </h3>
              <p className="text-xs text-muted-foreground">
                Detailed view of approved coach leaves and advance notice compliance.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {activeMonthlyLeaves.length} Approved Application{activeMonthlyLeaves.length === 1 ? "" : "s"}
          </span>
        </div>

        {activeMonthlyLeaves.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-85 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4">Leave Window</th>
                  <th className="py-2.5 px-4">Faculty Coach</th>
                  <th className="py-2.5 px-4 text-center">Duration</th>
                  <th className="py-2.5 px-4">Policy Compliance</th>
                  <th className="py-2.5 px-4">Reason / Notes</th>
                  <th className="py-2.5 px-4 text-center">Allowance Status</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium">
                {activeMonthlyLeaves.map((leave) => {
                  const isExempt = leave.allowPolicyOverride;
                  const isCompliant = leave.isNoticeCompliant;

                  return (
                    <tr key={leave.id} className="group transition-all duration-150 hover:-translate-y-px">
                      {/* Window */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <Calendar size={13} className="text-primary shrink-0" />
                          <span>
                            {leave.leaveStartDate} → {leave.leaveEndDate}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                          ID: {leave.id}
                        </span>
                      </td>

                      {/* Coach */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors font-bold text-foreground">
                        <div>{leave.trainerName}</div>
                        <span className="font-mono text-[10px] text-muted-foreground font-normal">
                          #{leave.trainerId}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {leave.totalDays}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          day{leave.totalDays === 1 ? "" : "s"}
                        </span>
                      </td>

                      {/* Policy Compliance */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        {isCompliant ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={11} />
                            <span>{leave.actualNoticeDays}d Notice (Req: {leave.requiredNoticeDays}d)</span>
                          </div>
                        ) : isExempt ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            <AlertTriangle size={11} />
                            <span>Override Authorized</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            <AlertTriangle size={11} />
                            <span>Insufficient Notice</span>
                          </div>
                        )}
                        {leave.tierLabel && (
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            Tier: {leave.tierLabel}
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-muted-foreground max-w-xs truncate">
                        <span className="text-foreground font-medium block truncate">
                          {leave.reason || "Personal leave"}
                        </span>
                        {leave.overrideReason && (
                          <span className="text-[10px] text-amber-500 block truncate">
                            Override: {leave.overrideReason}
                          </span>
                        )}
                      </td>

                      {/* Allowance Classification */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {leave.totalDays <= monthlyAllowance ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Paid Allowance
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            Partial Unpaid
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            leave.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{leave.status === "APPROVED" ? "Approved & Seeded" : "Pending Review"}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No faculty leaves recorded in {formattedSelectedMonth}. All classes were delivered with full staff presence.
          </div>
        )}
      </div>
    </div>
  );
}
