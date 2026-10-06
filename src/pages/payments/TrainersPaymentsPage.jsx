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
import { Pagination } from "@/components/table";

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
      // Find conducted sessions and substitute coverages
      const conductedLogs = trainerLogs.filter(
        (l) => l.trainerId === t.id && (l.status === "CONDUCTED" || l.status === "PRESENT"),
      );
      const substituteLogs = trainerLogs.filter(
        (l) => l.substituteTrainerId === t.id,
      );

      const totalConducted = conductedLogs.length;
      const totalSubstitute = substituteLogs.length;
      const totalMinutes = [...conductedLogs, ...substituteLogs].reduce(
        (acc, l) => acc + (l.durationMinutes || 60),
        0,
      );
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

      // Base stipend based on shift/level
      const baseStipend =
        t.shift === "Full Day"
          ? 45000
          : t.shift === "Evening Shift"
            ? 32000
            : t.shift === "Morning Shift"
              ? 30000
              : 28000;

      // Substitute bonus: ₹500 per substitute class
      const substituteBonus = totalSubstitute * 500;
      const totalPayout = baseStipend + substituteBonus;
      const status = t.status === "Inactive" ? "Pending" : "Disbursed";

      return {
        id: t.id,
        name: t.name || "Faculty Coach",
        trainerId: t.id,
        phone: t.phone || "—",
        specialization: t.specialization || "Strength & Conditioning",
        shift: t.shift || "General",
        totalConducted,
        totalSubstitute,
        totalHours,
        baseStipend,
        substituteBonus,
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

    return { totalLiability, disbursedCount, pendingCount, avgPayout };
  }, [filteredPayouts]);

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 5;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedShift, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedPayouts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPayouts.slice(start, start + pageSize);
  }, [filteredPayouts, safePage, pageSize]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Faculty Operations • Payroll & Incentives
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            Trainer Payouts & Faculty Stipends
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly compensation ledger, floor hours remuneration, substitute
            coverage bonuses, and disbursement status.
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-400">
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
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-2.5 px-4">Faculty Member</th>
                <th className="py-2.5 px-4">Shift & Specialization</th>
                <th className="py-2.5 px-4 text-center">Conducted Classes</th>
                <th className="py-2.5 px-4 text-center">Floor Hours</th>
                <th className="py-2.5 px-4 text-center">Base Stipend</th>
                <th className="py-2.5 px-4 text-center">Substitute Bonus</th>
                <th className="py-2.5 px-4 text-center">Total Remuneration</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-accent" />
                      <span className="font-semibold text-xs">
                        Loading faculty payroll records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayouts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs"
                  >
                    <div className="max-w-sm mx-auto space-y-1">
                      <Award
                        size={32}
                        className="mx-auto text-muted-foreground/40"
                      />
                      <p className="font-bold text-foreground text-sm">
                        No trainer records found
                      </p>
                      <p className="text-xs">
                        Try adjusting your filters or search keywords.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayouts.map((p) => (
                  <tr
                    key={p.id}
                    className="group transition-all duration-150 hover:-translate-y-px"
                  >
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="font-bold text-foreground text-xs">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        #{p.trainerId} • {p.phone}
                      </div>
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                      <span className="font-semibold text-foreground block">
                        {p.specialization}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-accent/10 px-1.5 py-0.2 text-[9px] font-bold text-accent border border-accent/20 mt-0.5">
                        {p.shift}
                      </span>
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center">
                      <span className="font-mono font-bold text-foreground block">
                        {p.totalConducted} sessions
                      </span>
                      {p.totalSubstitute > 0 && (
                        <span className="text-[10px] text-amber-500 font-semibold inline-flex items-center gap-0.5">
                          <Repeat size={9} />+{p.totalSubstitute} subs
                        </span>
                      )}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono font-bold text-foreground">
                      {p.totalHours} hrs
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono text-muted-foreground font-semibold">
                      ₹{p.baseStipend.toLocaleString("en-IN")}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono text-amber-500 font-semibold">
                      {p.substituteBonus > 0
                        ? `+₹${p.substituteBonus.toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{p.totalPayout.toLocaleString("en-IN")}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          p.status === "Disbursed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.status === "Disbursed"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Fixed / Sticky Bottom Viewport Pagination ──────────────────────── */}
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filteredPayouts.length}
        pageSize={pageSize}
        itemName="faculty"
        compact
        className="shrink-0 mt-auto"
      />
    </div>
  );
}
