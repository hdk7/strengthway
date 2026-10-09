import {
  adminMemberRegistrationSchema,
  validateFieldWithYup,
} from "@/lib/validation";

export const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobile: "",
  email: "",
  photo: "",
  photoName: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyNumber: "",
  height: "",
  weight: "",
  bloodGroup: "",
  medicalDoc: null,
  medicalDocName: "",
  medicalDocSize: "",
  bio: "",
  batchId: "",
};

export function validateRegistrationStep1(form, paymentForm, isEditingActiveMember = false) {
  const step1Keys = ["firstName", "lastName", "dob", "gender", "mobile", "email"];
  const errs = {};
  step1Keys.forEach((key) => {
    const msg = validateFieldWithYup(adminMemberRegistrationSchema, key, form);
    if (msg) errs[key] = msg;
  });

  if (!paymentForm.selectedPlanId) {
    errs.selectedPlanId = "Please select a membership plan.";
  }
  if (!isEditingActiveMember && !paymentForm.paymentMethod) {
    errs.paymentMethod = "Please select a payment option / method.";
  }
  if (!paymentForm.amountPaid || Number(paymentForm.amountPaid) <= 0) {
    errs.amountPaid = "Please specify a valid payment amount.";
  }

  return errs;
}

export function validateRegistrationStep2(form, isConfirmingLead) {
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
    "bloodGroup",
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

  return errs;
}

export function buildRegistrationPayloads({ form, batches, availablePlans, paymentForm, calculateMembershipDates, generateTransactionId, generateReceiptNumber }) {
  const plan =
    availablePlans.find((p) => p.id === paymentForm.selectedPlanId) || availablePlans[0];
  const dates = calculateMembershipDates(
    plan.durationMonths,
    new Date(paymentForm.paymentDate || Date.now()),
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
    method: paymentForm.paymentMethod || "",
    amount: Number(paymentForm.amountPaid),
    formattedAmount: `₹${Number(paymentForm.amountPaid).toLocaleString("en-IN")}`,
    transactionId:
      paymentForm.transactionId?.trim() ||
      (paymentForm.paymentMethod ? generateTransactionId(paymentForm.paymentMethod) : "") ||
      `TXN-${Date.now().toString().slice(-8)}`,
    receiptNo: generateReceiptNumber(),
    status: "Completed",
    paidAt: paymentForm.paymentDate ? new Date(paymentForm.paymentDate).toISOString() : new Date().toISOString(),
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

  const createPayload = {
    ...form,
    batchId: form.batchId || "",
    batchName: scheduleDetails?.batchName || "",
    batchTiming: scheduleDetails?.batchTiming || "",
    shift: scheduleDetails?.batchTiming || "",
    assignedBatch: scheduleDetails?.batchName || "",
    schedule: scheduleDetails,
    status: "Active",
    paymentPlanId: plan.id,
    planId: plan.id,
    paymentMethod: paymentForm.paymentMethod,
    paymentAmount: Number(paymentForm.amountPaid),
    transactionId: paymentDetails.transactionId,
    paymentDate: paymentForm.paymentDate,
    paymentNotes: paymentForm.paymentNotes,
    membershipPlan,
    paymentDetails,
    medicalDoc: form.medicalDoc
      ? {
          submitted: true,
          clearanceDate: new Date().toISOString().split("T")[0],
          notes: form.medicalDocName || form.medicalDoc || "Medical Fitness Certificate",
        }
      : undefined,
    medicalDocName: form.medicalDocName || "",
    medicalDocSize: form.medicalDocSize || "",
  };

  return { plan, dates, membershipPlan, paymentDetails, scheduleDetails, createPayload };
}

