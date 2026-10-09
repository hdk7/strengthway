/* eslint-disable max-lines */
import { useState, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminMemberRegistrationSchema,
  validateFieldWithYup,
} from "@/lib/validation";
import { createMember, updateMember, convertLeadToMember } from "@/lib/membersService";
import { getBatches, enrollMemberInBatch } from "@/lib/batchesService";
import {
  getMembershipPlans,
  calculateMembershipDates,
  generateTransactionId,
  generateReceiptNumber,
} from "@/lib/membershipPlans";
import {
  INITIAL_FORM,
  validateRegistrationStep1,
  validateRegistrationStep2,
  buildRegistrationPayloads,
} from "./registrationUtils";
import { RegistrationHeader } from "./RegistrationHeader";
import { MemberRegistrationUnifiedForm } from "./MemberRegistrationUnifiedForm";
import { RegistrationFooter } from "./RegistrationFooter";

export function AdminMemberRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  memberToEdit = null,
  leadToConfirm = null,
}) {
  const activeLead =
    leadToConfirm ||
    (memberToEdit?.status === "Lead" ||
    memberToEdit?.status === "Inquiry" ||
    memberToEdit?.status === "Contacted"
      ? memberToEdit
      : null);
  const isConfirmingLead = Boolean(activeLead);
  const isEditingActiveMember = Boolean(
    memberToEdit &&
      memberToEdit.status !== "Lead" &&
      memberToEdit.status !== "Inquiry" &&
      memberToEdit.status !== "Contacted",
  );

  const [availablePlans, setAvailablePlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    selectedPlanId: "",
    paymentMethod: "",
    transactionId: "",
    amountPaid: "",
    paymentDate: "",
    paymentNotes: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const docInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Sync form with leadToConfirm / memberToEdit or reset on open
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setIsLoadingData(true);

    // Load batches and membership plans from API in parallel
    Promise.all([getBatches(), getMembershipPlans(false)])
      .then(([activeBatches, activePlans]) => {
        const resolvedBatches = Array.isArray(activeBatches) ? activeBatches : [];
        const resolvedPlans = activePlans?.length > 0 ? activePlans : [];
        setBatches(resolvedBatches);
        setAvailablePlans(resolvedPlans);

        if (isConfirmingLead) {
          const defaultPlan = resolvedPlans.find((p) => p.popular) || resolvedPlans[0];
          setPaymentForm({
            selectedPlanId: defaultPlan?.id || "",
            paymentMethod: "",
            transactionId: "",
            amountPaid: defaultPlan?.price || "",
            paymentDate: new Date().toISOString().split("T")[0],
            paymentNotes: `Enrollment payment for inquiry ${activeLead?.firstName || "Athlete"}`,
          });
        } else if (isEditingActiveMember) {
          setPaymentForm({
            selectedPlanId: memberToEdit?.membershipPlan?.id || memberToEdit?.planId || "",
            paymentMethod: memberToEdit?.paymentMethod || "",
            transactionId: memberToEdit?.transactionId || "",
            amountPaid: memberToEdit?.amountPaid || "",
            paymentDate: memberToEdit?.paymentDate || "",
            paymentNotes: memberToEdit?.paymentNotes || "",
          });
        } else {
          setPaymentForm({
            selectedPlanId: "",
            paymentMethod: "",
            transactionId: "",
            amountPaid: "",
            paymentDate: "",
            paymentNotes: "",
          });
        }

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
            photo: sourceData.photo || "",
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
            bloodGroup: sourceData.bloodGroup || sourceData.physicalStats?.bloodGroup || "",
            medicalDoc: sourceData.medicalDoc || null,
            medicalDocName: sourceData.medicalDocName || "",
            medicalDocSize: sourceData.medicalDocSize || "",
            bio: sourceData.bio || "",
            batchId: sourceData.batchId || "",
          });
        } else {
          setForm({
            ...INITIAL_FORM,
            batchId: "",
          });
        }
      })
      .catch(() => {
        toast.error("Failed to load plans or batches. Please close and retry.");
      })
      .finally(() => setIsLoadingData(false));
  }, [isOpen, memberToEdit, leadToConfirm, activeLead, isConfirmingLead, isEditingActiveMember]);

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
    if (docInputRef.current) docInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
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

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size should not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setForm((prev) => ({ ...prev, photo: dataUrl, photoName: file.name }));
      toast.success("Member portrait image loaded.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, photo: "", photoName: "" }));
    if (photoInputRef.current) photoInputRef.current.value = "";
    toast.info("Photo removed.");
  };

  const validateStep1 = () => {
    const errs = validateRegistrationStep1(form, paymentForm, isEditingActiveMember);
    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = validateRegistrationStep2(form, isConfirmingLead);
    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleCompleteRegistration = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    const isStep1Valid = validateStep1();
    const isStep2Valid = validateStep2();

    if (!isStep1Valid || !isStep2Valid) {
      toast.error("Please fill in all required fields correctly before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { plan, membershipPlan, paymentDetails, createPayload } =
        buildRegistrationPayloads({
          form,
          batches,
          availablePlans,
          paymentForm,
          calculateMembershipDates,
          generateTransactionId,
          generateReceiptNumber,
        });

      let resultMember;
      if (isConfirmingLead) {
        try {
          resultMember = await convertLeadToMember(activeLead.id, {
            paymentPlanId: plan.id,
            paymentMethod: paymentForm.paymentMethod,
            paymentAmount: Number(paymentForm.amountPaid),
            transactionId: paymentDetails.transactionId,
            paymentDate: paymentForm.paymentDate,
            paymentNotes: paymentForm.paymentNotes,
            batchId: form.batchId || undefined,
            photo: form.photo || undefined,
            photoName: form.photoName || undefined,
          });
        } catch (convertErr) {
          if (
            convertErr?.status === 404 ||
            convertErr?.statusCode === 404 ||
            convertErr?.message?.includes("not found")
          ) {
            resultMember = await createMember({
              ...createPayload,
              inquiryId: activeLead.id,
              status: "Active",
            });
          } else {
            throw convertErr;
          }
        }

        toast.success(
          `Inquiry ${form.firstName} ${form.lastName}`.trim() +
            ` confirmed as an active Member with ${plan.name} Plan!`,
          {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
          },
        );
      } else {
        resultMember = await createMember(createPayload);

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
        try {
          await enrollMemberInBatch(form.batchId, resultMember.id);
        } catch {
          // Non-fatal: member created, batch enroll failed silently
        }
      }

      setForm(INITIAL_FORM);
      if (docInputRef.current) docInputRef.current.value = "";
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (onSuccess) {
        onSuccess(resultMember, isConfirmingLead);
      }
      handleClose();
    } catch (e) {
      toast.error(e?.message || "An error occurred while saving registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (isEditingActiveMember) {
      const isStep1Valid = validateStep1();
      const isStep2Valid = validateStep2();
      if (!isStep1Valid || !isStep2Valid) {
        toast.error("Please fill in all required fields correctly.");
        return;
      }
      setIsSubmitting(true);
      try {
        const updatePayload = {
          ...form,
          medicalDoc: form.medicalDoc
            ? typeof form.medicalDoc === "object"
              ? form.medicalDoc
              : {
                  submitted: true,
                  clearanceDate: new Date().toISOString().split("T")[0],
                  notes: form.medicalDocName || form.medicalDoc || "Medical Fitness Certificate",
                }
            : undefined,
        };
        const updated = await updateMember(memberToEdit.id, updatePayload);
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
      } catch (e) {
        toast.error(e?.message || "An error occurred while saving updates.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await handleCompleteRegistration(e);
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />

        {/* Modal Window */}
        <DialogPrimitive.Content
          aria-describedby="admin-member-registration-desc"
          className="no-scrollbar fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-3xl max-h-[92vh] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card text-foreground shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none"
        >
          {/* Header */}
          <RegistrationHeader
            isEditingActiveMember={isEditingActiveMember}
            isConfirmingLead={isConfirmingLead}
            activeLead={activeLead}
            handleClose={handleClose}
          />

          {/* Form scrollable body */}
          <MemberRegistrationUnifiedForm
            isConfirmingLead={isConfirmingLead}
            isEditingActiveMember={isEditingActiveMember}
            activeLead={activeLead}
            form={form}
            setForm={setForm}
            handleChange={handleChange}
            handleBlur={handleBlur}
            errors={errors}
            batches={batches}
            selectedBatch={selectedBatch}
            availablePlans={availablePlans}
            chosenPlan={chosenPlan}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            handleSubmit={handleSubmit}
            handleRemoveDoc={handleRemoveDoc}
            handleDocUpload={handleDocUpload}
            docInputRef={docInputRef}
            photoInputRef={photoInputRef}
            handlePhotoFileChange={handlePhotoFileChange}
            handleRemovePhoto={handleRemovePhoto}
          />

          {/* Footer Actions */}
          <RegistrationFooter
            memberToEdit={memberToEdit}
            handleClose={handleClose}
            isEditingActiveMember={isEditingActiveMember}
            isSubmitting={isSubmitting}
            handleCompleteRegistration={handleSubmit}
            isConfirmingLead={isConfirmingLead}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default AdminMemberRegistrationModal;
