/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Send,
  Eye,
  MessageSquare,
  Users,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { getMembers } from "@/lib/membersService";
import {
  getEnrollments,
  generateAndSendPaymentLink,
  resendPaymentLink,
} from "@/lib/enrollmentsService";
import { DataTable } from "@/components/table";
import { isMember, isAdmin } from "@/auth/currentUser";
import EnrollmentDetailModal from "./EnrollmentDetailModal";
import RecordOfflinePaymentModal from "./RecordOfflinePaymentModal";

const PAYMENT_METHODS = ["ALL", "UPI", "Card", "Net Banking", "Cash"];
const STATUS_OPTIONS = ["ALL", "Paid", "Pending", "Due Soon"];

const ENROLLMENT_STATUS_OPTIONS = [
  "ALL",
  "Pending Payment",
  "Partially Paid",
  "Payment Verified",
  "Converted",
  "Payment Failed",
  "Payment Expired",
  "Cancelled",
];

export default function MembersPaymentsPage() {
  const navigate = useNavigate();
  const userIsMember = isMember();
  const userIsAdmin = isAdmin();

  // Primary Tab State
  const [activeTab, setActiveTab] = useState("members"); // "members" | "enrollments"

  // Active Members State
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [receiptRecord, setReceiptRecord] = useState(null);

  // Enrollments State
  const [enrollments, setEnrollments] = useState([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState("ALL");
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [offlinePaymentEnrollment, setOfflinePaymentEnrollment] = useState(null);

  const loadMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const data = await getMembers(true);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load members:", err);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    if (userIsMember) return;
    setIsLoadingEnrollments(true);
    try {
      const res = await getEnrollments();
      setEnrollments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load enrollments:", err);
      setEnrollments([]);
    } finally {
      setIsLoadingEnrollments(false);
    }
  }, [userIsMember]);

  useEffect(() => {
    loadMembers();
    if (!userIsMember) {
      loadEnrollments();
    }
  }, [loadMembers, loadEnrollments, userIsMember]);

  // Format payments ledger list from members data
  const paymentRecords = useMemo(() => {
    return members.map((m) => {
      const plan = m.membershipPlan || {};
      const amount = m.paymentAmount || plan.price || 7000;
      const method = m.paymentMethod || m.paymentDetails?.method || "UPI";
      const txId =
        m.transactionId ||
        m.paymentDetails?.transactionId ||
        `TXN-${m.id?.slice(-6) || "984210"}`;
      const receiptNo =
        m.paymentDetails?.receiptNo || `REC-${m.id?.slice(-6) || "8024"}`;
      const paymentDate =
        m.paymentDate ||
        m.planStartDate ||
        m.createdAt?.slice(0, 10) ||
        "2026-03-01";
      const status = m.status === "Inactive" ? "Due Soon" : "Paid";

      return {
        id: m.id,
        memberId: m.memberId || m.id,
        name:
          m.name ||
          `${m.firstName || ""} ${m.lastName || ""}`.trim() ||
          "Athlete",
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
        totalAdjustmentCredit: m.totalAdjustmentCredit || 0,
        pendingSessionsCount: m.pendingSessionsCount || (m.carryForwardSessions?.length || 0),
        appliedAdjustment:
          (m.membershipAdjustmentCredits || []).find((c) => c.status === "APPLIED_TO_RENEWAL")
            ?.appliedToPayment?.adjustmentAmount || 0,
        originalAmount:
          (m.membershipAdjustmentCredits || []).find((c) => c.status === "APPLIED_TO_RENEWAL")
            ?.appliedToPayment?.originalAmount || amount,
      };
    });
  }, [members]);

  // Filtered members payments
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return paymentRecords.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.memberId.toLowerCase().includes(q) ||
        p.txId.toLowerCase().includes(q) ||
        p.phone.includes(q);

      const matchesMethod =
        selectedMethod === "ALL" ||
        p.method.toLowerCase() === selectedMethod.toLowerCase();
      const matchesStatus =
        selectedStatus === "ALL" ||
        p.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [paymentRecords, searchQuery, selectedMethod, selectedStatus]);

  // Filtered enrollments
  const filteredEnrollments = useMemo(() => {
    const q = enrollmentSearch.toLowerCase().trim();
    return enrollments.filter((enr) => {
      const name = (enr.personalDetails?.name || "").toLowerCase();
      const email = (enr.personalDetails?.email || "").toLowerCase();
      const phone = (enr.personalDetails?.mobile || "");
      const id = (enr.id || "").toLowerCase();
      const inv = (enr.invoice?.invoiceNumber || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        id.includes(q) ||
        inv.includes(q);

      const matchesStatus =
        enrollmentStatusFilter === "ALL" ||
        enr.status?.toLowerCase() === enrollmentStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [enrollments, enrollmentSearch, enrollmentStatusFilter]);

  // Aggregate Member KPIs
  const kpis = useMemo(() => {
    const totalCollected = filteredPayments.reduce(
      (acc, p) => acc + (p.amount || 0),
      0
    );
    const paidCount = filteredPayments.filter((p) => p.status === "Paid").length;
    const dueCount = filteredPayments.filter((p) => p.status !== "Paid").length;
    const avgAmount =
      filteredPayments.length > 0
        ? Math.round(totalCollected / filteredPayments.length)
        : 0;

    return { totalCollected, paidCount, dueCount, avgAmount };
  }, [filteredPayments]);

  // Aggregate Enrollment KPIs
  const enrollmentKpis = useMemo(() => {
    const total = enrollments.length;
    const pendingPayment = enrollments.filter(
      (e) => e.status === "Pending Payment"
    ).length;
    const partiallyPaid = enrollments.filter(
      (e) => e.status === "Partially Paid"
    ).length;
    const converted = enrollments.filter(
      (e) => e.status === "Converted" || e.status === "Payment Verified"
    ).length;
    const failedOrExpired = enrollments.filter(
      (e) =>
        e.status === "Payment Failed" ||
        e.status === "Payment Expired" ||
        e.status === "Cancelled"
    ).length;

    return { total, pendingPayment, partiallyPaid, converted, failedOrExpired };
  }, [enrollments]);

  // Viewport Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 8;
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedMethod, selectedStatus, activeTab, enrollmentSearch, enrollmentStatusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      (activeTab === "members" ? filteredPayments.length : filteredEnrollments.length) /
        pageSize
    )
  );
  const safePage = Math.max(1, Math.min(page, totalPages));

  // Handle Generate & Send / Resend WhatsApp Link
  const handleResendLink = async (enr) => {
    try {
      const res = await generateAndSendPaymentLink(enr.id);
      const isResend = enr.whatsappStatus?.sent || (enr.whatsappStatus?.resendCount && enr.whatsappStatus.resendCount > 0);
      toast.success(
        isResend
          ? `Payment link successfully resent to ${enr.personalDetails?.mobile} via WhatsApp.`
          : `Razorpay payment link generated and dispatched to ${enr.personalDetails?.mobile} via WhatsApp.`,
        { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> }
      );
      setEnrollments((prev) =>
        prev.map((item) => (item.id === enr.id ? res : item))
      );
      if (selectedEnrollment?.id === enr.id) {
        setSelectedEnrollment(res);
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate or send payment link.");
    }
  };

  // Helper for status badge colors
  const getEnrollmentStatusBadge = (status) => {
    switch (status) {
      case "Converted":
      case "Payment Verified":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Pending Payment":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Partially Paid":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Payment Failed":
      case "Payment Expired":
      case "Cancelled":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // Columns for Members Payments Table
  const memberColumns = useMemo(
    () => [
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
          <div className="flex flex-col items-center">
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              ₹{p.amount.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap justify-center">
              {p.appliedAdjustment > 0 && (
                <span
                  className="inline-flex items-center text-[9px] font-mono font-bold text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.2 rounded"
                  title={`Deducted ₹${p.appliedAdjustment} from emergency class cancellation credit`}
                >
                  -₹{p.appliedAdjustment} Adj
                </span>
              )}
              {p.totalAdjustmentCredit > 0 && (
                <span
                  className="inline-flex items-center text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded"
                  title="Available adjustment credit for next renewal"
                >
                  ₹{p.totalAdjustmentCredit} Credit
                </span>
              )}
              {p.pendingSessionsCount > 0 && (
                <span
                  className="inline-flex items-center text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded"
                  title="Carried-forward pending sessions entitled"
                >
                  {p.pendingSessionsCount} Pending
                </span>
              )}
            </div>
          </div>
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
    ],
    [userIsMember]
  );

  // Columns for Enrollments & Pending Payments Table
  const enrollmentColumns = useMemo(
    () => [
      {
        header: "Enrollment & Invoice",
        cell: (enr) => (
          <div>
            <div className="font-bold text-foreground text-xs">{enr.id}</div>
            <div className="text-[10px] font-mono text-primary font-semibold mt-0.5">
              {enr.invoice?.invoiceNumber}
            </div>
            <span className="text-[10px] text-muted-foreground">Inq: {enr.inquiryId}</span>
          </div>
        ),
      },
      {
        header: "Candidate Athlete",
        cell: (enr) => (
          <div>
            <div className="font-bold text-foreground text-xs">
              {enr.personalDetails?.name || "Candidate"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {enr.personalDetails?.mobile}
            </div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
              {enr.personalDetails?.email}
            </div>
          </div>
        ),
      },
      {
        header: "Subscribed Plan",
        cell: (enr) => (
          <div>
            <span className="font-semibold text-foreground block">
              {enr.membershipPlan?.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {enr.membershipPlan?.durationMonths} Mo • Starts{" "}
              {enr.membershipPlan?.startDate
                ? new Date(enr.membershipPlan.startDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })
                : "Today"}
            </span>
            {enr.batchName && (
              <span className="block text-[10px] text-primary/80 truncate">
                Batch: {enr.batchName}
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Payable Breakdown",
        align: "right",
        cell: (enr) => {
          const pricing = enr.pricing || {};
          return (
            <div className="text-right">
              <span className="font-mono font-extrabold text-sm text-foreground block">
                ₹{pricing.finalAmount?.toLocaleString("en-IN")}
              </span>
              {pricing.discountAmount > 0 && (
                <span className="text-[10px] text-emerald-400 font-medium block">
                  Concession: -₹{pricing.discountAmount?.toLocaleString("en-IN")}
                </span>
              )}
              {pricing.paidAmount > 0 && (
                <span className="text-[10px] text-muted-foreground block">
                  Paid: ₹{pricing.paidAmount?.toLocaleString("en-IN")} (Due: ₹
                  {pricing.balanceAmount?.toLocaleString("en-IN")})
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Payment Status",
        align: "center",
        cell: (enr) => (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getEnrollmentStatusBadge(
              enr.status
            )}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {enr.status}
          </span>
        ),
      },
      {
        header: "WhatsApp Channel",
        align: "center",
        cell: (enr) => {
          const ws = enr.whatsappStatus || {};
          const status = ws.deliveryStatus || "None";
          const badgeClass =
            status === "Delivered"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : status === "Read"
              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
              : status === "Sent"
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : status === "Failed"
              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
              : status === "Simulated"
              ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
              : "bg-muted text-muted-foreground border-border";

          return (
            <div className="text-center">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
              >
                <MessageSquare size={10} className="shrink-0" />
                <span>{status}</span>
              </span>
              {ws.resendCount > 0 && (
                <span className="block text-[9px] text-muted-foreground mt-0.5">
                  Resent ({ws.resendCount}x)
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Workflow Actions",
        align: "right",
        cell: (enr) => {
          const isPaid = enr.status === "Converted" || enr.invoice?.status === "Paid";
          return (
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
              {/* View Dossier */}
              <button
                type="button"
                onClick={() => setSelectedEnrollment(enr)}
                className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                title="View Enrollment Dossier & Invoice Breakdown"
              >
                <Eye size={13} />
              </button>

              {/* Resend Link (Admin Only) */}
              {!isPaid && userIsAdmin && (
                <button
                  type="button"
                  onClick={() => handleResendLink(enr)}
                  className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                  title="Resend WhatsApp Payment Link"
                >
                  <Send size={13} />
                </button>
              )}

              {/* Record Offline Payment */}
              {!isPaid && (
                <button
                  type="button"
                  onClick={() => setOfflinePaymentEnrollment(enr)}
                  className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                  title="Record Offline Cash / UPI Payment"
                >
                  <CreditCard size={13} />
                </button>
              )}

              {/* Simulate Online Pay / Checkout */}
              {!isPaid && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `/payment/checkout?enrollmentId=${encodeURIComponent(
                        enr.id
                      )}&orderId=${enr.invoice?.gatewayOrderId || "order_sim"}`,
                      "_blank"
                    )
                  }
                  className="p-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                  title="Open Customer Checkout Portal"
                >
                  <ExternalLink size={13} />
                </button>
              )}

              {/* Receipt View if converted */}
              {isPaid && (
                <button
                  type="button"
                  onClick={() =>
                    setReceiptRecord({
                      name: enr.personalDetails?.name || "Athlete",
                      memberId: enr.convertedMemberId || "MEM-PENDING",
                      phone: enr.personalDetails?.mobile,
                      planName: enr.membershipPlan?.name,
                      durationMonths: enr.membershipPlan?.durationMonths,
                      batchName: enr.batchName || "General Batch",
                      amount: enr.pricing?.finalAmount,
                      method: enr.invoice?.paymentGateway || "UPI",
                      paymentDate: new Date(
                        enr.invoice?.paidAt || enr.updatedAt
                      ).toLocaleDateString(),
                      txId: enr.invoice?.gatewayPaymentId || "TXN-VERIFIED",
                      receiptNo: "TSW-REC-ENR-" + enr.id.slice(-4),
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  title="View Receipt"
                >
                  <Receipt size={12} />
                  <span>Receipt</span>
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col gap-2.5">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-2.5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {userIsMember
              ? "Athlete Portal • Financial Receipts"
              : "Financial Ledger • Payment-First Member Conversion"}
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight mt-0.5">
            {userIsMember
              ? "My Payment Receipts & Subscription Ledger"
              : "Payments & Enrollment Verification Ledger"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userIsMember
              ? "Review your personal membership plan, subscription receipts, and verified transaction status."
              : "Audit subscription dues, manage candidate payment links, and verify payments prior to member activation."}
          </p>
        </div>
      </div>

      {/* ─── Primary Tabs (Admin View) ───────────────────────────────────────── */}
      {!userIsMember && (
        <div className="flex items-center gap-2 border-b border-border/80">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={14} />
            <span>Active Members Ledger ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("enrollments")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "enrollments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus size={14} />
            <span>Pending Enrollments & Payment Links</span>
            {enrollmentKpis.pendingPayment > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-extrabold border border-amber-500/30">
                {enrollmentKpis.pendingPayment}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ─── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {activeTab === "members" || userIsMember ? (
          <>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Collected
                </span>
                <IndianRupee size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                ₹{kpis.totalCollected.toLocaleString("en-IN")}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Settled subscription revenue
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Active Paid
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-500">
                {kpis.paidCount}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Active paid subscriptions
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Due Soon
                </span>
                <AlertCircle size={16} className="text-amber-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-amber-500">
                {kpis.dueCount}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Renewals required
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Avg Transaction
                </span>
                <CreditCard size={16} className="text-accent" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                ₹{kpis.avgAmount.toLocaleString("en-IN")}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Average plan value
              </p>
            </div>
          </>
        ) : (
          /* Enrollment Tab KPIs */
          <>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Total Enrollments
                </span>
                <UserPlus size={16} className="text-primary" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-foreground">
                {enrollmentKpis.total}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                All initiated dossiers
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Pending Payment
                </span>
                <Clock size={16} className="text-amber-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-amber-400">
                {enrollmentKpis.pendingPayment}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Awaiting gateway/offline payment
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Partially Paid
                </span>
                <CreditCard size={16} className="text-blue-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-blue-400">
                {enrollmentKpis.partiallyPaid}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Token advance received
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Verified & Converted
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-400">
                {enrollmentKpis.converted}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Converted to active members
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
              placeholder={
                activeTab === "members"
                  ? userIsMember
                    ? "Filter receipts, txn ID, plan..."
                    : "Search athlete, member ID, phone, txn..."
                  : "Search candidate name, mobile, email, invoice #..."
              }
              value={activeTab === "members" ? searchQuery : enrollmentSearch}
              onChange={(e) =>
                activeTab === "members"
                  ? setSearchQuery(e.target.value)
                  : setEnrollmentSearch(e.target.value)
              }
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "members" ? (
            <>
              {/* Method Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Method:
                </span>
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
                {filteredPayments.length} Record
                {filteredPayments.length === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <>
              {/* Enrollment Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground">
                  Workflow Status:
                </span>
                <select
                  value={enrollmentStatusFilter}
                  onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  {ENROLLMENT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === "ALL" ? "All Stages" : s}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] font-mono text-muted-foreground ml-1">
                {filteredEnrollments.length} Enrollment
                {filteredEnrollments.length === 1 ? "" : "s"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ─── Table Content ────────────────────────────────────────────── */}
      {activeTab === "members" ? (
        <DataTable
          columns={memberColumns}
          data={filteredPayments}
          pageSize={pageSize}
          currentPage={safePage}
          onPageChange={setPage}
          totalItems={filteredPayments.length}
          totalPages={totalPages}
          itemLabel="payments"
          loading={isLoadingMembers}
          loadingRowsCount={7}
          showToolbar={false}
          emptyIcon={CreditCard}
          emptyTitle="No payment records found"
          emptyMessage="Try adjusting your filters or search keywords."
          className="flex-1 min-h-0"
        />
      ) : (
        <DataTable
          columns={enrollmentColumns}
          data={filteredEnrollments}
          pageSize={pageSize}
          currentPage={safePage}
          onPageChange={setPage}
          totalItems={filteredEnrollments.length}
          totalPages={totalPages}
          itemLabel="enrollments"
          loading={isLoadingEnrollments}
          loadingRowsCount={7}
          showToolbar={false}
          emptyIcon={UserPlus}
          emptyTitle="No pending enrollments found"
          emptyMessage="Proceed to enrollment from contacted inquiries to track candidates here."
          className="flex-1 min-h-0"
        />
      )}

      {/* ─── Enrollment Detail Dossier Modal ─────────────────────────────────── */}
      <EnrollmentDetailModal
        isOpen={Boolean(selectedEnrollment)}
        onClose={() => setSelectedEnrollment(null)}
        enrollment={selectedEnrollment}
        onResendLink={handleResendLink}
        onRecordPayment={(enr) => {
          setSelectedEnrollment(null);
          setOfflinePaymentEnrollment(enr);
        }}
        onSimulatePayment={(enr) =>
          window.open(
            `/payment/checkout?enrollmentId=${encodeURIComponent(
              enr.id
            )}&orderId=${enr.invoice?.gatewayOrderId || "order_sim"}`,
            "_blank"
          )
        }
      />

      {/* ─── Record Offline Payment Modal ───────────────────────────────────── */}
      <RecordOfflinePaymentModal
        isOpen={Boolean(offlinePaymentEnrollment)}
        onClose={() => setOfflinePaymentEnrollment(null)}
        enrollment={offlinePaymentEnrollment}
        onSuccess={() => {
          loadEnrollments();
          loadMembers();
        }}
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
                  Receipt No:{" "}
                  <span className="text-foreground font-semibold">
                    {receiptRecord.receiptNo}
                  </span>
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
                    Method:{" "}
                    <span className="font-semibold text-foreground">
                      {receiptRecord.method}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground block truncate">
                    Txn: {receiptRecord.txId}
                  </span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    Enrolled Plan: {receiptRecord.planName} (
                    {receiptRecord.durationMonths} Mo)
                  </span>
                  <span className="font-mono">
                    ₹{receiptRecord.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Training Batch: {receiptRecord.batchName}</span>
                  <span>Enrolled</span>
                </div>
                {receiptRecord.appliedAdjustment > 0 && (
                  <div className="flex items-center justify-between text-destructive text-[11px] font-semibold bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-lg">
                    <span>Emergency Cancellation Adjustment Deduction</span>
                    <span className="font-mono">-₹{receiptRecord.appliedAdjustment.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {receiptRecord.pendingSessionsCount > 0 && (
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                    <span>Carried-Forward Pending Sessions</span>
                    <span>{receiptRecord.pendingSessionsCount} Sessions Entitled</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Applicable GST / Taxes</span>
                  <span>Included</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-sm font-black text-emerald-500">
                  <span>Total Settled Amount</span>
                  <span className="font-mono text-base">
                    ₹{receiptRecord.amount.toLocaleString("en-IN")}
                  </span>
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
