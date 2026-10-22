/* eslint-disable max-lines */
import {
  X,
  User,
  CreditCard,
  Receipt,
  MessageSquare,
  Clock,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getCurrentUser } from "@/auth/currentUser";
import { formatINR } from "@/lib/formatters";

export default function EnrollmentDetailModal({
  isOpen,
  onClose,
  enrollment,
  onResendLink,
  onRecordPayment,
  onSimulatePayment,
}) {
  if (!isOpen || !enrollment) return null;

  const plan = enrollment.membershipPlan || {};
  const pricing = enrollment.pricing || {};
  const invoice = enrollment.invoice || {};
  const whatsapp = enrollment.whatsappStatus || {};
  const personal = enrollment.personalDetails || {};
  const auditLogs = enrollment.auditLogs || [];

  const isPaid = invoice.status === "Paid" || enrollment.status === "Converted";
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const getStatusBadge = (status) => {
    switch (status) {
      case "Converted":
      case "Payment Verified":
      case "Paid":
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

  const getWhatsAppBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "read":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "sent":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "simulated":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "failed":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Enrollment & Invoice Details</h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                  enrollment.status
                )}`}
              >
                {enrollment.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <span className="font-mono text-foreground">{enrollment.id}</span> • Invoice:{" "}
              <span className="font-mono text-foreground">{invoice.invoiceNumber}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Candidate Card */}
          <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-primary" />
              <span>Candidate Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-muted-foreground block text-[10px]">Full Name</span>
                <span className="font-semibold text-foreground text-sm">{personal.name || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Phone Number</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Phone size={11} className="text-emerald-500" />
                  {personal.mobile || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Email Address</span>
                <span className="font-medium text-foreground flex items-center gap-1 truncate">
                  <Mail size={11} className="text-blue-500" />
                  {personal.email || "—"}
                </span>
              </div>
            </div>

            {(personal.address || personal.emergencyName) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 text-[11px]">
                {personal.address && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Address</span>
                    <span>{personal.address}, {personal.city} {personal.pincode}</span>
                  </div>
                )}
                {personal.emergencyName && (
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Emergency Contact</span>
                    <span>{personal.emergencyName} ({personal.emergencyRelation}) • {personal.emergencyPhone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Membership & Pricing Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Details */}
            <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={13} className="text-emerald-500" />
                <span>Plan & Subscription</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan Name:</span>
                  <span className="font-bold text-foreground">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{plan.durationMonths} Month{plan.durationMonths > 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proposed Start Date:</span>
                  <span className="font-medium text-foreground">
                    {plan.formattedStart || new Date(plan.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Until:</span>
                  <span className="font-medium text-foreground">
                    {plan.formattedEnd || new Date(plan.endDate).toLocaleDateString()}
                  </span>
                </div>
                {enrollment.batchName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allocated Batch:</span>
                    <span className="font-medium text-primary">{enrollment.batchName} ({enrollment.batchTiming})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={13} className="text-blue-500" />
                <span>Invoice Breakdown</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span>{formatINR(pricing.originalPrice)}</span>
                </div>
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>
                      Concession ({pricing.discountType}):
                      {pricing.discountReason && (
                        <span className="text-[10px] text-muted-foreground ml-1">({pricing.discountReason})</span>
                      )}
                    </span>
                    <span>-{formatINR(pricing.discountAmount)}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-border/60 flex justify-between font-bold text-foreground">
                  <span>Net Payable Amount:</span>
                  <span className="text-sm text-emerald-400">{formatINR(pricing.finalAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Collected:</span>
                  <span className="font-semibold text-foreground">{formatINR(pricing.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Outstanding Balance:</span>
                  <span className={`font-semibold ${pricing.balanceAmount > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {formatINR(pricing.balanceAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp & Payment Link Channel */}
          <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={13} className="text-emerald-500" />
                <span>WhatsApp Payment Link Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">
                  Resend Count: {whatsapp.resendCount || 0}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-muted-foreground block text-[10px]">Delivery Status</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 capitalize ${getWhatsAppBadge(
                    whatsapp.deliveryStatus || "None"
                  )}`}
                >
                  {whatsapp.deliveryStatus || "None"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Dispatched At</span>
                <span className="text-[11px] text-foreground">
                  {whatsapp.sentAt ? new Date(whatsapp.sentAt).toLocaleString() : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Payment Link Status</span>
                <span className="text-[11px] font-semibold text-foreground">
                  {invoice.paymentLink?.status || invoice.status || "Pending"}
                </span>
                <span className="text-[9px] text-muted-foreground block">
                  Gateway: {invoice.paymentGateway || "Razorpay"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Gateway Checkout URL</span>
                {invoice.paymentLink?.url ? (
                  <a
                    href={invoice.paymentLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-medium truncate text-[11px]"
                  >
                    <span>Open Checkout</span>
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {invoice.gatewayPaymentId && (
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                <span>
                  Payment ID: <strong className="text-foreground select-all">{invoice.gatewayPaymentId}</strong>
                </span>
                {invoice.gatewayOrderId && (
                  <span>
                    Order ID: <span className="text-foreground select-all">{invoice.gatewayOrderId}</span>
                  </span>
                )}
              </div>
            )}

            {whatsapp.messageId && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/40">
                <span>Meta Message ID (WAMID):</span>
                <span className="text-foreground select-all">{whatsapp.messageId}</span>
              </div>
            )}

            {whatsapp.failureReason && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400">
                <strong>Delivery Note:</strong> {whatsapp.failureReason}
              </div>
            )}

            {whatsapp.messageContent && (
              <div className="mt-2 p-2.5 rounded-xl bg-card border border-border/60 text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {whatsapp.messageContent}
              </div>
            )}

            {whatsapp.whatsappWebUrl && (
              <div className="flex justify-end pt-1">
                <a
                  href={whatsapp.whatsappWebUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <MessageSquare size={12} />
                  <span>Open Direct Chat in WhatsApp Web</span>
                </a>
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          {auditLogs.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Audit Trail & History
              </div>
              <div className="space-y-2">
                {auditLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-border/50 bg-muted/10 flex items-start justify-between gap-3 text-[11px]"
                  >
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{log.action}</span>
                        <span className="text-muted-foreground font-normal">by {log.performedBy}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{log.notes}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {new Date(log.performedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border/80 bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {!isPaid && isAdmin && (
              <button
                type="button"
                onClick={() => onResendLink(enrollment)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-400 transition-all cursor-pointer shadow-xs"
                title="Generate & Send Payment Link via WhatsApp"
              >
                <Send size={13} />
                <span>
                  {whatsapp.sent || (whatsapp.resendCount && whatsapp.resendCount > 0)
                    ? "Resend Payment Link via WhatsApp"
                    : "Generate & Send Payment Link via WhatsApp"}
                </span>
              </button>
            )}

            {!isPaid && (
              <>
                <button
                  type="button"
                  onClick={() => onRecordPayment(enrollment)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-semibold text-amber-400 transition-all cursor-pointer shadow-xs"
                >
                  <CreditCard size={13} />
                  <span>Record Offline Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSimulatePayment(enrollment)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-xs font-semibold text-primary transition-all cursor-pointer shadow-xs"
                >
                  <ShieldCheck size={13} />
                  <span>Simulate Online Pay</span>
                </button>
              </>
            )}

            {isPaid && enrollment.convertedMemberId && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                <CheckCircle2 size={14} />
                <span>Converted to Member ({enrollment.convertedMemberId})</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
