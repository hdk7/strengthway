/* eslint-disable max-lines */
import { useState, useRef, useEffect } from "react";
import { FormModal } from "@/components/ui/FormModal";
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
          const rawName = (sourceData.fullName || sourceData.name || "").trim();
          const nameParts = rawName ? rawName.split(/\s+/) : [];
          const derivedFirst = sourceData.firstName || nameParts[0] || "";
          const derivedLast =
            sourceData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
          const derivedFullName = rawName || `${derivedFirst} ${derivedLast}`.trim();

          setForm({
            fullName: derivedFullName,
            firstName: derivedFirst,
            lastName: derivedLast,
            dob: sourceData.dob || "",
            gender: sourceData.gender || "",
            mobile: sourceData.mobile || "",
            email: sourceData.email || "",
            instagramProfileId: sourceData.instagramProfileId || sourceData.instagram || "",
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
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    if (name === "fullName") {
      const parts = value.trim().split(/\s+/);
      nextForm.firstName = parts[0] || "";
      nextForm.lastName = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "";
    }
    setForm(nextForm);
    if (errors[name]) {
      const fieldError = validateFieldWithYup(adminMemberRegistrationSchema, name, nextForm);
      setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!name) return;
    const currentForm = { ...form, [name]: value !== undefined ? value : form[name] };
    const fieldError = validateFieldWithYup(adminMemberRegistrationSchema, name, currentForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError || undefined }));
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
        const updatePayload = { ...form };
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
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
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
    </FormModal>
  );
}

export default AdminMemberRegistrationModal;
