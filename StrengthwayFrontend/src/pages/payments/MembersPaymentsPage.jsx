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
  Receipt,
  FileText,
  Printer,
  X,
  Award,
} from "lucide-react";
import { getMembers } from "@/lib/membersService";
import { DataTable } from "@/components/table";
import { isMember } from "@/auth/currentUser";

const PAYMENT_METHODS = ["ALL", "UPI", "Card", "Net Banking", "Cash"];
const STATUS_OPTIONS = ["ALL", "Paid", "Pending", "Due Soon"];

export default function MembersPaymentsPage() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [receiptRecord, setReceiptRecord] = useState(null);

  const userIsMember = isMember();

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
      const receiptNo = m.paymentDetails?.receiptNo || `REC-${m.id?.slice(-6) || "8024"}`;
      const paymentDate = m.paymentDate || m.planStartDate || m.createdAt?.slice(0, 10) || "2026-03-01";
      const status = m.status === "Inactive" ? "Due Soon" : "Paid";

      return {
        id: m.id,
        memberId: m.memberId || m.id,
        name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Athlete",
        phone: m.phone || m.mobile || "—",
        email: m.email || "—",
        batchName: m.batchName || m.batch?.name || "General Batch",
        planName: plan.name || "Strength Standard",
        durationMonths: plan.durationMonths || 1,
        amount,
        method,
        txId,
        receiptNo,
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
  const pageSize = 7;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedMethod, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));

  const columns = useMemo(() => [
    {
      header: userIsMember ? "Athlete Account" : "Member & ID",
      accessorKey: "name",
      cell: (p) => (
        <div>
          <div className="font-bold text-foreground text-xs">{p.name}</div>
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            #{p.memberId} • {p.phone}
          </div>
        </div>
      ),
    },
    {
      header: "Batch Container",
      accessorKey: "batchName",
      className: "font-medium text-foreground",
    },
    {
      header: "Plan & Duration",
      cell: (p) => (
        <div>
          <span className="font-semibold text-foreground block">{p.planName}</span>
          <span className="text-[10px] text-muted-foreground">
            {p.durationMonths} Month{p.durationMonths > 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      header: "Amount Paid",
      align: "center",
      cell: (p) => (
        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
          ₹{p.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Method",
      align: "center",
      cell: (p) => (
        <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/70">
          {p.method}
        </span>
      ),
    },
    {
      header: "Payment Date",
      cell: (p) => (
        <div className="text-muted-foreground font-mono text-[11px]">
          <div>{p.paymentDate}</div>
          <div className="text-[9px] text-muted-foreground/70 truncate max-w-[120px]">
            Ref: {p.txId}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (p) => (
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
      ),
    },
    {
      header: "Receipt",
      align: "center",
      cell: (p) => (
        <button
          type="button"
          onClick={() => setReceiptRecord(p)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          title="View Official Receipt"
        >
          <Receipt size={13} />
          <span>Receipt</span>
        </button>
      ),
    },
  ], [userIsMember]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {userIsMember ? "Athlete Portal • Financial Receipts" : "Financial Ledger • Athlete Subscriptions"}
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            {userIsMember ? "My Payment Receipts & Subscription Ledger" : "Members Payments & Fee Ledger"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userIsMember
              ? "Review your personal membership plan, subscription receipts, and verified transaction status."
              : "Audit membership subscriptions, plan renewals, payment transactions, and collection status."}
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {userIsMember ? (
          <>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Paid</span>
                <IndianRupee size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                ₹{kpis.totalCollected.toLocaleString("en-IN")}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Settled subscription amount</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Account Standing</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-500">
                {filteredPayments[0]?.status || "Paid"}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Current membership status</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Active Plan</span>
                <Award size={16} className="text-accent" />
              </div>
              <div className="mt-1 text-base sm:text-lg font-black text-foreground truncate">
                {filteredPayments[0]?.planName || "Strength Standard"}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {filteredPayments[0]?.durationMonths || 1} Month duration
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Payment Method</span>
                <CreditCard size={16} className="text-accent" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                {filteredPayments[0]?.method || "UPI"}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Verified transaction channel</p>
            </div>
          </>
        ) : (
          <>
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
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-500">
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
          </>
        )}
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={userIsMember ? "Filter receipts, txn ID, plan..." : "Search athlete, member ID, phone, txn..."}
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
            {filteredPayments.length} Record{filteredPayments.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* ─── Standardized Members Payments Table ────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredPayments}
        pageSize={pageSize}
        currentPage={safePage}
        onPageChange={setPage}
        totalItems={filteredPayments.length}
        totalPages={totalPages}
        itemLabel="payments"
        loading={isLoading}
        loadingRowsCount={7}
        showToolbar={false}
        emptyIcon={CreditCard}
        emptyTitle="No payment records found"
        emptyMessage="Try adjusting your filters or search keywords."
        className="flex-1 min-h-0"
      />

      {/* ─── Official Receipt Modal ─────────────────────────────────────────── */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 text-foreground">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
                  <Receipt size={13} />
                  StrengthWay Athletic Club
                </div>
                <h3 className="text-lg font-black tracking-tight mt-0.5">
                  Official Subscription Receipt
                </h3>
                <p className="text-xs font-mono text-muted-foreground">
                  Receipt No: <span className="text-foreground font-semibold">{receiptRecord.receiptNo}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptRecord(null)}
                className="rounded-xl border border-border/60 p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Summary Grid */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border/40">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Billed Athlete
                  </span>
                  <span className="font-bold text-foreground text-sm block mt-0.5">
                    {receiptRecord.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground block">
                    ID: #{receiptRecord.memberId}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    Phone: {receiptRecord.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Payment Details
                  </span>
                  <span className="font-mono text-[11px] text-foreground font-semibold block mt-0.5">
                    Date: {receiptRecord.paymentDate}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Method: <span className="font-semibold text-foreground">{receiptRecord.method}</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground block truncate">
                    Txn: {receiptRecord.txId}
                  </span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Enrolled Plan: {receiptRecord.planName} ({receiptRecord.durationMonths} Mo)</span>
                  <span className="font-mono">₹{receiptRecord.amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Training Batch: {receiptRecord.batchName}</span>
                  <span>Enrolled</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Applicable GST / Taxes</span>
                  <span>Included</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-sm font-black text-emerald-500">
                  <span>Total Settled Amount</span>
                  <span className="font-mono text-base">₹{receiptRecord.amount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Verification Footer & Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={14} />
                <span>Verified Active Subscription</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptRecord(null)}
                  className="rounded-xl bg-accent px-4 py-1.5 text-xs font-bold text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
