/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import {
  CreditCard,
  Receipt,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { recordOfflinePayment } from "@/lib/enrollmentsService";

export default function RecordOfflinePaymentModal({
  isOpen,
  onClose,
  enrollment,
  onSuccess,
}) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const pricing = enrollment?.pricing || {};
  const currentBalance = pricing.balanceAmount !== undefined ? pricing.balanceAmount : pricing.finalAmount || 0;

  useEffect(() => {
    if (!isOpen || !enrollment) return;
    setAmount(String(currentBalance));
    setPaymentMethod("Cash");
    setTransactionId("");
    setReceiptNotes("");
    setError("");
  }, [isOpen, enrollment, currentBalance]);

  if (!isOpen || !enrollment) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please specify a valid payment amount greater than zero.");
      return;
    }
    if (numAmount > currentBalance) {
      setError(`Payment cannot exceed current outstanding balance of ₹${currentBalance.toLocaleString("en-IN")}.`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await recordOfflinePayment(enrollment.id, {
        amount: numAmount,
        paymentMethod,
        transactionId: transactionId.trim(),
        receiptNotes: receiptNotes.trim(),
      });

      const isFullyPaid = numAmount >= currentBalance;

      toast.success(
        isFullyPaid
          ? `Full payment of ₹${numAmount.toLocaleString("en-IN")} recorded! Member activated.`
          : `Partial payment of ₹${numAmount.toLocaleString("en-IN")} recorded. Remaining dues: ₹${(
              currentBalance - numAmount
            ).toLocaleString("en-IN")}`,
        {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        }
      );

      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error("Recording offline payment failed:", err);
      setError(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Record Offline Collection</h2>
              <p className="text-[11px] text-muted-foreground">
                Invoice {enrollment.invoice?.invoiceNumber} • {enrollment.personalDetails?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Balance Callout */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <span className="text-amber-300 font-medium">Outstanding Balance Due:</span>
            <span className="text-base font-extrabold text-amber-400">
              ₹{currentBalance.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["Cash", "UPI", "Card"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === m
                      ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Amount Collected (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={`Max ₹${currentBalance}`}
              required
            />
          </div>

          {/* Reference / Transaction ID */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {paymentMethod === "UPI" ? "UPI Reference / Txn ID" : "Receipt / Note Ref"}
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={paymentMethod === "UPI" ? "e.g. UPI-9842104" : "e.g. CASH-101"}
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Internal Remarks / Notes
            </label>
            <textarea
              rows={2}
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Paid in full at reception desk"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
