/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  IndianRupee,
  ExternalLink,
  ShieldCheck,
  Repeat,
} from "lucide-react";
import { getTrainers } from "@/lib/trainersService";
import { getAllTrainerLogs } from "@/lib/attendanceService";
import { getTrainerLeaveMonthlySummary } from "@/lib/trainerLeaveService";
import { DataTable } from "@/components/table";
import { isTrainer } from "@/auth/currentUser";
import { KpiCard, SearchInput } from "@/components/ui";
import { formatINR } from "@/lib/formatters";

const SHIFT_OPTIONS = [
  "ALL",
  "Morning Shift",
  "Evening Shift",
  "Full Day",
  "General",
];
const STATUS_OPTIONS = ["ALL", "Disbursed", "Processed", "Pending"];

export default function TrainersPaymentsPage() {
  const [trainers, setTrainers] = useState([]);
  const [trainerLogs, setTrainerLogs] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const userIsTrainer = isTrainer();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [trainersData, logsData, leaveSummaryData] = await Promise.all([
        getTrainers(true),
        getAllTrainerLogs().catch(() => []),
        getTrainerLeaveMonthlySummary().catch(() => null),
      ]);
      setTrainers(Array.isArray(trainersData) ? trainersData : []);
      setTrainerLogs(Array.isArray(logsData) ? logsData : []);
      setLeaveSummary(leaveSummaryData);
    } catch (err) {
      console.error("Failed to load trainer payout data:", err);
      setTrainers([]);
      setTrainerLogs([]);
      setLeaveSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute monthly compensation records
  const payoutRecords = useMemo(() => {
    return trainers.map((t) => {
      // Find conducted sessions
      const conductedLogs = trainerLogs.filter(
        (l) => l.trainerId === t.id && (l.status === "CONDUCTED" || l.status === "PRESENT"),
      );

      const totalConducted = conductedLogs.length;
      const totalMinutes = conductedLogs.reduce(
        (acc, l) => acc + (l.durationMinutes || 60),
        0,
      );
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      // Cross-reference with backend leave summary (annual 36-day allowance + LOP model)
      const tSummary = leaveSummary?.trainersSummary?.find(
        (s) => s.trainerId === t.id,
      );

      let leaveDaysCount = 0;
      let paidLeaveDays = 0;
      let unpaidLeaveDays = 0;
      let leaveDeduction = 0;
      let annualAllowance = 36;
      let annualRemainingDays = 36;
      let annualLopDays = 0;

      if (tSummary) {
        leaveDaysCount = tSummary.approvedDays;
        paidLeaveDays = tSummary.paidDays;
        unpaidLeaveDays = tSummary.unpaidDays; // LOP days
        leaveDeduction = tSummary.totalDeduction;
        annualAllowance = tSummary.annualAllowance || 36;
        annualRemainingDays =
          tSummary.annualRemainingDays ?? tSummary.remainingBalance ?? 36;
        annualLopDays = tSummary.annualLopDays ?? 0;
      } else {
        // Fallback using local logs with the 36-day annual allowance
        const currentYear = new Date().getFullYear().toString();
        const yearLogs = trainerLogs.filter(
          (l) =>
            l.trainerId === t.id &&
            (l.status === "LEAVE" || l.status === "ABSENT") &&
            l.date?.startsWith(currentYear),
        );
        const uniqueYearDates = [...new Set(yearLogs.map((l) => l.date))];
        const monthLogs = trainerLogs.filter(
          (l) =>
            l.trainerId === t.id &&
            (l.status === "LEAVE" || l.status === "ABSENT"),
        );
        const uniqueMonthDates = [...new Set(monthLogs.map((l) => l.date))];
        leaveDaysCount = uniqueMonthDates.length;

        annualAllowance = 36;
        const totalYearDaysUsed = uniqueYearDates.length;
        annualRemainingDays = Math.max(0, annualAllowance - totalYearDaysUsed);
        annualLopDays = Math.max(0, totalYearDaysUsed - annualAllowance);
        unpaidLeaveDays = annualLopDays;
        paidLeaveDays = Math.max(0, leaveDaysCount - unpaidLeaveDays);
        leaveDeduction = unpaidLeaveDays * 1000;
      }

      // Base stipend based on shift/level
      const baseStipend =
        t.shift === "Full Day"
          ? 45000
          : t.shift === "Evening Shift"
            ? 32000
            : t.shift === "Morning Shift"
              ? 30000
              : 28000;

      const totalPayout = Math.max(0, baseStipend - leaveDeduction);
      const status = t.status === "Inactive" ? "Pending" : "Disbursed";

      return {
        id: t.id,
        name: t.name || "Faculty Coach",
        trainerId: t.id,
        phone: t.phone || "—",
        specialization: t.specialization || "Strength & Conditioning",
        shift: t.shift || "General",
        totalConducted,
        leaveDaysCount,
        paidLeaveDays,
        unpaidLeaveDays,
        leaveDeduction,
        annualAllowance,
        annualRemainingDays,
        annualLopDays,
        totalHours,
        baseStipend,
        totalPayout,
        status,
        batchCount: Array.isArray(t.batchIds) ? t.batchIds.length : 1,
      };
    });
  }, [trainers, trainerLogs, leaveSummary]);

  // Filtered payouts
  const filteredPayouts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return payoutRecords.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.trainerId.toLowerCase().includes(q) ||
        p.specialization.toLowerCase().includes(q);

      const matchesShift =
        selectedShift === "ALL" ||
        p.shift.toLowerCase().includes(selectedShift.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" ||
        p.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesShift && matchesStatus;
    });
  }, [payoutRecords, searchQuery, selectedShift, selectedStatus]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const totalLiability = filteredPayouts.reduce(
      (acc, p) => acc + p.totalPayout,
      0,
    );
    const disbursedCount = filteredPayouts.filter(
      (p) => p.status === "Disbursed",
    ).length;
    const pendingCount = filteredPayouts.filter(
      (p) => p.status !== "Disbursed",
    ).length;
    const avgPayout =
      filteredPayouts.length > 0
        ? Math.round(totalLiability / filteredPayouts.length)
        : 0;
    const totalLeaveDeductions = filteredPayouts.reduce(
      (acc, p) => acc + (p.leaveDeduction || 0),
      0,
    );

    return { totalLiability, disbursedCount, pendingCount, avgPayout, totalLeaveDeductions };
  }, [filteredPayouts]);

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 7;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedShift, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));

  const columns = useMemo(() => [
    {
      header: "Faculty Member",
      accessorKey: "name",
      cell: (p) => (
        <div>
          <div className="font-bold text-foreground text-xs">{p.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            #{p.trainerId} • {p.phone}
          </div>
        </div>
      ),
    },
    {
      header: "Shift & Specialization",
      cell: (p) => (
        <div>
          <span className="font-semibold text-foreground block">{p.specialization}</span>
          <span className="inline-flex items-center rounded-md bg-accent/10 px-1.5 py-0.2 text-[9px] font-bold text-accent border border-accent/20 mt-0.5">
            {p.shift}
          </span>
        </div>
      ),
    },
    {
      header: "Conducted Classes",
      align: "center",
      cell: (p) => (
        <span className="font-mono font-bold text-foreground block">
          {p.totalConducted} sessions
        </span>
      ),
    },
    {
      header: "Floor Hours",
      align: "center",
      cell: (p) => (
        <span className="font-mono font-bold text-foreground">
          {p.totalHours} hrs
        </span>
      ),
    },
    {
      header: "Base Stipend",
      align: "center",
      cell: (p) => (
        <span className="font-mono text-muted-foreground font-semibold">
          {formatINR(p.baseStipend)}
        </span>
      ),
    },
    {
      header: "Leave & Deductions",
      align: "center",
      cell: (p) => (
        p.leaveDaysCount === 0 ? (
          <div className="inline-flex flex-col items-center">
            <span className="font-mono text-[11px] text-muted-foreground font-semibold">
              0d Leave
            </span>
            <span className="text-[9px] text-muted-foreground">
              {p.annualRemainingDays ?? 36}d allowance left
            </span>
          </div>
        ) : p.unpaidLeaveDays === 0 ? (
          <div className="inline-flex flex-col items-center">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {p.leaveDaysCount}d Paid
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              {p.annualRemainingDays ?? 36}d allowance left
            </span>
          </div>
        ) : (
          <div className="inline-flex flex-col items-center">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
              {p.leaveDaysCount}d ({p.unpaidLeaveDays}d LOP)
            </span>
            <span className="text-[9px] font-bold text-rose-500 mt-0.5">
              -{formatINR(p.leaveDeduction)}
            </span>
            <span className="text-[9px] text-rose-400">
              {p.annualRemainingDays > 0 ? `${p.annualRemainingDays}d allowance left` : "Allowance exhausted"}
            </span>
          </div>
        )
      ),
    },
    {
      header: "Total Remuneration",
      align: "center",
      cell: (p) => (
        <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
          <div>{formatINR(p.totalPayout)}</div>
          {p.leaveDeduction > 0 && (
            <div className="text-[9px] text-rose-500 font-normal">
              (Net of -{formatINR(p.leaveDeduction)} leave)
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (p) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
            p.status === "Disbursed"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              p.status === "Disbursed" ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {p.status}
        </span>
      ),
    },
  ], []);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {userIsTrainer ? "Faculty Portal • Compensation & Hours" : "Faculty Operations • Payroll & Incentives"}
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            {userIsTrainer ? "My Payouts & Faculty Stipend Ledger" : "Coach Payouts & Faculty Stipends"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userIsTrainer
              ? "Audit your monthly coaching remuneration, conducted sessions, floor hours, and payout disbursement status."
              : "Monthly compensation ledger, floor hours remuneration, and disbursement status."}
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {userIsTrainer ? (
          <>
            <KpiCard
              title="Net Remuneration"
              value={formatINR(kpis.totalLiability)}
              subtext="Monthly stipend after deductions"
              icon={IndianRupee}
              colorScheme="emerald"
            />
            <KpiCard
              title="Conducted Sessions"
              value={filteredPayouts[0]?.totalConducted || 0}
              subtext="Classes conducted this cycle"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
            <KpiCard
              title="Floor Hours"
              value={`${filteredPayouts[0]?.totalHours || 0} hrs`}
              subtext="Verified training floor time"
              icon={Clock}
              colorScheme="terracotta"
            />
            <KpiCard
              title="Disbursement Status"
              value={filteredPayouts[0]?.status || "Disbursed"}
              subtext={
                filteredPayouts[0]?.leaveDeduction > 0
                  ? `-${formatINR(filteredPayouts[0].leaveDeduction)} leave deduction`
                  : "Zero unexcused leaves"
              }
              icon={Award}
              colorScheme="emerald"
            />
          </>
        ) : (
          <>
            <KpiCard
              title="Payroll Outflow"
              value={formatINR(kpis.totalLiability)}
              subtext="Cumulative monthly stipends"
              icon={IndianRupee}
              colorScheme="emerald"
            />
            <KpiCard
              title="Disbursed Coaches"
              value={kpis.disbursedCount}
              subtext="Accounts settled"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
            <KpiCard
              title="Pending Approval"
              value={kpis.pendingCount}
              subtext="Awaiting sign-off"
              icon={AlertCircle}
              colorScheme="amber"
            />
            <KpiCard
              title="Avg Coach Payout"
              value={formatINR(kpis.avgPayout)}
              subtext="Average monthly stipend"
              icon={Award}
              colorScheme="terracotta"
            />
          </>
        )}
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SearchInput
            placeholder="Search faculty name, ID, specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Shift Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground">
              Shift:
            </span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              {SHIFT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Shifts" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground">
              Status:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Statuses" : s}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground ml-1">
            {filteredPayouts.length}
          </span>
        </div>
      </div>

      {/* ─── Flexible Viewport Table Card with Separated Rows ────────────────── */}
      {/* ─── Standardized Trainer Payouts Table ─────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredPayouts}
        pageSize={pageSize}
        currentPage={safePage}
        onPageChange={setPage}
        totalItems={filteredPayouts.length}
        totalPages={totalPages}
        itemLabel="faculty"
        loading={isLoading}
        loadingRowsCount={7}
        showToolbar={false}
        emptyIcon={Award}
        emptyTitle="No trainer records found"
        emptyMessage="Try adjusting your filters or search keywords."
        className="flex-1 min-h-0"
      />
    </div>
  );
}
