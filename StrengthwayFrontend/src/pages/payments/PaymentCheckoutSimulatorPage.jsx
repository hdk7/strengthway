/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Receipt,
  QrCode,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  Tag,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { getEnrollmentById, verifyOnlinePayment } from "@/lib/enrollmentsService";
import { getDiscountById, verifyDiscountPayment } from "@/lib/memberDiscountsService";
import { formatINR } from "@/lib/formatters";

export default function PaymentCheckoutSimulatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const enrollmentId = searchParams.get("enrollmentId");
  const discountId = searchParams.get("discountId");
  const orderId = searchParams.get("orderId");

  const [enrollment, setEnrollment] = useState(null);
  const [discount, setDiscount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const isDiscountCheckout = Boolean(discountId);

  useEffect(() => {
    if (!enrollmentId && !discountId) {
      setError("No enrollment or discount reference specified.");
      setIsLoading(false);
      return;
    }

    if (discountId) {
      // Load discount checkout
      getDiscountById(discountId)
        .then((data) => {
          if (!data) {
            setError(`Discount offer reference "${discountId}" was not found.`);
          } else {
            setDiscount(data);
            if (data.status === "Redeemed") {
              setPaymentSuccess(true);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load discount checkout:", err);
          setError(err.message || "Failed to load discount checkout details.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Load enrollment checkout
      getEnrollmentById(enrollmentId)
        .then((data) => {
          if (!data) {
            setError(`Enrollment reference "${enrollmentId}" was not found.`);
          } else {
            setEnrollment(data);
            if (data.status === "Converted" || data.invoice?.status === "Paid") {
              setPaymentSuccess(true);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load enrollment for payment:", err);
          setError(err.message || "Failed to load checkout details.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [enrollmentId, discountId]);

  const handlePay = async (simulateFailure = false) => {
    setIsProcessing(true);

    try {
      if (isDiscountCheckout) {
        if (!discount) return;
        if (simulateFailure) {
          throw new Error("Simulated payment transaction failure branch");
        }

        const mockPaymentId = `pay_sim_${Date.now()}`;
        const result = await verifyDiscountPayment(discount.id, {
          razorpay_order_id: orderId || discount.appliedToInvoice?.gatewayOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: "simulated_success",
          mockPayment: true,
        });

        setVerificationResult(result);
        setPaymentSuccess(true);
        toast.success("Payment verified! Member discount redeemed and plan renewed successfully.", {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        });
      } else {
        if (!enrollment) return;
        if (simulateFailure) {
          await verifyOnlinePayment(enrollment.id, {
            razorpay_order_id: orderId || enrollment.invoice?.gatewayOrderId,
            razorpay_payment_id: "pay_failed_test",
            razorpay_signature: "invalid_sig",
            mockPayment: false,
          });
        } else {
          const mockPaymentId = `pay_sim_${Date.now()}`;
          const result = await verifyOnlinePayment(enrollment.id, {
            razorpay_order_id: orderId || enrollment.invoice?.gatewayOrderId,
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: "simulated_success",
            mockPayment: true,
          });

          setVerificationResult(result);
          setPaymentSuccess(true);
          toast.success("Payment verified! Membership activated successfully.", {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          });
        }
      }
    } catch (err) {
      toast.error(err.message || "Payment verification failed.");
      if (simulateFailure && enrollment) {
        setEnrollment((prev) => ({
          ...prev,
          status: "Payment Failed",
          invoice: { ...prev.invoice, status: "Payment Failed" },
        }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error || (!enrollment && !discount)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-3xl border border-rose-500/30 bg-slate-900 shadow-2xl text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-lg font-bold text-white">Payment Checkout Error</h1>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/admin/payments/members")}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract relevant details depending on checkout type
  const customerName = isDiscountCheckout
    ? discount?.memberName
    : enrollment?.personalDetails?.name;
  const planName = isDiscountCheckout
    ? discount?.planName
    : enrollment?.membershipPlan?.name;
  const standardPrice = isDiscountCheckout
    ? Number(discount?.standardPrice || 0)
    : Number(enrollment?.pricing?.standardPrice || 0);
  const discountAmount = isDiscountCheckout
    ? Number(discount?.discountAmount || 0)
    : Number(enrollment?.pricing?.discountAmount || 0);
  const finalPayable = isDiscountCheckout
    ? Number(discount?.finalPayableAmount || 0)
    : Number(enrollment?.pricing?.finalAmount || 0);
  const refCode = isDiscountCheckout
    ? discount?.id
    : enrollment?.invoice?.invoiceNumber || enrollment?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
          <Lock size={12} />
          <span>256-Bit Encrypted Payment Portal</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>STRENGTHWAY</span>
          <span className="text-emerald-400">GYM</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isDiscountCheckout
            ? "Exclusive Member Offer Renewal Checkout"
            : "Official Member Enrollment & Subscription Checkout"}
        </p>
      </div>

      {/* Main Checkout Card */}
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden">
        {paymentSuccess ? (
          /* Payment Verified Screen */
          <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Payment Successfully Verified
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Thank you, {customerName}!
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                Your membership renewal for <strong className="text-slate-200">{planName}</strong> is
                now officially activated with your applied discount.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold text-white">{refCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-emerald-400">
                  {formatINR(finalPayable)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Saved:</span>
                  <span className="font-semibold">- {formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-emerald-400">Active & Verified</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate("/admin/payments/members")}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                Go to Payments Ledger
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Payment Form */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Discount Banner if applicable */}
            {isDiscountCheckout && (
              <div className="p-3.5 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Tag className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-white block">
                      Member Exclusive Offer Applied!
                    </span>
                    <span className="text-[11px] text-slate-300">
                      {discount?.discountType === "percentage"
                        ? `${discount?.discountValue}% OFF`
                        : `₹${discount?.discountValue} Flat Concession`}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-md">
                  {discount?.id}
                </span>
              </div>
            )}

            {/* Plan & Pricing Box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Account Dossier</span>
                <span className="font-mono text-emerald-400 font-bold">{refCode}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{customerName}</h3>
                  <p className="text-xs text-slate-400">{planName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Payable Amount
                  </span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    {formatINR(finalPayable)}
                  </span>
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Percent size={11} /> Discount Deduction:
                  </span>
                  <span>- {formatINR(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "UPI", label: "UPI / QR", icon: QrCode },
                  { id: "Card", label: "Cards", icon: CreditCard },
                  { id: "NetBanking", label: "NetBanking", icon: Building },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      paymentMethod === id
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/50"
                        : "border-slate-800 bg-slate-950/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon size={18} className="mx-auto mb-1 text-inherit" />
                    <span className="text-xs font-bold block">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway Interactive Preview */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              {paymentMethod === "UPI" && (
                <div className="space-y-2">
                  <div className="h-28 w-28 mx-auto p-2 bg-white rounded-xl shadow-md flex items-center justify-center">
                    <QrCode size={96} className="text-slate-950" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scan with Google Pay, PhonePe, Paytm, or BHIM UPI
                  </p>
                </div>
              )}

              {paymentMethod === "Card" && (
                <div className="space-y-2 text-left text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                    <span>Card Number: </span>
                    <span className="text-white font-mono">•••• •••• •••• 4242</span>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    Simulated Sandbox Payment Card Preloaded
                  </p>
                </div>
              )}

              {paymentMethod === "NetBanking" && (
                <div className="text-xs text-slate-400 py-3">
                  All major Indian banks supported (HDFC, ICICI, SBI, Axis).
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handlePay(false)}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Verifying Secure Transaction...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Pay {formatINR(finalPayable)} Securely</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => handlePay(true)}
                  disabled={isProcessing}
                  className="text-rose-400/80 hover:text-rose-300 transition-colors underline cursor-pointer"
                >
                  Test Payment Failure Branch
                </button>
                <Link to="/admin/payments/members" className="hover:text-slate-400">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-[11px] text-slate-500 text-center">
        Powered by Strengthway Payment Gateway Integration Engine
      </p>
    </div>
  );
}
