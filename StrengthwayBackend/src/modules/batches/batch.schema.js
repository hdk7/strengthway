"use strict";

const yup = require("yup");
const { BATCH_STATUS, DAYS_PATTERN } = require("../../shared/constants");

const createBatchSchema = yup.object().shape({
  id: yup.string().trim().required("Batch ID is required (e.g. BATCH-01)."),
  name: yup.string().trim().required("Batch name is required.").min(2, "Batch name must be at least 2 characters."),
  shortName: yup.string().trim().nullable(),
  startTime: yup.string().trim().required("Start time is required (e.g. 06:00 AM)."),
  endTime: yup.string().trim().required("End time is required (e.g. 07:00 AM)."),
  timingLabel: yup.string().trim().nullable(),
  daysPattern: yup.string().trim().default("MWF"),
  daysLabel: yup.string().trim().nullable(),
  daysList: yup.array().of(yup.string()).nullable(),
  maxPax: yup
    .number()
    .typeError("Capacity limit must be a valid number.")
    .min(1, "Capacity limit must be at least 1 pax.")
    .max(500, "Capacity cannot exceed 500 pax.")
    .default(28),
  status: yup.string().oneOf(Object.values(BATCH_STATUS)).default(BATCH_STATUS.ACTIVE),
  trainerIds: yup.array().of(yup.string()).nullable(),
  memberIds: yup.array().of(yup.string()).nullable(),
  description: yup.string().trim().max(500, "Description cannot exceed 500 characters.").nullable(),
});

const updateBatchSchema = yup.object().shape({
  name: yup.string().trim().min(2, "Batch name must be at least 2 characters."),
  shortName: yup.string().trim().nullable(),
  startTime: yup.string().trim(),
  endTime: yup.string().trim(),
  timingLabel: yup.string().trim().nullable(),
  daysPattern: yup.string().trim(),
  daysLabel: yup.string().trim().nullable(),
  daysList: yup.array().of(yup.string()).nullable(),
  maxPax: yup
    .number()
    .typeError("Capacity limit must be a valid number.")
    .min(1, "Capacity limit must be at least 1 pax.")
    .max(500, "Capacity cannot exceed 500 pax."),
  currentPax: yup.number().min(0),
  status: yup.string().oneOf(Object.values(BATCH_STATUS)),
  trainerIds: yup.array().of(yup.string()).nullable(),
  memberIds: yup.array().of(yup.string()).nullable(),
  description: yup.string().trim().max(500, "Description cannot exceed 500 characters.").nullable(),
});

const enrollMemberSchema = yup.object().shape({
  memberId: yup.string().trim().required("Member ID is required."),
});

const syncTrainersSchema = yup.object().shape({
  trainerIds: yup.array().of(yup.string()).required("Trainer IDs array is required."),
});

const toggleCoachSlotSchema = yup.object().shape({
  coachId: yup.string().trim().required("Coach ID is required."),
  slotKey: yup.string().trim().required("Slot key is required."),
});

const createClassSchema = yup.object().shape({
  day: yup.string().trim().required("Day of class is required."),
  title: yup.string().trim().required("Class title is required."),
  category: yup.string().trim().nullable(),
  focus: yup.string().trim().nullable(),
  intensity: yup.string().trim().nullable(),
  room: yup.string().trim().nullable(),
  coachName: yup.string().trim().nullable(),
  time: yup.string().trim().nullable(),
});

const updateClassSchema = yup.object().shape({
  day: yup.string().trim(),
  title: yup.string().trim(),
  category: yup.string().trim().nullable(),
  focus: yup.string().trim().nullable(),
  intensity: yup.string().trim().nullable(),
  room: yup.string().trim().nullable(),
  coachName: yup.string().trim().nullable(),
  time: yup.string().trim().nullable(),
});

const permanentTransferSchema = yup.object().shape({
  memberId: yup.string().trim().required("Member ID is required."),
  sourceBatchId: yup.string().trim().nullable(),
  targetBatchId: yup.string().trim().required("Target Batch ID is required."),
  effectiveDate: yup
    .string()
    .trim()
    .default(() => new Date().toISOString().slice(0, 10))
    .required("Effective date is required (YYYY-MM-DD)."),
  reason: yup.string().trim().required("Reason for transfer is required.").min(3),
  transferredBy: yup.string().trim().default("Admin"),
});

const flexibleAssignmentSchema = yup.object().shape({
  memberId: yup.string().trim().required("Member ID is required."),
  sourceBatchId: yup.string().trim().nullable(),
  targetBatchId: yup.string().trim().required("Target Batch ID is required."),
  selectedDays: yup
    .array()
    .of(yup.string().trim())
    .nullable(),
  startDate: yup.string().trim().required("Start date is required (YYYY-MM-DD)."),
  endDate: yup.string().trim().nullable(),
  reason: yup.string().trim().required("Reason for flexible assignment is required.").min(3),
  transferredBy: yup.string().trim().default("Admin"),
});

const revokeFlexAssignmentSchema = yup.object().shape({
  reason: yup.string().trim().nullable(),
  revokedBy: yup.string().trim().default("Admin"),
});

const assignSubstituteSchema = yup.object().shape({
  originalTrainerId: yup.string().trim().nullable().notRequired(),
  substituteTrainerId: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .when("proceedWithoutSubstitute", {
      is: (val) => val === true || val === "true",
      then: (schema) => schema.nullable().notRequired(),
      otherwise: (schema) => schema.required("Substitute Trainer ID is required."),
    }),
  reason: yup
    .string()
    .trim()
    .nullable()
    .notRequired()
    .when("proceedWithoutSubstitute", {
      is: (val) => val === true || val === "true",
      then: (schema) => schema.nullable().notRequired(),
      otherwise: (schema) =>
        schema
          .oneOf(
            [
              "Leave",
              "Absent",
              "Emergency",
              "Other",
              "LEAVE",
              "ABSENT",
              "EMERGENCY",
              "OTHER",
              "None",
              "NONE",
            ],
            "Invalid reason. Must be Leave, Absent, Emergency, or Other."
          )
          .required("Substitution reason is required."),
    }),
  notes: yup.string().trim().nullable().notRequired(),
  proceedWithoutSubstitute: yup.boolean().default(false),
  idempotencyKey: yup.string().trim().nullable().notRequired(),
});

const cancelSubstituteSchema = yup.object().shape({
  cancellationReason: yup.string().trim().nullable(),
});

module.exports = {
  createBatchSchema,
  updateBatchSchema,
  enrollMemberSchema,
  syncTrainersSchema,
  toggleCoachSlotSchema,
  createClassSchema,
  updateClassSchema,
  permanentTransferSchema,
  flexibleAssignmentSchema,
  revokeFlexAssignmentSchema,
  assignSubstituteSchema,
  cancelSubstituteSchema,
};

