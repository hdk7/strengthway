/* eslint-disable max-lines */
import { useState, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  Upload,
  User,
  MapPin,
  PhoneCall,
  Activity,
  FileCheck,
  Calendar,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  FileText,
  CreditCard,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminMemberRegistrationSchema,
  validateWithYup,
  validateFieldWithYup,
} from "@/lib/validation";
import { InputField, SelectField, TextareaField } from "@/components/form";
import { createMember, updateMember, convertLeadToMember } from "@/lib/membersService";
import { getBatches, enrollMemberInBatch } from "@/lib/batchesService";
import {
  getMembershipPlans,
  MEMBERSHIP_PLANS,
  PAYMENT_METHODS,
  calculateMembershipDates,
  generateTransactionId,
  generateReceiptNumber,
} from "@/lib/membershipPlans";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobile: "",
  email: "",
  photo: null,
  photoName: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyNumber: "",
  height: "",
  weight: "",
  medicalDoc: null,
  medicalDocName: "",
  medicalDocSize: "",
  bio: "",
  batchId: "",
};

export function AdminMemberRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  memberToEdit = null,
  leadToConfirm = null,
}) {
  const activeLead =
    leadToConfirm ||
    (memberToEdit?.status === "Lead" || memberToEdit?.status === "Inquiry"
      ? memberToEdit
      : null);
  const isConfirmingLead = Boolean(activeLead);
  const isEditingActiveMember = Boolean(
    memberToEdit &&
      memberToEdit.status !== "Lead" &&
      memberToEdit.status !== "Inquiry",
  );

  const [availablePlans, setAvailablePlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [paymentForm, setPaymentForm] = useState({
    selectedPlanId: "plan-quarterly",
    paymentMethod: "UPI",
    transactionId: "",
    amountPaid: 18000,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentNotes: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Sync form with leadToConfirm / memberToEdit or reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const activeBatches = getBatches();
      setBatches(activeBatches);
      const activePlans = getMembershipPlans(false);
      const plansList = activePlans.length > 0 ? activePlans : getMembershipPlans(true);
      setAvailablePlans(plansList);

      const defaultPlan = plansList.find((p) => p.popular) || plansList[0];
      setPaymentForm({
        selectedPlanId: defaultPlan?.id || "",
        paymentMethod: "UPI",
        transactionId: generateTransactionId("UPI"),
        amountPaid: defaultPlan?.price || 0,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentNotes: isConfirmingLead
          ? `Enrollment payment for inquiry ${activeLead.firstName || "Athlete"}`
          : "",
      });

      const sourceData = activeLead || memberToEdit;
      if (sourceData) {
        const rawName = (sourceData.name || sourceData.fullName || "").trim();
        const nameParts = rawName ? rawName.split(/\s+/) : [];
        const derivedFirst = sourceData.firstName || nameParts[0] || "";
        const derivedLast =
          sourceData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");

        setForm({
          firstName: derivedFirst,
          lastName: derivedLast,
          dob: sourceData.dob || "",
          gender: sourceData.gender || "",
          mobile: sourceData.mobile || "",
          email: sourceData.email || "",
          photo: sourceData.photo || null,
          photoName: sourceData.photoName || "",
          address: sourceData.address || "",
          city: sourceData.city || "",
          state: sourceData.state || "",
          country: sourceData.country || "India",
          pincode: sourceData.pincode || "",
          emergencyName: sourceData.emergencyName || "",
          emergencyRelationship: sourceData.emergencyRelationship || "",
          emergencyNumber: sourceData.emergencyNumber || "",
          height: sourceData.height ? String(sourceData.height) : "",
          weight: sourceData.weight ? String(sourceData.weight) : "",
          medicalDoc: sourceData.medicalDoc || null,
          medicalDocName: sourceData.medicalDocName || "",
          medicalDocSize: sourceData.medicalDocSize || "",
          bio:
            sourceData.bio ||
            (isConfirmingLead
              ? "Active club member pursuing functional training and athletic progression."
              : ""),
          batchId: sourceData.batchId || activeBatches[0]?.id || "",
        });
      } else {
        setForm({
          ...INITIAL_FORM,
          batchId: activeBatches[0]?.id || "",
        });
      }
      setErrors({});
    }
  }, [isOpen, memberToEdit, leadToConfirm, activeLead, isConfirmingLead]);

  const selectedBatch = batches.find((b) => b.id === form.batchId);
  const chosenPlan =
    availablePlans.find((p) => p.id === paymentForm.selectedPlanId) || availablePlans[0];

  const handleClose = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrors({});
    if (!memberToEdit && !leadToConfirm) {
      setForm(INITIAL_FORM);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    const fieldError = validateFieldWithYup(adminMemberRegistrationSchema, name, nextForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    const currentForm = { ...form, [name]: value !== undefined ? value : form[name] };
    const fieldError = validateFieldWithYup(adminMemberRegistrationSchema, name, currentForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        photo: reader.result,
        photoName: file.name,
      }));
      toast.success("Profile photo uploaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: null, photoName: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDocUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Supported formats are PDF, JPG, PNG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Document file size must not exceed 10MB.");
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setForm((prev) => ({
      ...prev,
      medicalDoc: file.name,
      medicalDocName: file.name,
      medicalDocSize: sizeFormatted,
    }));
    toast.success("Medical fitness document attached!");
  };

  const handleRemoveDoc = () => {
    setForm((prev) => ({
      ...prev,
      medicalDoc: null,
      medicalDocName: "",
      medicalDocSize: "",
    }));
    if (docInputRef.current) {
      docInputRef.current.value = "";
    }
  };

  const validateStep1 = () => {
    const step1Keys = ["firstName", "lastName", "dob", "gender", "mobile", "email"];
    const errs = {};
    step1Keys.forEach((key) => {
      const msg = validateFieldWithYup(adminMemberRegistrationSchema, key, form);
      if (msg) errs[key] = msg;
    });

    if (!paymentForm.selectedPlanId) {
      errs.selectedPlanId = "Please select a membership plan.";
    }
    if (!paymentForm.amountPaid || Number(paymentForm.amountPaid) <= 0) {
      errs.amountPaid = "Please specify a valid payment amount.";
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const step2Keys = [
      "address",
      "city",
      "state",
      "country",
      "pincode",
      "emergencyName",
      "emergencyRelationship",
      "emergencyNumber",
      "height",
      "weight",
      "bio",
    ];
    const errs = {};
    step2Keys.forEach((key) => {
      const msg = validateFieldWithYup(adminMemberRegistrationSchema, key, form);
      if (msg) errs[key] = msg;
    });

    if (isConfirmingLead && !form.medicalDoc && !form.medicalDocName) {
      errs.medicalDoc =
        "Medical fitness document is required before confirming member registration.";
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleProceedToBalanceDetails = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!validateStep1()) {
      toast.error(
        "Please fill all required personal, plan, and payment details before proceeding.",
      );
      return;
    }
    setStep(2);
  };

  const handleCompleteRegistration = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    const isStep1Valid = validateStep1();
    const isStep2Valid = validateStep2();

    if (!isStep1Valid || !isStep2Valid) {
      if (!isStep1Valid) {
        setStep(1);
        toast.error("Please complete all personal and payment fields in Step 1.");
      } else {
        toast.error("Please complete all balance registration fields.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const plan =
        availablePlans.find((p) => p.id === paymentForm.selectedPlanId) || availablePlans[0];
      const dates = calculateMembershipDates(
        plan.durationMonths,
        new Date(paymentForm.paymentDate),
      );

      const membershipPlan = {
        id: plan.id,
        name: plan.name,
        durationMonths: plan.durationMonths,
        price: Number(paymentForm.amountPaid),
        formattedPrice: `₹${Number(paymentForm.amountPaid).toLocaleString("en-IN")}`,
        startDate: dates.startDate,
        endDate: dates.endDate,
        formattedStart: dates.formattedStart,
        formattedEnd: dates.formattedEnd,
      };

      const paymentDetails = {
        method: paymentForm.paymentMethod,
        amount: Number(paymentForm.amountPaid),
        formattedAmount: `₹${Number(paymentForm.amountPaid).toLocaleString("en-IN")}`,
        transactionId:
          paymentForm.transactionId?.trim() ||
          generateTransactionId(paymentForm.paymentMethod) ||
          `TXN-${Date.now().toString().slice(-8)}`,
        receiptNo: generateReceiptNumber(),
        status: "Completed",
        paidAt: new Date(paymentForm.paymentDate).toISOString(),
        notes: paymentForm.paymentNotes,
      };

      const selectedBatchInfo = batches.find((b) => b.id === form.batchId);
      const scheduleDetails = selectedBatchInfo
        ? {
            batchId: selectedBatchInfo.id,
            batchName: selectedBatchInfo.name,
            batchTiming: selectedBatchInfo.timingLabel || selectedBatchInfo.startTime,
            daysLabel: selectedBatchInfo.daysLabel || selectedBatchInfo.daysPattern,
            daysPattern: selectedBatchInfo.daysPattern,
          }
        : null;

      let resultMember;
      if (isConfirmingLead) {
        resultMember = convertLeadToMember(activeLead.id, {
          ...form,
          batchId: form.batchId || selectedBatchInfo?.id || "",
          batchName: scheduleDetails?.batchName || "General Access",
          batchTiming: scheduleDetails?.batchTiming || "",
          shift: scheduleDetails?.batchTiming || "",
          assignedBatch: scheduleDetails?.batchName || "General Access",
          schedule: scheduleDetails,
          membershipPlan,
          paymentDetails,
        });

        toast.success(
          `Inquiry ${form.firstName} ${form.lastName}`.trim() +
            ` confirmed as an active Member with ${plan.name} Plan!`,
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          },
        );
      } else {
        resultMember = createMember({
          ...form,
          batchId: form.batchId || selectedBatchInfo?.id || "",
          batchName: scheduleDetails?.batchName || "General Access",
          batchTiming: scheduleDetails?.batchTiming || "",
          shift: scheduleDetails?.batchTiming || "",
          assignedBatch: scheduleDetails?.batchName || "General Access",
          schedule: scheduleDetails,
          status: "Active",
          membershipPlan,
          paymentDetails,
        });

        toast.success(
          `Member ${form.firstName} ${form.lastName}`.trim() +
            ` registered & activated with ${plan.name} Plan!`,
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          },
        );
      }

      // Automatically assign member to the corresponding chosen batch timing
      if (form.batchId && resultMember?.id) {
        enrollMemberInBatch(form.batchId, resultMember.id);
      }

      setForm(INITIAL_FORM);
      setStep(1);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
      if (onSuccess) {
        onSuccess(resultMember, isConfirmingLead);
      }
      handleClose();
    } catch {
      toast.error("An error occurred while saving registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditingActiveMember) {
      const isStep1Valid = validateStep1();
      const isStep2Valid = validateStep2();
      if (!isStep1Valid || !isStep2Valid) {
        toast.error("Please fill in all required fields correctly.");
        return;
      }
      setIsSubmitting(true);
      try {
        const updated = updateMember(memberToEdit.id, form);
        toast.success(
          `Member ${form.firstName} ${form.lastName}`.trim() + " updated successfully!",
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          },
        );
        if (onSuccess) {
          onSuccess(updated, true);
        }
        handleClose();
      } catch {
        toast.error("An error occurred while saving updates.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (step === 1) {
        handleProceedToBalanceDetails(e);
      } else {
        handleCompleteRegistration(e);
      }
    }
  };

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        {/* Overlay backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Window */}
        <DialogPrimitive.Content
          aria-describedby="admin-member-registration-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-3xl max-h-[92vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
        >
          {/* Header */}
          <div className="relative border-b border-border/60 px-6 py-5 sm:px-8 shrink-0 text-center">
            {!isEditingActiveMember && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    step === 1
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  1. Registration & Payment
                </span>
                <span className="text-muted-foreground">•</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    step === 2
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2. Member Details
                </span>
              </div>
            )}

            <DialogPrimitive.Title className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isConfirmingLead
                ? `Member Registration ${activeLead?.firstName || ""} ${activeLead?.lastName || ""}`.trim()
                : isEditingActiveMember
                  ? "Edit Member Profile"
                  : step === 1
                    ? "Member Registration & Plan Payment"
                    : "Member Details"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="admin-member-registration-desc"
              className="mt-1 text-xs sm:text-sm text-muted-foreground"
            >
              {isConfirmingLead
                ? step === 1
                  ? "Step 1 of 2: Review personal details, select training schedule, choose plan & record payment."
                  : "Step 2 of 2: Complete residence address, emergency contact, physical fitness details & medical document."
                : isEditingActiveMember
                  ? "Update gym member profile details, physical stats, and contact info"
                  : step === 1
                    ? "Step 1 of 2: Enter personal details, select training batch, choose plan & record payment."
                    : "Step 2 of 2: Complete residence address, emergency contact, physical vitals & medical document."}
            </DialogPrimitive.Description>

            <DialogPrimitive.Close
              onClick={handleClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-5 rounded-full p-2 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Form scrollable body */}
          {step === 1 ? (
            <form
              id="admin-member-registration-form"
              onSubmit={handleSubmit}
              noValidate
              className="no-scrollbar flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 space-y-8"
            >
              {/* Pre-populated Inquiry Banner */}
              {isConfirmingLead && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500 font-bold">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground text-sm">
                      Inquiry Information Pre-Populated
                    </p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      Personal and Contact Information have been automatically loaded from this
                      athlete&apos;s prospective inquiry submission. Please complete the remaining
                      required sections: <strong>Emergency Contact</strong>,{" "}
                      <strong>Fitness Information</strong>, and{" "}
                      <strong>Medical Fitness Document</strong> below before proceeding to plan
                      &amp; payment.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. PERSONAL INFORMATION */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <User className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Personal Information
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-first-name"
                    name="firstName"
                    label="First Name"
                    required
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.firstName}
                  />

                  <InputField
                    id="admin-member-last-name"
                    name="lastName"
                    label="Last Name"
                    required
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.lastName}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-dob"
                    name="dob"
                    type="date"
                    label="Date of Birth"
                    required
                    max={new Date().toISOString().split("T")[0]}
                    value={form.dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.dob}
                    startIcon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                    inputClassName="[color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                  />

                  <SelectField
                    id="admin-member-gender"
                    name="gender"
                    label="Gender"
                    required
                    value={form.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.gender}
                    placeholder="Select Gender"
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "Other", label: "Other" },
                      { value: "Prefer not to say", label: "Prefer not to say" },
                    ]}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-mobile"
                    name="mobile"
                    type="tel"
                    label="Mobile Number"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={form.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.mobile}
                  />

                  <InputField
                    id="admin-member-email"
                    name="email"
                    type="email"
                    label="Email"
                    required
                    placeholder="e.g. alex@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.email}
                  />
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Profile Photo
                  </label>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-border p-3.5 bg-background/50">
                    {form.photo ? (
                      <div className="relative flex items-center gap-3">
                        <img
                          src={form.photo}
                          alt="Profile preview"
                          className="h-14 w-14 rounded-xl object-cover border border-border shadow-sm"
                        />
                        <div>
                          <p className="text-xs font-medium text-foreground max-w-[200px] truncate">
                            {form.photoName || "Uploaded photo"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Ready for registration
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="ml-2 inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-colors cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload Photo</span>
                          </button>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            JPG, PNG, or WEBP up to 5MB
                          </p>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      id="admin-member-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </section>

              {/* 2. TRAINING SCHEDULE & BATCH SLOT */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Training Schedule &amp; Batch Slot
                  </h3>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      <span>Batch &amp; Timing</span>
                    </label>
                    {selectedBatch && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                        {selectedBatch.daysPattern || "MWF"}
                      </span>
                    )}
                  </div>

                  <SelectField
                    id="admin-member-batch"
                    name="batchId"
                    value={form.batchId}
                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                    placeholder="Select Training Batch Slot"
                    options={batches.map((b) => ({
                      value: b.id,
                      label: `${b.name} • ${b.timingLabel || b.startTime} (${b.currentPax || 0}/${b.maxPax || 28} Pax)`,
                    }))}
                  />
                </div>
              </section>

              {/* 3. MEMBERSHIP PLAN SELECTION */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Membership Plan
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-accent">Select commitment tier</span>
                </div>

                <div className="space-y-3">
                  <SelectField
                    id="admin-member-plan"
                    name="selectedPlanId"
                    label="Choose Membership Plan Tier"
                    required
                    value={paymentForm.selectedPlanId}
                    onChange={(e) => {
                      const planId = e.target.value;
                      const found = availablePlans.find((p) => p.id === planId);
                      setPaymentForm((prev) => ({
                        ...prev,
                        selectedPlanId: planId,
                        amountPaid: found ? found.price : prev.amountPaid,
                      }));
                    }}
                    error={errors.selectedPlanId}
                    placeholder="Select Membership Plan Tier"
                    options={availablePlans.map((plan) => ({
                      value: plan.id,
                      label: `${plan.name} — ${plan.formattedPrice} ${plan.period} (${plan.durationMonths} Month${plan.durationMonths > 1 ? "s" : ""}) ${plan.badge ? `• [${plan.badge}]` : ""}`,
                    }))}
                  />
                </div>
              </section>

              {/* 4. PAYMENT FORM DETAILS */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <CreditCard className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Payment Form Details
                  </h3>
                </div>

                {/* Choose Payment Method Dropdown */}
                <SelectField
                  id="admin-member-payment-method"
                  name="paymentMethod"
                  label="Payment Option / Method"
                  required
                  value={paymentForm.paymentMethod}
                  onChange={(e) => {
                    const methodId = e.target.value;
                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentMethod: methodId,
                      transactionId: generateTransactionId(methodId),
                    }));
                  }}
                  placeholder="Select Payment Option / Method"
                  options={PAYMENT_METHODS.map((method) => ({
                    value: method.id,
                    label: `${method.name} — ${method.id === "Cash" ? "Gym Reception" : "Digital Transaction"}`,
                  }))}
                />

                {/* Payment Details Inputs without Transaction ID field */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                  <InputField
                    label="Amount Received (₹)"
                    required
                    type="number"
                    value={paymentForm.amountPaid}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, amountPaid: e.target.value }))
                    }
                    inputClassName="font-semibold"
                    error={errors.amountPaid}
                  />

                  <InputField
                    label="Payment Date"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                  />
                </div>

                <InputField
                  label="Billing Notes / Reference (Optional)"
                  type="text"
                  value={paymentForm.paymentNotes}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, paymentNotes: e.target.value }))
                  }
                  placeholder="e.g. Paid at reception counter / GPay reference"
                />
              </section>
            </form>
          ) : (
            <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
              {/* Member & Plan Summary Header */}
              <div className="rounded-2xl border border-border bg-surface/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent font-bold text-sm uppercase border border-border shrink-0">
                    {form.firstName?.[0]}
                    {form.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground font-display">
                      {form.firstName} {form.lastName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {form.email} • {form.mobile}
                    </p>
                    {selectedBatch && (
                      <p className="text-[11px] text-accent mt-0.5">
                        Batch: {selectedBatch.name} (
                        {selectedBatch.timingLabel || selectedBatch.startTime})
                      </p>
                    )}
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Plan &amp; Paid
                  </span>
                  <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold text-accent">
                      {chosenPlan?.name || "Quarterly Pro"}
                    </span>
                    <span className="text-lg font-black text-emerald-400 font-display">
                      ₹{Number(paymentForm.amountPaid).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. CONTACT & RESIDENCE INFORMATION */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contact &amp; Residence Information
                  </h3>
                </div>

                <TextareaField
                  id="admin-member-address"
                  name="address"
                  rows={2}
                  label="Address"
                  required
                  placeholder="Street address, building, apartment, or flat number"
                  value={form.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.address}
                  textareaClassName="no-scrollbar resize-none"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-city"
                    name="city"
                    label="City"
                    required
                    placeholder="Enter city"
                    value={form.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.city}
                  />

                  <InputField
                    id="admin-member-state"
                    name="state"
                    label="State"
                    required
                    placeholder="Enter state"
                    value={form.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.state}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-country"
                    name="country"
                    label="Country"
                    required
                    placeholder="Enter country"
                    value={form.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.country}
                  />

                  <InputField
                    id="admin-member-pincode"
                    name="pincode"
                    label="Pincode"
                    required
                    placeholder="e.g. 400001"
                    value={form.pincode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.pincode}
                  />
                </div>
              </section>

              {/* 2. EMERGENCY CONTACT */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <PhoneCall className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Emergency Contact
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-emergency-name"
                    name="emergencyName"
                    label="Contact Name"
                    required
                    placeholder="Emergency contact person"
                    value={form.emergencyName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.emergencyName}
                  />

                  <SelectField
                    id="admin-member-emergency-relationship"
                    name="emergencyRelationship"
                    label="Relationship"
                    required
                    value={form.emergencyRelationship}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.emergencyRelationship}
                    placeholder="Select Relationship"
                    options={[
                      { value: "Parent", label: "Parent" },
                      { value: "Spouse", label: "Spouse" },
                      { value: "Sibling", label: "Sibling" },
                      { value: "Relative", label: "Relative" },
                      { value: "Friend", label: "Friend" },
                      { value: "Guardian", label: "Guardian" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                </div>

                <InputField
                  id="admin-member-emergency-number"
                  name="emergencyNumber"
                  type="tel"
                  label="Contact Number"
                  required
                  placeholder="Emergency contact mobile number"
                  value={form.emergencyNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.emergencyNumber}
                />
              </section>

              {/* 3. FITNESS INFORMATION */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <Activity className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fitness Information
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    id="admin-member-height"
                    name="height"
                    type="number"
                    step="0.1"
                    label="Height"
                    required
                    placeholder="e.g. 175"
                    value={form.height}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.height}
                    endAdornment={
                      <span className="text-xs font-semibold text-muted-foreground pr-3.5">cm</span>
                    }
                  />

                  <InputField
                    id="admin-member-weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    label="Weight"
                    required
                    placeholder="e.g. 72"
                    value={form.weight}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.weight}
                    endAdornment={
                      <span className="text-xs font-semibold text-muted-foreground pr-3.5">kg</span>
                    }
                  />
                </div>
              </section>

              {/* 4. MEDICAL FITNESS DOCUMENT & BIO */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <FileCheck className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Medical Fitness Document &amp; Bio
                  </h3>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Medical Fitness Document{" "}
                    {isConfirmingLead && <span className="text-destructive">*</span>}
                  </label>
                  <div
                    className={`rounded-xl border border-dashed p-4 bg-background/50 ${
                      errors.medicalDoc
                        ? "border-destructive ring-1 ring-destructive/30"
                        : "border-border"
                    }`}
                  >
                    {form.medicalDocName ? (
                      <div className="flex items-center justify-between gap-3 p-2 bg-card rounded-lg border border-border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {form.medicalDocName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {form.medicalDocSize}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDoc}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent mb-2">
                          <FileCheck className="h-6 w-6" />
                        </div>
                        <button
                          type="button"
                          onClick={() => docInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-colors cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Medical Clearance Document</span>
                        </button>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Supported formats: PDF, JPG, PNG (Max 10MB)
                        </p>
                      </div>
                    )}

                    <input
                      ref={docInputRef}
                      id="admin-member-doc-upload"
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/jpg"
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                  </div>
                  {errors.medicalDoc && (
                    <p className="mt-1.5 text-xs text-destructive font-medium">
                      {errors.medicalDoc}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <TextareaField
                  id="admin-member-bio"
                  name="bio"
                  rows={3}
                  label="Athlete Bio &amp; Coaching Notes"
                  required
                  placeholder="Tell us about the athlete's background, training history or fitness goals..."
                  value={form.bio}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.bio}
                  textareaClassName="no-scrollbar resize-none"
                />
              </section>
            </div>
          )}

          {/* Footer Actions */}
          <div className="relative z-10 border-t border-border/60 bg-card px-6 py-4 sm:px-8 shrink-0 flex items-center justify-between gap-3 rounded-b-2xl sm:rounded-b-3xl">
            {step === 2 && !memberToEdit ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Registration &amp; Payment</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-border bg-background px-5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </DialogPrimitive.Close>

              {isEditingActiveMember ? (
                <button
                  type="submit"
                  form="admin-member-registration-form"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </button>
              ) : step === 1 ? (
                <button
                  type="button"
                  onClick={handleProceedToBalanceDetails}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  <span>Next: Member Details</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2 text-xs font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>
                        {isConfirmingLead
                          ? "Complete Registration & Confirm Member"
                          : "Complete Registration & Activate Member"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default AdminMemberRegistrationModal;
