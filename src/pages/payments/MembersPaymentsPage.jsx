/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  IndianRupee,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getMembers } from "@/lib/membersService";
import { Pagination } from "@/components/table";

const PAYMENT_METHODS = ["ALL", "UPI", "Card", "Net Banking", "Cash"];
const STATUS_OPTIONS = ["ALL", "Paid", "Pending", "Due Soon"];

export default function MembersPaymentsPage() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getMembers(true);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load members:", err);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Format payments ledger list from members data
  const paymentRecords = useMemo(() => {
    return members.map((m) => {
      const plan = m.membershipPlan || {};
      const amount = m.paymentAmount || plan.price || 7000;
      const method = m.paymentMethod || m.paymentDetails?.method || "UPI";
      const txId = m.transactionId || m.paymentDetails?.transactionId || `TXN-${m.id?.slice(-6) || "984210"}`;
      const paymentDate = m.paymentDate || m.planStartDate || m.createdAt?.slice(0, 10) || "2026-03-01";
      const status = m.status === "Inactive" ? "Due Soon" : "Paid";

      return {
        id: m.id,
        memberId: m.memberId || m.id,
        name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Athlete",
        phone: m.phone || "—",
        email: m.email || "—",
        batchName: m.batchName || m.batch?.name || "General Batch",
        planName: plan.name || "Strength Standard",
        durationMonths: plan.durationMonths || 1,
        amount,
        method,
        txId,
        paymentDate,
        status,
      };
    });
  }, [members]);

  // Filtered records
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return paymentRecords.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.memberId.toLowerCase().includes(q) ||
        p.txId.toLowerCase().includes(q) ||
        p.phone.includes(q);

      const matchesMethod = selectedMethod === "ALL" || p.method.toLowerCase() === selectedMethod.toLowerCase();
      const matchesStatus = selectedStatus === "ALL" || p.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [paymentRecords, searchQuery, selectedMethod, selectedStatus]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const totalCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const paidCount = filteredPayments.filter((p) => p.status === "Paid").length;
    const dueCount = filteredPayments.filter((p) => p.status !== "Paid").length;
    const avgAmount = filteredPayments.length > 0 ? Math.round(totalCollected / filteredPayments.length) : 0;

    return { totalCollected, paidCount, dueCount, avgAmount };
  }, [filteredPayments]);

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 5;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedMethod, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const paginatedPayments = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, safePage, pageSize]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Financial Ledger • Athlete Subscriptions
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            Members Payments & Fee Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit membership subscriptions, plan renewals, payment transactions, and collection status.
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Collected</span>
            <IndianRupee size={16} className="text-emerald-500" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
            ₹{kpis.totalCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Filtered transactions volume</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Settled Payments</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-400">
            {kpis.paidCount}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Active paid subscriptions</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending / Due Soon</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-amber-500">
            {kpis.dueCount}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Renewals required</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Transaction</span>
            <CreditCard size={16} className="text-accent" />
          </div>
          <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
            ₹{kpis.avgAmount.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Average plan value</p>
        </div>
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search athlete, member ID, phone, txn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Method Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground">Method:</span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m === "ALL" ? "All Methods" : m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground">Status:</span>
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
            {filteredPayments.length} Records
          </span>
        </div>
      </div>

      {/* ─── Flexible Viewport Table Card with Separated Rows ────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 no-scrollbar pr-1">
          <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <tr>
                <th className="py-2.5 px-4">Member & ID</th>
                <th className="py-2.5 px-4">Batch Container</th>
                <th className="py-2.5 px-4">Plan & Duration</th>
                <th className="py-2.5 px-4 text-center">Amount Paid</th>
                <th className="py-2.5 px-4 text-center">Method</th>
                
                <th className="py-2.5 px-4">Payment Date</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                
              </tr>
            </thead>
            <tbody className="text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-accent" />
                      <span className="font-semibold text-xs">Loading payment transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground bg-card rounded-2xl border border-border/50 shadow-xs">
                    <div className="max-w-sm mx-auto space-y-1">
                      <CreditCard size={32} className="mx-auto text-muted-foreground/40" />
                      <p className="font-bold text-foreground text-sm">No payment records found</p>
                      <p className="text-xs">Try adjusting your filters or search keywords.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => (
                  <tr key={p.id} className="group transition-all duration-150 hover:-translate-y-px">
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l first:border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                      <div className="font-bold text-foreground text-xs">{p.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        #{p.memberId} • {p.phone}
                      </div>
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors font-medium text-foreground">
                      {p.batchName}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors">
                      <span className="font-semibold text-foreground block">{p.planName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {p.durationMonths} Month{p.durationMonths > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 last:rounded-r-2xl last:border-r last:border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center">
                      <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/70">
                        {p.method}
                      </span>
                    </td>
                    
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-muted-foreground font-mono text-[11px]">
                      {p.paymentDate}
                    </td>
                    <td className="bg-card py-3 px-4 align-middle border-y border-border/50 shadow-xs group-hover:bg-muted/40 transition-colors text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          p.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.status === "Paid" ? "bg-emerald-500" : "bg-amber-500"
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
        totalItems={filteredPayments.length}
        pageSize={pageSize}
        itemName="payments"
        compact
        className="shrink-0 mt-auto"
      />
    </div>
  );
}
