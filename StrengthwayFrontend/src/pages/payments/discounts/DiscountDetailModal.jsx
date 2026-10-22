/* eslint-disable max-lines */
import { useState } from "react";
import {
  X,
  Tag,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Send,
  Ban,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowRight,
  FileText,
  CreditCard,
  History,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cancelDiscount, resendDiscountNotification } from "@/lib/memberDiscountsService";

export default function DiscountDetailModal({
  discount,
  isOpen,
  onClose,
  onDiscountUpdated,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (!isOpen || !discount) return null;

  const isRedeemed = discount.status === "Redeemed";
  const isCancelled = discount.status === "Cancelled";
  const isExpired = discount.status === "Expired";
  const canCancel = !isRedeemed && !isCancelled;

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const checkoutUrl = `${origin}/payment/checkout?discountId=${encodeURIComponent(discount.id)}`;
    navigator.clipboard.writeText(checkoutUrl);
    toast.success("Discount checkout link copied to clipboard!");
  };

  const handleResendNotification = async () => {
    setIsSubmitting(true);
    try {
      await resendDiscountNotification(discount.id);
      toast.success("In-app discount offer notification resent to member login!");
      if (onDiscountUpdated) onDiscountUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to resend notification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDiscount = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a reason for cancelling this offer.");
      return;
    }
    setIsSubmitting(true);
    try {
      await cancelDiscount(discount.id, cancelReason.trim());
      toast.success("Discount offer cancelled safely.");
      setShowCancelPrompt(false);
      if (onDiscountUpdated) onDiscountUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to cancel discount.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Redeemed":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Notified":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "Payment Pending":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Assigned":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "Expired":
        return "bg-orange-500/15 text-orange-400 border-orange-500/30";
      case "Cancelled":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Tag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground tracking-tight">
                  {discount.id}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                    discount.status
                  )}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {discount.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Campaign:{" "}
                <span className="font-medium text-foreground">
                  {discount.campaignName || discount.campaignId || "Direct Offer"}
                </span>
                {discount.campaignId && (
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    ({discount.campaignId})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Member Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-base">
                {discount.memberName?.charAt(0) || "M"}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  {discount.memberName}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono text-primary">{discount.memberId}</span>
                  {discount.memberMobile && <span>• {discount.memberMobile}</span>}
                  {discount.memberEmail && <span>• {discount.memberEmail}</span>}
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Target Membership Plan
              </div>
              <div className="text-sm font-semibold text-foreground mt-0.5">
                {discount.planName || discount.planId}
              </div>
            </div>
          </div>

          {/* Pricing & Discount Math Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Standard Price
              </span>
              <span className="text-lg font-bold text-foreground mt-1 block">
                ₹{Number(discount.standardPrice || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Configured Discount
              </span>
              <span className="text-lg font-bold text-primary mt-1 block">
                {discount.discountType === "percentage"
                  ? `${discount.discountValue}%`
                  : `₹${Number(discount.discountValue || 0).toLocaleString("en-IN")}`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <span className="text-[11px] font-medium text-rose-400 block">
                Discount Amount
              </span>
              <span className="text-lg font-bold text-rose-400 mt-1 block">
                - ₹{Number(discount.discountAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <span className="text-[11px] font-semibold text-emerald-400 block">
                Final Payable Amount
              </span>
              <span className="text-lg font-extrabold text-emerald-400 mt-1 block">
                ₹{Number(discount.finalPayableAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Rules & Expiry Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center gap-3">
              <Clock size={16} className="text-muted-foreground shrink-0" />
              <div>
                <span className="font-medium text-foreground block">Application Rule</span>
                <span className="text-muted-foreground">
                  Valid for immediate next membership payment / renewal only
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center gap-3">
              <Calendar size={16} className="text-muted-foreground shrink-0" />
              <div>
                <span className="font-medium text-foreground block">Offer Expiry</span>
                <span className="text-muted-foreground">
                  {discount.expiryDate
                    ? new Date(discount.expiryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No expiration date configured"}
                </span>
              </div>
            </div>
          </div>

          {/* In-App Notification Delivery Status */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h4 className="font-semibold text-foreground text-sm">
                  Member Login Notification
                </h4>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  discount.notificationStatus === "SENT"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {discount.notificationStatus || "PENDING"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This discount offer is delivered privately to this member&apos;s login portal
              notification center and payment checkout area. Other members have zero visibility into
              this custom pricing.
            </p>
            {discount.notificationSentAt && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Last dispatched: {new Date(discount.notificationSentAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {/* Redemption Details if Redeemed */}
          {isRedeemed && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={18} />
                <h4 className="font-bold text-sm">Redeemed Towards Membership Payment</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">Invoice Reference</span>
                  <span className="font-mono font-semibold text-foreground">
                    {discount.appliedToInvoice?.invoiceNumber || "INV-REN-AUTO"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payment Reference</span>
                  <span className="font-mono font-semibold text-foreground">
                    {discount.appliedToInvoice?.paymentId ||
                      discount.appliedToInvoice?.transactionId ||
                      "TXN-ONLINE"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Redeemed At</span>
                  <span className="font-medium text-foreground">
                    {discount.redeemedAt
                      ? new Date(discount.redeemedAt).toLocaleString("en-IN")
                      : "Verified"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History size={14} /> Audit Trail & History
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Array.isArray(discount.auditLogs) && discount.auditLogs.length > 0 ? (
                discount.auditLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {log.action?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          by {log.performedBy || "System"}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-muted-foreground mt-0.5 text-[11px]">{log.notes}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {log.performedAt
                        ? new Date(log.performedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No audit records yet.</p>
              )}
            </div>
          </div>

          {/* Cancel Offer Prompt */}
          {showCancelPrompt && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertCircle size={16} /> Confirm Cancellation of Offer
              </div>
              <p className="text-xs text-muted-foreground">
                This will safely invalidate the unused discount offer. Existing completed invoices
                and historical payments will remain completely untouched.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason (e.g. Member requested different duration)..."
                rows={2}
                className="w-full text-xs p-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border text-foreground hover:bg-muted cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCancelDiscount}
                  className="px-3 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/40 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {!isRedeemed && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy Checkout Link</span>
              </button>
            )}

            {!isRedeemed && !isCancelled && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleResendNotification}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors cursor-pointer"
              >
                <Send size={13} />
                <span>Resend Notification</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canCancel && !showCancelPrompt && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
              >
                <Ban size={13} />
                <span>Cancel Offer</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
