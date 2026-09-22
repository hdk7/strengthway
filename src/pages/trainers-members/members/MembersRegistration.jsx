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
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminMemberRegistrationSchema,
  validateWithYup,
  validateFieldWithYup,
} from "@/lib/validation";
import { createMember, updateMember, convertLeadToMember } from "@/lib/membersService";
import {
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
};

export function AdminMemberRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  memberToEdit = null,
  leadToConfirm = null,
}) {
  const activeLead = leadToConfirm || (memberToEdit?.status === "Lead" ? memberToEdit : null);
  const isConfirmingLead = Boolean(activeLead);
  const isEditingActiveMember = Boolean(memberToEdit && memberToEdit.status !== "Lead");

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
      const defaultPlan =
        MEMBERSHIP_PLANS.find((p) => p.id === "plan-quarterly") || MEMBERSHIP_PLANS[0];
      setPaymentForm({
        selectedPlanId: defaultPlan.id,
        paymentMethod: "UPI",
        transactionId: generateTransactionId("UPI"),
        amountPaid: defaultPlan.price,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentNotes: isConfirmingLead
          ? `Enrollment payment for lead ${activeLead.firstName || "Athlete"}`
          : "",
      });

      const sourceData = activeLead || memberToEdit;
      if (sourceData) {
        setForm({
          firstName: sourceData.firstName || "",
          lastName: sourceData.lastName || "",
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
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setErrors({});
    }
  }, [isOpen, memberToEdit, leadToConfirm, activeLead, isConfirmingLead]);

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

  const validate = () => {
    const errs = validateWithYup(adminMemberRegistrationSchema, form);
    if (isConfirmingLead && !form.medicalDoc && !form.medicalDocName) {
      errs.medicalDoc =
        "Medical fitness document is required before confirming member registration.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToPayment = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!validate()) {
      toast.error("Please complete all required fields correctly before proceeding.");
      return;
    }
    const defaultPlan =
      MEMBERSHIP_PLANS.find((p) => p.id === paymentForm.selectedPlanId) || MEMBERSHIP_PLANS[0];
    setPaymentForm((prev) => ({
      ...prev,
      amountPaid: prev.amountPaid || defaultPlan.price,
      transactionId: prev.transactionId || generateTransactionId(prev.paymentMethod),
    }));
    setStep(2);
  };

  const handleCompletePaymentAndRegister = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (!paymentForm.selectedPlanId) {
      toast.error("Please select a membership plan.");
      return;
    }
    if (!paymentForm.transactionId || paymentForm.transactionId.trim().length < 4) {
      toast.error("Please provide a valid transaction reference.");
      return;
    }

    setIsSubmitting(true);
    try {
      const plan = MEMBERSHIP_PLANS.find((p) => p.id === paymentForm.selectedPlanId);
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
        transactionId: paymentForm.transactionId.trim(),
        receiptNo: generateReceiptNumber(),
        status: "Completed",
        paidAt: new Date(paymentForm.paymentDate).toISOString(),
        notes: paymentForm.paymentNotes,
      };

      let resultMember;
      if (isConfirmingLead) {
        resultMember = convertLeadToMember(activeLead.id, {
          ...form,
          membershipPlan,
          paymentDetails,
        });

        toast.success(
          `Lead ${form.firstName} ${form.lastName}`.trim() +
            ` confirmed as an active Member with ${plan.name} Plan!`,
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          },
        );
      } else {
        resultMember = createMember({
          ...form,
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
      if (!validate()) {
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
      handleProceedToPayment(e);
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
                  1. Member Profile
                </span>
                <span className="text-muted-foreground">•</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    step === 2
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2. Plan & Payment
                </span>
              </div>
            )}

            <DialogPrimitive.Title className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isConfirmingLead
                ? `Confirm Member: ${activeLead?.firstName || ""} ${activeLead?.lastName || ""}`.trim()
                : isEditingActiveMember
                  ? "Edit Member Profile"
                  : step === 1
                    ? "Member Registration"
                    : "Membership Plan & Payment"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description
              id="admin-member-registration-desc"
              className="mt-1 text-xs sm:text-sm text-muted-foreground"
            >
              {isConfirmingLead
                ? step === 1
                  ? "Review pre-populated lead details, then complete emergency contact, fitness details & medical document."
                  : "Step 2: Select membership plan and record payment to complete member confirmation."
                : isEditingActiveMember
                  ? "Update gym member profile details, physical stats, and contact info"
                  : step === 1
                    ? "Step 1 of 2: Enter personal, emergency contact, and physical fitness details."
                    : "Step 2 of 2: Select a membership commitment tier and complete payment."}
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
              {/* Pre-populated Lead Banner */}
              {isConfirmingLead && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500 font-bold">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-foreground text-sm">
                      Lead Information Pre-Populated
                    </p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      Personal and Contact Information have been automatically loaded from this
                      athlete&apos;s prospective lead submission. Please complete the remaining
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
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="admin-member-first-name"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-first-name"
                      name="firstName"
                      type="text"
                      required
                      placeholder="Enter first name"
                      value={form.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.firstName
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="admin-member-last-name"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Last Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-last-name"
                      name="lastName"
                      type="text"
                      required
                      placeholder="Enter last name"
                      value={form.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.lastName
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Date of Birth */}
                  <div>
                    <label
                      htmlFor="admin-member-dob"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Date of Birth <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="admin-member-dob"
                        name="dob"
                        type="date"
                        required
                        max={new Date().toISOString().split("T")[0]}
                        value={form.dob}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onClick={(e) => e.target.showPicker?.()}
                        className={`w-full rounded-xl border bg-background pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${
                          errors.dob
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-border focus:border-accent focus:ring-accent/20"
                        }`}
                      />
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.dob && <p className="mt-1 text-xs text-destructive">{errors.dob}</p>}
                  </div>

                  {/* Gender */}
                  <div>
                    <label
                      htmlFor="admin-member-gender"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Gender <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="admin-member-gender"
                      name="gender"
                      required
                      value={form.gender}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 cursor-pointer ${
                        errors.gender
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-xs text-destructive">{errors.gender}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Mobile Number */}
                  <div>
                    <label
                      htmlFor="admin-member-mobile"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Mobile Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-mobile"
                      name="mobile"
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={form.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.mobile
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.mobile && (
                      <p className="mt-1 text-xs text-destructive">{errors.mobile}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="admin-member-email"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-email"
                      name="email"
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.email
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
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

              {/* 2. CONTACT INFORMATION */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contact Information
                  </h3>
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="admin-member-address"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Address <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="admin-member-address"
                    name="address"
                    rows={2}
                    required
                    placeholder="Street address, building, apartment, or flat number"
                    value={form.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`no-scrollbar w-full rounded-xl border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 resize-none ${
                      errors.address
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-border focus:border-accent focus:ring-accent/20"
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-destructive">{errors.address}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* City */}
                  <div>
                    <label
                      htmlFor="admin-member-city"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      City <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-city"
                      name="city"
                      type="text"
                      required
                      placeholder="Enter city"
                      value={form.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.city
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
                  </div>

                  {/* State */}
                  <div>
                    <label
                      htmlFor="admin-member-state"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      State <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-state"
                      name="state"
                      type="text"
                      required
                      placeholder="Enter state"
                      value={form.state}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.state
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.state && (
                      <p className="mt-1 text-xs text-destructive">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Country */}
                  <div>
                    <label
                      htmlFor="admin-member-country"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Country <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-country"
                      name="country"
                      type="text"
                      required
                      placeholder="Enter country"
                      value={form.country}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.country
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.country && (
                      <p className="mt-1 text-xs text-destructive">{errors.country}</p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div>
                    <label
                      htmlFor="admin-member-pincode"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Pincode <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-pincode"
                      name="pincode"
                      type="text"
                      required
                      placeholder="e.g. 400001"
                      value={form.pincode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.pincode
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-xs text-destructive">{errors.pincode}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 3. EMERGENCY CONTACT */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <PhoneCall className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Emergency Contact
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Contact Name */}
                  <div>
                    <label
                      htmlFor="admin-member-emergency-name"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Contact Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="admin-member-emergency-name"
                      name="emergencyName"
                      type="text"
                      required
                      placeholder="Emergency contact person"
                      value={form.emergencyName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                        errors.emergencyName
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    />
                    {errors.emergencyName && (
                      <p className="mt-1 text-xs text-destructive">{errors.emergencyName}</p>
                    )}
                  </div>

                  {/* Relationship */}
                  <div>
                    <label
                      htmlFor="admin-member-emergency-relationship"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Relationship <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="admin-member-emergency-relationship"
                      name="emergencyRelationship"
                      required
                      value={form.emergencyRelationship}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 cursor-pointer ${
                        errors.emergencyRelationship
                          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                      }`}
                    >
                      <option value="">Select Relationship</option>
                      <option value="Parent">Parent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.emergencyRelationship && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.emergencyRelationship}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label
                    htmlFor="admin-member-emergency-number"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Contact Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="admin-member-emergency-number"
                    name="emergencyNumber"
                    type="tel"
                    required
                    placeholder="Emergency contact mobile number"
                    value={form.emergencyNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                      errors.emergencyNumber
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-border focus:border-accent focus:ring-accent/20"
                    }`}
                  />
                  {errors.emergencyNumber && (
                    <p className="mt-1 text-xs text-destructive">{errors.emergencyNumber}</p>
                  )}
                </div>
              </section>

              {/* 4. FITNESS INFORMATION */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <Activity className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Fitness Information
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Height */}
                  <div>
                    <label
                      htmlFor="admin-member-height"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Height <span className="text-destructive">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="admin-member-height"
                        name="height"
                        type="number"
                        step="0.1"
                        required
                        placeholder="e.g. 175"
                        value={form.height}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full rounded-xl border bg-background pl-3.5 pr-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                          errors.height
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-border focus:border-accent focus:ring-accent/20"
                        }`}
                      />
                      <span className="pointer-events-none absolute right-3.5 text-xs font-semibold text-muted-foreground">
                        cm
                      </span>
                    </div>
                    {errors.height && (
                      <p className="mt-1 text-xs text-destructive">{errors.height}</p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label
                      htmlFor="admin-member-weight"
                      className="mb-1.5 block text-xs font-medium text-foreground"
                    >
                      Weight <span className="text-destructive">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="admin-member-weight"
                        name="weight"
                        type="number"
                        step="0.1"
                        required
                        placeholder="e.g. 72"
                        value={form.weight}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full rounded-xl border bg-background pl-3.5 pr-12 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 ${
                          errors.weight
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : "border-border focus:border-accent focus:ring-accent/20"
                        }`}
                      />
                      <span className="pointer-events-none absolute right-3.5 text-xs font-semibold text-muted-foreground">
                        kg
                      </span>
                    </div>
                    {errors.weight && (
                      <p className="mt-1 text-xs text-destructive">{errors.weight}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 5. MEDICAL FITNESS DOCUMENT */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <FileCheck className="h-4 w-4 text-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Medical Fitness Document
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
                <div>
                  <label
                    htmlFor="admin-member-bio"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Bio <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="admin-member-bio"
                    name="bio"
                    rows={3}
                    required
                    placeholder="Tell us about yourself..."
                    value={form.bio}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`no-scrollbar w-full rounded-xl border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-2 resize-none ${
                      errors.bio
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-border focus:border-accent focus:ring-accent/20"
                    }`}
                  />
                  {errors.bio && <p className="mt-1 text-xs text-destructive">{errors.bio}</p>}
                </div>
              </section>
            </form>
          ) : (
            <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
              {/* Member Summary Header */}
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
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Payable Amount
                  </span>
                  <p className="text-xl font-black text-accent font-display">
                    ₹{Number(paymentForm.amountPaid).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Membership Plan Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
                    <Sparkles size={14} className="text-accent" />
                    <span>Select Membership Plan</span>
                  </div>
                  <span className="text-xs font-medium text-accent">Choose commitment tier</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {MEMBERSHIP_PLANS.map((plan) => {
                    const isSelected = paymentForm.selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            selectedPlanId: plan.id,
                            amountPaid: plan.price,
                          }))
                        }
                        className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "border-accent bg-accent/10 ring-2 ring-accent shadow-sm"
                            : "border-border bg-card hover:border-accent/50"
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 right-3 rounded-full bg-accent px-2 py-0.2 text-[9px] font-bold text-accent-foreground uppercase tracking-wider">
                            {plan.badge}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-foreground font-display">
                          {plan.name}
                        </h4>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-lg font-black text-foreground font-display">
                            {plan.formattedPrice}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{plan.period}</span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-muted-foreground line-clamp-2">
                          {plan.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider border-b border-border/60 pb-2">
                  <CreditCard size={14} className="text-accent" />
                  <span>Choose Payment Method</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentForm.paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            paymentMethod: method.id,
                            transactionId: generateTransactionId(method.id),
                          }))
                        }
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500"
                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/40"
                        }`}
                      >
                        <span className="text-xs font-bold">{method.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {method.id === "Cash" ? "Gym Reception" : "Digital Transaction"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Reference & Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Transaction / Receipt ID <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transactionId}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))
                    }
                    placeholder="e.g. TXN-UPI-984123"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Amount Received (₹) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amountPaid}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, amountPaid: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground outline-none transition-all focus:border-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground outline-none transition-all focus:border-accent"
                  />
                </div>
              </div>
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
                <span>Back to Member Details</span>
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
                  onClick={handleProceedToPayment}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  <span>Proceed to Plan & Payment</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompletePaymentAndRegister}
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
                          ? "Complete Payment & Confirm Member"
                          : "Complete Payment & Activate Member"}
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
