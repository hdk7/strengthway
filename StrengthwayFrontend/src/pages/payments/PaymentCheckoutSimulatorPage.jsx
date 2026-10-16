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
} from "lucide-react";
import { toast } from "sonner";
import { getEnrollmentById, verifyOnlinePayment } from "@/lib/enrollmentsService";

export default function PaymentCheckoutSimulatorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const enrollmentId = searchParams.get("enrollmentId");
  const orderId = searchParams.get("orderId");

  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (!enrollmentId) {
      setError("No enrollment reference specified.");
      setIsLoading(false);
      return;
    }

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
  }, [enrollmentId]);

  const handlePay = async (simulateFailure = false) => {
    if (!enrollment) return;
    setIsProcessing(true);

    try {
      if (simulateFailure) {
        // Test failure branch
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
    } catch (err) {
      toast.error(err.message || "Payment verification failed.");
      if (simulateFailure) {
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

  if (error || !enrollment) {
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
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const plan = enrollment.membershipPlan || {};
  const pricing = enrollment.pricing || {};
  const invoice = enrollment.invoice || {};
  const personal = enrollment.personalDetails || {};

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
        <p className="text-xs text-slate-400 mt-1">Official Member Enrollment & Subscription Checkout</p>
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
                Welcome to Strengthway, {personal.firstName}!
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                Your membership for the <strong className="text-slate-200">{plan.name}</strong> is now officially activated.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Receipt Ref:</span>
                <span className="font-mono font-bold text-white">
                  {verificationResult?.receiptNo || "TSW-REC-2026-VERIFIED"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono text-slate-300">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-bold text-emerald-400">
                  ₹{pricing.finalAmount?.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Membership Valid Until:</span>
                <span className="font-medium text-slate-300">
                  {plan.formattedEnd || new Date(plan.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate("/admin/payments/members")}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                Go to Admin Payments Ledger
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/trainers-members/members")}
                className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                View Active Members Directory
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Payment Form */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Invoice & Plan Header */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Candidate Dossier</span>
                <span className="font-mono text-emerald-400 font-bold">{invoice.invoiceNumber}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{personal.name}</h3>
                  <p className="text-xs text-slate-400">{plan.name} • {plan.durationMonths} Months</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Payable Amount</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    ₹{pricing.finalAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {pricing.discountAmount > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400">
                  <span>Concession Applied:</span>
                  <span>-₹{pricing.discountAmount?.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select Payment Method</label>
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
                    <span>Pay ₹{pricing.finalAmount?.toLocaleString("en-IN")} Securely</span>
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
