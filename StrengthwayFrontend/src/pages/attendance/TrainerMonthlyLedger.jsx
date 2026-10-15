/* eslint-disable max-lines */
import { useMemo } from "react";
import {
  Award,
  Users,
  CalendarOff,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getTailwindWidth } from "@/lib/tailwindUtils";

export function TrainerMonthlyLedger({
  formattedSelectedMonth,
  paginatedMonthlySummary = [],
  monthlyLeaveSummary = null,
  monthlyLeaves = [],
  onOpenLeaveDrawer,
}) {
  // Approved and active leave records in the selected month
  const activeMonthlyLeaves = useMemo(() => {
    return (monthlyLeaves || []).filter(
      (l) => l.status === "APPROVED" || l.status === "PENDING"
    );
  }, [monthlyLeaves]);

  const monthlyAllowance = monthlyLeaveSummary?.monthlyAllowance ?? 3;
  const annualAllowance = monthlyLeaveSummary?.annualAllowance ?? 36;
  const deductionPerDay = monthlyLeaveSummary?.deductionPerDay ?? 1000;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4 no-scrollbar pr-1 pb-4">
      {/* ─── Faculty Coaching & Leave Ledger Table ────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <span>Faculty Coaching &amp; Leave Ledger — {formattedSelectedMonth}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Aggregate coaching performance, leave balances ({annualAllowance} days annual paid allowance), and estimated payroll deductions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-96 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-3 px-4 sm:px-6 whitespace-nowrap">Faculty Member</th>
                <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Shift</th>
                <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Conducted</th>
                <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Athletes</th>
                <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Leaves Consumed</th>
                <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Leave Balance</th>
                <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Payroll Impact</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm font-medium">
              {paginatedMonthlySummary.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs whitespace-nowrap"
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
                    remainingBalance = annualAllowance,
                    annualRemainingDays = annualAllowance,
                    deductionAmount = 0,
                  } = item;

                  const coachRemaining = item.annualRemainingDays ?? remainingBalance;

                  return (
                    <tr key={trainer.id} className="group transition-all duration-150 hover:-translate-y-px">
                      {/* Faculty Member */}
                      <td className="bg-card py-3.5 px-4 sm:px-6 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-xs border border-accent/25 uppercase">
                            {trainer.name ? trainer.name.charAt(0) : "T"}
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="font-bold text-foreground text-sm">{trainer.name}</span>
                            <span className="font-mono text-[10px] font-semibold bg-muted/70 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                              #{trainer.id?.length > 7 ? trainer.id.slice(-6).toUpperCase() : trainer.id}
                            </span>
                            {trainer.specialization && (
                              <span className="text-[11px] text-muted-foreground font-normal">
                                • {trainer.specialization}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-semibold text-accent whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {trainer.shift || "General Shift"}
                        </span>
                      </td>

                      {/* Classes Conducted */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {conductedCount}
                          </span>
                          <span className="text-[11px] text-muted-foreground">sessions</span>
                        </div>
                      </td>

                      {/* Athletes Reached */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                            {totalAttendees}
                          </span>
                          <span className="text-[11px] text-muted-foreground">athletes</span>
                        </div>
                      </td>

                      {/* Leaves Consumed */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {leaveDaysCount === 0 ? (
                          <span className="font-mono text-xs text-muted-foreground font-semibold whitespace-nowrap">
                            0 Days
                          </span>
                        ) : unpaidLeaveDays === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            <CheckCircle2 size={11} />
                            <span>{leaveDaysCount}d Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-500 whitespace-nowrap">
                            <AlertTriangle size={11} />
                            <span>{leaveDaysCount}d ({unpaidLeaveDays}d LOP)</span>
                          </span>
                        )}
                      </td>

                      {/* Leave Balance */}
                      <td className="bg-card py-3.5 px-3 sm:px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold ${
                              coachRemaining > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-500"
                            }`}
                          >
                            {coachRemaining > 0
                              ? `${coachRemaining}d left`
                              : "Exhausted"}
                          </span>
                          {/* Mini Progress Bar */}
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                coachRemaining === 0
                                  ? "bg-rose-500"
                                  : coachRemaining <= 5
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              } ${getTailwindWidth(((annualAllowance - coachRemaining) / annualAllowance) * 100)}`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Payroll Impact */}
                      <td className="bg-card py-3.5 px-4 sm:px-5 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {deductionAmount > 0 ? (
                          <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-xs text-rose-500">
                              -₹{deductionAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({unpaidLeaveDays}d LOP)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
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

      {/* ─── Faculty Leave Breakdown & Policy Audit ─────────────────────────── */}
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
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {activeMonthlyLeaves.length} Approved Application{activeMonthlyLeaves.length === 1 ? "" : "s"}
          </span>
        </div>

        {activeMonthlyLeaves.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-85 no-scrollbar pr-1">
            <table className="w-full text-left border-separate [border-spacing:0_8px]">
              <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                <tr>
                  <th className="py-2.5 px-4 whitespace-nowrap">Leave Window</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Faculty Coach</th>
                  <th className="py-2.5 px-4 text-center whitespace-nowrap">Duration</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Policy Compliance</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Reason / Notes</th>
                  <th className="py-2.5 px-4 text-center whitespace-nowrap">Allowance Status</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium">
                {activeMonthlyLeaves.map((leave) => {
                  const isExempt = leave.allowPolicyOverride;
                  const isCompliant = leave.isNoticeCompliant;

                  return (
                    <tr key={leave.id} className="group transition-all duration-150 hover:-translate-y-px">
                      {/* Window */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Calendar size={13} className="text-primary shrink-0" />
                            <span>
                              {leave.leaveStartDate} → {leave.leaveEndDate}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            • ID: {leave.id}
                          </span>
                        </div>
                      </td>

                      {/* Coach */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors font-bold text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>{leave.trainerName}</span>
                          <span className="font-mono text-[10px] text-muted-foreground font-normal">
                            #{leave.trainerId}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {leave.totalDays}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          day{leave.totalDays === 1 ? "" : "s"}
                        </span>
                      </td>

                      {/* Policy Compliance */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2 whitespace-nowrap">
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
                            <span className="text-[10px] text-muted-foreground">
                              • Tier: {leave.tierLabel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-muted-foreground max-w-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap truncate">
                          <span className="text-foreground font-medium truncate">
                            {leave.reason || "Personal leave"}
                          </span>
                          {leave.overrideReason && (
                            <span className="text-[10px] text-amber-500 shrink-0">
                              (Override: {leave.overrideReason})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Allowance Classification */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                        {leave.annualLeaveCalculation?.requestImpact?.lopDays > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500 whitespace-nowrap">
                            {leave.annualLeaveCalculation.requestImpact.paidDays > 0 ? "Partial LOP" : "100% LOP"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            Paid Allowance
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="bg-card py-3 px-4 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
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
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground whitespace-nowrap">
            No faculty leaves recorded in {formattedSelectedMonth}. All classes were delivered with full staff presence.
          </div>
        )}
      </div>
    </div>
  );
}
