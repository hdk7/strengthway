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
import { DataTable } from "@/components/table";
import { isTrainer } from "@/auth/currentUser";

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const userIsTrainer = isTrainer();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [trainersData, logsData] = await Promise.all([
        getTrainers(true),
        getAllTrainerLogs().catch(() => []),
      ]);
      setTrainers(Array.isArray(trainersData) ? trainersData : []);
      setTrainerLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      console.error("Failed to load trainer payout data:", err);
      setTrainers([]);
      setTrainerLogs([]);
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

      // Leave logs and deduction calculation (status === "LEAVE")
      const leaveLogs = trainerLogs.filter(
        (l) => l.trainerId === t.id && l.status === "LEAVE",
      );
      const uniqueLeaveDates = [...new Set(leaveLogs.map((l) => l.date))];
      const leaveDaysCount = uniqueLeaveDates.length;
      const monthlyAllowance = 2; // Standard 2 paid leave days/month
      const paidLeaveDays = Math.min(leaveDaysCount, monthlyAllowance);
      const unpaidLeaveDays = Math.max(0, leaveDaysCount - monthlyAllowance);
      const leaveDeduction = unpaidLeaveDays * 1000;

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
        totalHours,
        baseStipend,
        totalPayout,
        status,
        batchCount: Array.isArray(t.batchIds) ? t.batchIds.length : 1,
      };
    });
  }, [trainers, trainerLogs]);

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
          ₹{p.baseStipend.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Leave & Deductions",
      align: "center",
      cell: (p) => (
        p.leaveDaysCount === 0 ? (
          <span className="font-mono text-[11px] text-muted-foreground font-semibold">
            0d Leave
          </span>
        ) : p.unpaidLeaveDays === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {p.leaveDaysCount}d Paid
          </span>
        ) : (
          <div className="inline-flex flex-col items-center">
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
              {p.leaveDaysCount}d ({p.unpaidLeaveDays}d Unpaid)
            </span>
            <span className="text-[9px] font-bold text-rose-500 mt-0.5">
              -₹{p.leaveDeduction.toLocaleString("en-IN")}
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
          <div>₹{p.totalPayout.toLocaleString("en-IN")}</div>
          {p.leaveDeduction > 0 && (
            <div className="text-[9px] text-rose-500 font-normal">
              (Net of -₹{p.leaveDeduction.toLocaleString("en-IN")} leave)
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
            {userIsTrainer ? "My Payouts & Faculty Stipend Ledger" : "Trainer Payouts & Faculty Stipends"}
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
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Net Remuneration
                </span>
                <IndianRupee size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                ₹{kpis.totalLiability.toLocaleString("en-IN")}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Monthly stipend after deductions
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Conducted Sessions
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-500">
                {filteredPayouts[0]?.totalConducted || 0}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Classes conducted this cycle
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Floor Hours
                </span>
                <Clock size={16} className="text-accent" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                {filteredPayouts[0]?.totalHours || 0} hrs
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Verified training floor time
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Disbursement Status
                </span>
                <Award size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                {filteredPayouts[0]?.status || "Disbursed"}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {filteredPayouts[0]?.leaveDeduction > 0
                  ? `-₹${filteredPayouts[0].leaveDeduction.toLocaleString("en-IN")} leave deduction`
                  : "Zero unexcused leaves"}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Payroll Outflow
                </span>
                <IndianRupee size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                ₹{kpis.totalLiability.toLocaleString("en-IN")}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Cumulative monthly stipends
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Disbursed Coaches
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-500">
                {kpis.disbursedCount}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Accounts settled
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Pending Approval
                </span>
                <AlertCircle size={16} className="text-amber-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-amber-500">
                {kpis.pendingCount}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Awaiting sign-off
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Avg Coach Payout
                </span>
                <Award size={16} className="text-accent" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                ₹{kpis.avgPayout.toLocaleString("en-IN")}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Average monthly stipend
              </p>
            </div>
          </>
        )}
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search faculty name, ID, specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
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
