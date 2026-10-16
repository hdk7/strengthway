"use strict";

const yup = require("yup");
const { ATTENDANCE_STATUS, TRAINER_LOG_STATUS } = require("../../shared/constants");

const markAttendanceSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  batchId: yup.string().trim().required("Batch ID is required."),
  sessionId: yup.string().trim().nullable(),
  memberId: yup.string().trim().required("Member ID is required."),
  memberName: yup.string().trim().nullable(),
  status: yup.string().oneOf(Object.values(ATTENDANCE_STATUS)).default(ATTENDANCE_STATUS.PRESENT),
  isFlexAttendance: yup.boolean().default(false),
  originalPrimaryBatchId: yup.string().trim().nullable(),
  assignmentId: yup.string().trim().nullable(),
  checkInTime: yup.string().trim().nullable(),
  checkOutTime: yup.string().trim().nullable(),
  durationMinutes: yup.number().min(0).nullable(),
  trainerId: yup.string().trim().nullable(),
  markedBy: yup.string().trim().default("Coach"),
  notes: yup.string().trim().nullable(),
  remarks: yup.string().trim().nullable(),
  isAdminOverride: yup.boolean().default(false),
  overrideReason: yup.string().trim().nullable(),
  checkoutBy: yup.string().trim().oneOf(["MEMBER", "SYSTEM", "ADMIN", ""]).nullable(),
  isSystemGenerated: yup.boolean().default(false),
});

const bulkMarkAttendanceSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  batchId: yup.string().trim().required("Batch ID is required."),
  sessionId: yup.string().trim().nullable(),
  trainerId: yup.string().trim().nullable(),
  markedBy: yup.string().trim().default("Coach"),
  attendees: yup
    .array()
    .of(
      yup.object().shape({
        memberId: yup.string().trim().required("Member ID is required."),
        memberName: yup.string().trim().nullable(),
        status: yup.string().oneOf(Object.values(ATTENDANCE_STATUS)).required("Status is required."),
        isFlexAttendance: yup.boolean().default(false),
        originalPrimaryBatchId: yup.string().trim().nullable(),
        assignmentId: yup.string().trim().nullable(),
        checkInTime: yup.string().trim().nullable(),
        checkOutTime: yup.string().trim().nullable(),
        notes: yup.string().trim().nullable(),
      })
    )
    .required("Attendees array is required."),
});

const createTrainerLogSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  trainerId: yup.string().trim().required("Trainer ID is required."),
  trainerName: yup.string().trim().nullable(),
  batchId: yup.string().trim().required("Batch ID is required."),
  sessionId: yup.string().trim().nullable(),
  status: yup.string().oneOf(Object.values(TRAINER_LOG_STATUS)).default(TRAINER_LOG_STATUS.CONDUCTED),
  substituteTrainerId: yup.string().trim().nullable(),
  checkInTime: yup.string().trim().nullable(),
  checkOutTime: yup.string().trim().nullable(),
  durationMinutes: yup.number().min(0).default(60),
  attendeesCount: yup.number().min(0).default(0),
  notes: yup.string().trim().nullable(),
  isAdminOverride: yup.boolean().default(false),
  overrideReason: yup.string().trim().nullable(),
});

const trainerCheckInSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  trainerId: yup.string().trim().required("Trainer ID is required."),
  sessionId: yup.string().trim().nullable(),
  batchId: yup.string().trim().nullable(),
  checkInTime: yup.string().trim().nullable(),
  isAdminOverride: yup.boolean().default(false),
  overrideReason: yup.string().trim().nullable(),
});

const trainerCheckOutSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  trainerId: yup.string().trim().required("Trainer ID is required."),
  intervalId: yup.string().trim().nullable(),
  sessionId: yup.string().trim().nullable(),
  checkOutTime: yup.string().trim().nullable(),
  isAdminOverride: yup.boolean().default(false),
  overrideReason: yup.string().trim().nullable(),
});

const trainerAddAnotherSessionSchema = yup.object().shape({
  trainerId: yup.string().trim().required("Trainer ID is required."),
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  currentSessionId: yup.string().trim().required("Current session ID is required."),
  nextSessionId: yup.string().trim().required("Next session ID is required."),
  transitionTime: yup.string().trim().nullable(),
  isAdminOverride: yup.boolean().default(false),
  overrideReason: yup.string().trim().nullable(),
});

const processAutoCheckoutSchema = yup.object().shape({
  date: yup.string().trim().nullable(),
  batchId: yup.string().trim().nullable(),
});

const adminCorrectContinuousSessionSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  trainerId: yup.string().trim().required("Trainer ID is required."),
  intervalId: yup.string().trim().nullable(),
  sourceSessionId: yup.string().trim().nullable(),
  reason: yup.string().trim().required("Reason for manual attendance correction is mandatory."),
  sessionCorrections: yup
    .array()
    .of(
      yup.object().shape({
        sessionId: yup.string().trim().required("Session ID is required."),
        checkInTime: yup.string().trim().required("Check-in time is required."),
        checkOutTime: yup.string().trim().required("Check-out time is required."),
        remarks: yup.string().trim().nullable(),
      })
    )
    .required("Session corrections list is required."),
});

const adminOverrideMemberSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  memberId: yup.string().trim().required("Member ID is required."),
  batchId: yup.string().trim().required("Batch ID is required."),
  checkInTime: yup.string().trim().nullable(),
  checkOutTime: yup.string().trim().nullable(),
  status: yup.string().oneOf(Object.values(ATTENDANCE_STATUS)).default(ATTENDANCE_STATUS.PRESENT),
  reason: yup.string().trim().required("Override reason is mandatory for admin corrections."),
  notes: yup.string().trim().nullable(),
});

const adminOverrideTrainerSchema = yup.object().shape({
  date: yup.string().trim().required("Date is required (YYYY-MM-DD)."),
  trainerId: yup.string().trim().required("Trainer ID is required."),
  batchId: yup.string().trim().nullable(),
  sessionId: yup.string().trim().nullable(),
  intervalId: yup.string().trim().nullable(),
  checkInTime: yup.string().trim().nullable(),
  checkOutTime: yup.string().trim().nullable(),
  status: yup.string().oneOf(Object.values(TRAINER_LOG_STATUS)).default(TRAINER_LOG_STATUS.PRESENT),
  reason: yup.string().trim().required("Override reason is mandatory for admin corrections."),
  notes: yup.string().trim().nullable(),
});

module.exports = {
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
  createTrainerLogSchema,
  trainerCheckInSchema,
  trainerCheckOutSchema,
  trainerAddAnotherSessionSchema,
  processAutoCheckoutSchema,
  adminCorrectContinuousSessionSchema,
  adminOverrideMemberSchema,
  adminOverrideTrainerSchema,
};
