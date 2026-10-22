import {
  adminMemberRegistrationSchema,
  validateFieldWithYup,
} from "@/lib/validation";
import { formatINR } from "@/lib/formatters";

export const INITIAL_FORM = {
  fullName: "",
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobile: "",
  email: "",
  instagramProfileId: "",
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
  bio: "",
  batchId: "",
};

export function validateRegistrationStep1(form, paymentForm, isEditingActiveMember = false) {
  const step1Keys = [
    "fullName",
    "dob",
    "gender",
    "mobile",
    "email",
    "instagramProfileId",
  ];
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

export function validateRegistrationStep2(form) {
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
    formattedPrice: formatINR(paymentForm.amountPaid),
    startDate: dates.startDate,
    endDate: dates.endDate,
    formattedStart: dates.formattedStart,
    formattedEnd: dates.formattedEnd,
  };

  const paymentDetails = {
    method: paymentForm.paymentMethod || "",
    amount: Number(paymentForm.amountPaid),
    formattedAmount: formatINR(paymentForm.amountPaid),
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

  const rawFullName = (form.fullName || "").trim();
  const nameParts = rawFullName ? rawFullName.split(/\s+/) : [];
  const derivedFirst = form.firstName || nameParts[0] || "";
  const derivedLast = form.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0] || "");
  const fullName = rawFullName || `${derivedFirst} ${derivedLast}`.trim();

  const createPayload = {
    ...form,
    fullName,
    firstName: derivedFirst,
    lastName: derivedLast,
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
  };

  return { plan, dates, membershipPlan, paymentDetails, scheduleDetails, createPayload };
}

