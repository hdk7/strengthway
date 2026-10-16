/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import {
  User,
  CreditCard,
  Percent,
  Calendar,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Receipt,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  FormModal,
  FormModalHeader,
  FormModalBody,
  FormModalFooter,
  FormSectionHeader,
  FormCalloutBox,
} from "@/components/ui/FormModal";
import { InputField, TextareaField, SelectField } from "@/components/form";
import { getMembershipPlans } from "@/lib/membershipPlans";
import { getBatches } from "@/lib/batchesService";
import { createEnrollment, getInquiryEnrollment } from "@/lib/enrollmentsService";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const EMERGENCY_RELATION_OPTIONS = [
  { value: "Spouse", label: "Spouse" },
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Brother", label: "Brother" },
  { value: "Sister", label: "Sister" },
  { value: "Friend", label: "Friend" },
  { value: "Other", label: "Other" },
];

export default function EnrollmentModal({
  isOpen,
  onClose,
  inquiry,
  onSuccess,
}) {
  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState(null);

  // Form State
  const [personalDetails, setPersonalDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    gender: "Male",
    dob: "",
    address: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "Other",
    bio: "",
  });

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [proposedStartDate, setProposedStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const [discountType, setDiscountType] = useState("none"); // "none" | "fixed" | "percentage"
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");

  const [paymentMode, setPaymentMode] = useState("PAYMENT_LINK"); // "PAYMENT_LINK" | "OFFLINE_CASH" | "OFFLINE_UPI"
  const [offlinePaidAmount, setOfflinePaidAmount] = useState("");
  const [offlineTransactionId, setOfflineTransactionId] = useState("");
  const [offlineNotes, setOfflineNotes] = useState("");

  const [errors, setErrors] = useState({});

  // Pre-fill data when modal opens
  useEffect(() => {
    if (!isOpen || !inquiry) return;
    setErrors({});
    setIsLoadingData(true);

    // Split name into first and last name
    const rawName = (inquiry.name || "").trim();
    const parts = rawName.split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";

    setPersonalDetails({
      firstName,
      lastName,
      email: inquiry.email || "",
      mobile: inquiry.mobile || "",
      gender: inquiry.gender || "Male",
      dob: "",
      address: inquiry.address || "",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "",
      emergencyName: "",
      emergencyPhone: "",
      emergencyRelation: "Other",
      bio: inquiry.message ? `Inquiry Note: ${inquiry.message}` : "",
    });

    setProposedStartDate(new Date().toISOString().split("T")[0]);

    // Fetch master plans, batches, and check existing enrollment
    Promise.all([
      getMembershipPlans(false),
      getBatches(),
      getInquiryEnrollment(inquiry.id),
    ])
      .then(([activePlans, activeBatches, activeEnrollment]) => {
        const resolvedPlans = Array.isArray(activePlans) ? activePlans : [];
        const resolvedBatches = Array.isArray(activeBatches) ? activeBatches : [];

        setPlans(resolvedPlans);
        setBatches(resolvedBatches);

        if (activeEnrollment) {
          setExistingEnrollment(activeEnrollment);
          setSelectedPlanId(activeEnrollment.membershipPlan?.id || resolvedPlans[0]?.id || "");
          setSelectedBatchId(activeEnrollment.batchId || "");
          setDiscountType(activeEnrollment.pricing?.discountType || "none");
          setDiscountValue(activeEnrollment.pricing?.discountValue || "");
          setDiscountReason(activeEnrollment.pricing?.discountReason || "");
          if (activeEnrollment.personalDetails) {
            setPersonalDetails((prev) => ({
              ...prev,
              ...activeEnrollment.personalDetails,
            }));
          }
        } else {
          setExistingEnrollment(null);
          const defaultPlan = resolvedPlans.find((p) => p.popular) || resolvedPlans[0];
          setSelectedPlanId(defaultPlan?.id || "");
        }
      })
      .catch((err) => {
        console.error("Failed to load enrollment dependencies:", err);
        toast.error("Failed to load membership plans and batches.");
      })
      .finally(() => {
        setIsLoadingData(false);
      });
  }, [isOpen, inquiry]);

  // Selected Plan Object
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || null;
  }, [plans, selectedPlanId]);

  // Live Pricing Breakdown
  const pricingCalculation = useMemo(() => {
    const originalPrice = Number(selectedPlan?.price || 0);
    const dVal = Number(discountValue || 0);

    let discountAmount = 0;
    if (discountType === "percentage") {
      const pct = Math.min(100, Math.max(0, dVal));
      discountAmount = Math.round((originalPrice * pct) / 100);
    } else if (discountType === "fixed") {
      discountAmount = Math.min(originalPrice, Math.max(0, dVal));
    }

    const finalAmount = Math.max(0, originalPrice - discountAmount);

    return {
      originalPrice,
      discountAmount,
      finalAmount,
    };
  }, [selectedPlan, discountType, discountValue]);

  // Sync offline collected amount default when switching to offline mode
  useEffect(() => {
    if (paymentMode === "OFFLINE_CASH" || paymentMode === "OFFLINE_UPI") {
      setOfflinePaidAmount(pricingCalculation.finalAmount.toString());
    }
  }, [paymentMode, pricingCalculation.finalAmount]);

  const validateForm = () => {
    const newErrors = {};
    if (!personalDetails.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (!personalDetails.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalDetails.email)) {
      newErrors.email = "Please provide a valid email.";
    }
    if (!personalDetails.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    }
    if (!selectedPlanId) {
      newErrors.planId = "Please select a membership plan.";
    }
    if (!proposedStartDate) {
      newErrors.proposedStartDate = "Proposed start date is required.";
    }

    if (discountType === "percentage" && Number(discountValue) > 100) {
      newErrors.discountValue = "Discount cannot exceed 100%.";
    }
    if (discountType === "fixed" && Number(discountValue) > pricingCalculation.originalPrice) {
      newErrors.discountValue = "Discount cannot exceed original plan price.";
    }
    if (discountType !== "none" && Number(discountValue) > 0 && !discountReason.trim()) {
      newErrors.discountReason = "Please specify a reason for applying this discount.";
    }

    if (
      (paymentMode === "OFFLINE_CASH" || paymentMode === "OFFLINE_UPI") &&
      Number(offlinePaidAmount) > pricingCalculation.finalAmount
    ) {
      newErrors.offlinePaidAmount = "Collected amount cannot exceed the final payable amount.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!validateForm()) {
      toast.error("Please resolve validation errors before proceeding.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        inquiryId: inquiry.id,
        firstName: personalDetails.firstName.trim(),
        lastName: personalDetails.lastName.trim(),
        email: personalDetails.email.trim().toLowerCase(),
        mobile: personalDetails.mobile.trim(),
        gender: personalDetails.gender,
        dob: personalDetails.dob,
        address: personalDetails.address.trim(),
        city: personalDetails.city.trim(),
        state: personalDetails.state.trim(),
        pincode: personalDetails.pincode.trim(),
        emergencyName: personalDetails.emergencyName.trim(),
        emergencyPhone: personalDetails.emergencyPhone.trim(),
        emergencyRelation: personalDetails.emergencyRelation,
        bio: personalDetails.bio.trim(),
        planId: selectedPlanId,
        proposedStartDate,
        batchId: selectedBatchId || null,
        discountType,
        discountValue: Number(discountValue || 0),
        discountReason: discountReason.trim(),
        paymentMode,
        offlinePaidAmount:
          paymentMode === "OFFLINE_CASH" || paymentMode === "OFFLINE_UPI"
            ? Number(offlinePaidAmount || 0)
            : 0,
        offlineTransactionId: offlineTransactionId.trim(),
        offlineNotes: offlineNotes.trim(),
      };

      const result = await createEnrollment(payload);

      if (paymentMode === "PAYMENT_LINK") {
        if (result?.whatsappStatus?.sent) {
          toast.success(
            `Enrollment invoice created! Payment link sent via WhatsApp to ${personalDetails.mobile}.`,
            {
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
            }
          );
        } else {
          toast.info(
            `Enrollment invoice created! WhatsApp note: ${result?.whatsappStatus?.failureReason || "Check enrollment detail for direct WhatsApp chat link."}`,
            {
              duration: 7000,
            }
          );
        }
      } else {
        toast.success(
          `Enrollment recorded successfully. Offline payment processed.`,
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          }
        );
      }

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      console.error("Enrollment submission failed:", err);
      toast.error(err.message || "Failed to submit enrollment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      preventOutsideClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <FormModalHeader
          title="Proceed to Member Enrollment"
          subtitle={`Set up subscription, concessions & payment link for ${inquiry?.name || "prospect"}`}
          onClose={onClose}
        >
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Inquiry: {inquiry?.id}
            </span>
            {existingEnrollment && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock size={11} />
                Pending Enrollment: {existingEnrollment.id}
              </span>
            )}
          </div>
        </FormModalHeader>

        {/* Scrollable Form Body */}
        <FormModalBody className="space-y-6">
          {existingEnrollment && (
            <FormCalloutBox
              type="info"
              title="Existing Pending Enrollment Found"
              message={`A pending invoice (${existingEnrollment.invoice?.invoiceNumber}) already exists for this candidate. Modifying details will refresh the pending payment link without duplicating member records.`}
            />
          )}

          {/* Section 1: Personal Details */}
          <div>
            <FormSectionHeader
              title="1. Personal & Contact Details"
              description="Verify or update candidate contact vitals pre-filled from website inquiry"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <InputField
                label="First Name"
                required
                value={personalDetails.firstName}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, firstName: e.target.value }))
                }
                error={errors.firstName}
                placeholder="e.g. Rahul"
              />
              <InputField
                label="Last Name"
                value={personalDetails.lastName}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="e.g. Sharma"
              />
              <InputField
                label="Mobile Number"
                required
                value={personalDetails.mobile}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, mobile: e.target.value }))
                }
                error={errors.mobile}
                placeholder="+91 98765 43210"
              />
              <InputField
                label="Email Address"
                required
                type="email"
                value={personalDetails.email}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, email: e.target.value }))
                }
                error={errors.email}
                placeholder="rahul.sharma@example.com"
              />
              <SelectField
                label="Gender"
                value={personalDetails.gender}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, gender: e.target.value }))
                }
                options={GENDER_OPTIONS}
              />
              <InputField
                label="Date of Birth"
                type="date"
                value={personalDetails.dob}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, dob: e.target.value }))
                }
              />
            </div>

            {/* Address & Emergency Details Collapsible or Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <div className="sm:col-span-2">
                <InputField
                  label="Residential Address"
                  value={personalDetails.address}
                  onChange={(e) =>
                    setPersonalDetails((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Apartment, Street address"
                />
              </div>
              <InputField
                label="Pincode"
                value={personalDetails.pincode}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, pincode: e.target.value }))
                }
                placeholder="560001"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <InputField
                label="Emergency Contact Name"
                value={personalDetails.emergencyName}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, emergencyName: e.target.value }))
                }
                placeholder="Contact Person"
              />
              <InputField
                label="Emergency Phone"
                value={personalDetails.emergencyPhone}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, emergencyPhone: e.target.value }))
                }
                placeholder="+91 Phone"
              />
              <SelectField
                label="Relationship"
                value={personalDetails.emergencyRelation}
                onChange={(e) =>
                  setPersonalDetails((prev) => ({ ...prev, emergencyRelation: e.target.value }))
                }
                options={EMERGENCY_RELATION_OPTIONS}
              />
            </div>
          </div>

          {/* Section 2: Membership Plan & Schedule */}
          <div>
            <FormSectionHeader
              title="2. Membership Plan & Validity"
              description="Choose the subscription tier and preferred operating batch timing"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Membership Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">— Select Plan —</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationMonths} Mo) — ₹{p.price?.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
                {errors.planId && (
                  <p className="mt-1 text-[11px] text-rose-500">{errors.planId}</p>
                )}
              </div>

              <InputField
                label="Proposed Start Date"
                required
                type="date"
                value={proposedStartDate}
                onChange={(e) => setProposedStartDate(e.target.value)}
                error={errors.proposedStartDate}
              />
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Batch Allocation (Optional)
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">— No Batch Assigned (General Facility Access) —</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.timingLabel} • {b.daysLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Pricing, Concessions & Payment Setup */}
          <div>
            <FormSectionHeader
              title="3. Pricing, Concession & Payment Link"
              description="Calculate final dues on backend and configure link delivery or counter collection"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Discount Concession
                </label>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType("none");
                      setDiscountValue("");
                    }}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      discountType === "none"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed")}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      discountType === "fixed"
                        ? "bg-card text-foreground shadow-xs text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Fixed (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                      discountType === "percentage"
                        ? "bg-card text-foreground shadow-xs text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Pct (%)
                  </button>
                </div>
              </div>

              {discountType !== "none" && (
                <>
                  <InputField
                    label={discountType === "percentage" ? "Discount (%)" : "Discount (₹)"}
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    error={errors.discountValue}
                    placeholder={discountType === "percentage" ? "e.g. 15" : "e.g. 1000"}
                  />
                  <InputField
                    label="Discount Authorization Reason"
                    required
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    error={errors.discountReason}
                    placeholder="e.g. Early Bird / Student Offer"
                  />
                </>
              )}
            </div>

            {/* Payment Method / Channel Selection */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-foreground mb-2">
                Fulfillment & Payment Workflow Option <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode("PAYMENT_LINK")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    paymentMode === "PAYMENT_LINK"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/40"
                      : "border-border bg-card/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <MessageSquare
                    size={18}
                    className={`shrink-0 mt-0.5 ${
                      paymentMode === "PAYMENT_LINK" ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>WhatsApp Payment Link</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Dispatches secure gateway checkout URL to candidate via WhatsApp Business.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("OFFLINE_CASH")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    paymentMode === "OFFLINE_CASH"
                      ? "border-amber-500/60 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40"
                      : "border-border bg-card/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <CreditCard
                    size={18}
                    className={`shrink-0 mt-0.5 ${
                      paymentMode === "OFFLINE_CASH" ? "text-amber-500" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">Cash at Front Desk</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Record counter cash collection immediately with audited receipt number.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("OFFLINE_UPI")}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    paymentMode === "OFFLINE_UPI"
                      ? "border-blue-500/60 bg-blue-500/10 text-foreground ring-1 ring-blue-500/40"
                      : "border-border bg-card/60 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <Receipt
                    size={18}
                    className={`shrink-0 mt-0.5 ${
                      paymentMode === "OFFLINE_UPI" ? "text-blue-500" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">UPI / Card at Gym</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Collect payment via gym POS QR / Card swipe and input reference code.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Offline Immediate Payment Inputs */}
            {(paymentMode === "OFFLINE_CASH" || paymentMode === "OFFLINE_UPI") && (
              <div className="mt-3 p-4 rounded-xl border border-border/80 bg-muted/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <InputField
                  label="Amount Collected (₹)"
                  required
                  type="number"
                  min="0"
                  value={offlinePaidAmount}
                  onChange={(e) => setOfflinePaidAmount(e.target.value)}
                  error={errors.offlinePaidAmount}
                  placeholder={`Max ₹${pricingCalculation.finalAmount}`}
                />
                <InputField
                  label={paymentMode === "OFFLINE_UPI" ? "UPI Ref / Transaction ID" : "Receipt Identifier"}
                  value={offlineTransactionId}
                  onChange={(e) => setOfflineTransactionId(e.target.value)}
                  placeholder="e.g. UPI-10824-X"
                />
                <InputField
                  label="Payment Notes"
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="Front desk remarks"
                />
              </div>
            )}

            {/* Live Financial Summary Card */}
            <div className="mt-5 rounded-2xl border border-border bg-card/80 p-4 shadow-xs">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Payment Summary</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Backend-Validated Pricing
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Plan Fee ({selectedPlan?.name || "Selected Plan"}):</span>
                  <span>₹{pricingCalculation.originalPrice.toLocaleString("en-IN")}</span>
                </div>
                {pricingCalculation.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>
                      Concession ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):
                    </span>
                    <span>-₹{pricingCalculation.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border flex justify-between items-baseline font-extrabold text-foreground text-sm">
                  <span>Final Payable Amount:</span>
                  <span className="text-base text-emerald-400">
                    ₹{pricingCalculation.finalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                {paymentMode !== "PAYMENT_LINK" && Number(offlinePaidAmount) > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Amount Being Paid Now:</span>
                    <span className="font-semibold text-foreground">
                      ₹{Number(offlinePaidAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FormModalBody>

        {/* Footer */}
        <FormModalFooter className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Processing Enrollment...</span>
              </>
            ) : paymentMode === "PAYMENT_LINK" ? (
              <>
                <Send size={14} />
                <span>Create Invoice & Send WhatsApp Link</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Record Payment & Finalize Enrollment</span>
              </>
            )}
          </button>
        </FormModalFooter>
      </form>
    </FormModal>
  );
}
