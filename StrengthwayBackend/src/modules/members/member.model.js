"use strict";

const mongoose = require("mongoose");
const {
  MEMBER_STATUS,
  BLOOD_GROUPS,
  GENDER,
  ASSIGNMENT_TYPE,
  ASSIGNMENT_STATUS,
} = require("../../shared/constants");

const physicalStatsSchema = new mongoose.Schema(
  {
    height: { type: String, trim: true, default: "" },
    weight: { type: String, trim: true, default: "" },
    bmi: { type: String, trim: true, default: "" },
    bloodGroup: { type: String, enum: [...BLOOD_GROUPS, ""], default: "" },
  },
  { _id: false },
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    relation: { type: String, trim: true, default: "" },
  },
  { _id: false },
);


const contactDetailsSchema = new mongoose.Schema(
  {
    contactedAt: { type: Date, default: null },
    contactMethod: { type: String, default: "Phone Call" },
    contactNotes: { type: String, trim: true, default: "" },
    contactedBy: { type: String, trim: true, default: "Admin" },
    followUpDate: { type: String, trim: true, default: "" },
    outcome: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const memberStatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: "Admin" },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const membershipPlanSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    name: { type: String, trim: true },
    durationMonths: { type: Number },
    price: { type: Number },
    formattedPrice: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    formattedStart: { type: String },
    formattedEnd: { type: String },
  },
  { _id: false },
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    method: { type: String, trim: true },
    amount: { type: Number },
    formattedAmount: { type: String },
    transactionId: { type: String, trim: true },
    receiptNo: { type: String, trim: true },
    upiReference: { type: String, trim: true, default: "" },
    invoiceNumber: { type: String, trim: true, default: "" },
    status: { type: String, default: "Completed" },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const carryForwardSessionSchema = new mongoose.Schema(
  {
    cancellationId: { type: String, trim: true, default: "" },
    batchId: { type: String, trim: true, default: "" },
    batchName: { type: String, trim: true, default: "" },
    classCount: { type: Number, default: 0 },
    cancelledDates: { type: [String], default: [] },
    rescheduledDates: { type: [String], default: [] },
    reason: { type: String, trim: true, default: "" },
    addedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["AVAILABLE", "ATTENDED", "EXPIRED"],
      default: "AVAILABLE",
    },
  },
  { _id: false }
);

const membershipAdjustmentCreditSchema = new mongoose.Schema(
  {
    creditId: { type: String, trim: true, default: "" },
    cancellationId: { type: String, trim: true, default: "" },
    batchId: { type: String, trim: true, default: "" },
    batchName: { type: String, trim: true, default: "" },
    cancelledClassesCount: { type: Number, default: 0 },
    perClassRate: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 },
    originalPlanPrice: { type: Number, default: 0 },
    reason: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["AVAILABLE", "APPLIED_TO_RENEWAL", "RETAINED_CARRIED_FORWARD"],
      default: "AVAILABLE",
    },
    appliedToPayment: {
      invoiceNumber: { type: String, trim: true, default: "" },
      transactionId: { type: String, trim: true, default: "" },
      originalAmount: { type: Number, default: 0 },
      adjustmentAmount: { type: Number, default: 0 },
      finalPayableAmount: { type: Number, default: 0 },
      appliedAt: { type: Date, default: null },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    batchId: { type: String, trim: true },
    batchName: { type: String, trim: true },
    batchTiming: { type: String, trim: true },
    daysLabel: { type: String, trim: true },
    daysPattern: { type: String, trim: true },
  },
  { _id: false },
);

const batchHistorySchema = new mongoose.Schema(
  {
    assignmentId: { type: String, trim: true },
    transactionId: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: Object.values(ASSIGNMENT_TYPE),
      default: ASSIGNMENT_TYPE.PRIMARY,
    },
    batchId: { type: String, trim: true },
    batchName: { type: String, trim: true },
    batchTiming: { type: String, trim: true },
    sourceBatchId: { type: String, trim: true, default: "" },
    sourceBatchName: { type: String, trim: true, default: "" },
    targetBatchId: { type: String, trim: true, default: "" },
    targetBatchName: { type: String, trim: true, default: "" },
    selectedDays: { type: [String], default: [] },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: null },
    reason: { type: String, trim: true, default: "" },
    transferredAt: { type: Date, default: Date.now },
    transferredBy: { type: String, trim: true, default: "Admin" },
    rejoinedAt: { type: Date, default: null },
    rejoinReason: { type: String, trim: true, default: "" },
    status: { type: String, default: "COMPLETED" },
  },
  { _id: false },
);

const activeFlexAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: { type: String, trim: true },
    transactionId: { type: String, trim: true, default: "" },
    sourceBatchId: { type: String, trim: true, default: "" },
    sourceBatchName: { type: String, trim: true, default: "" },
    targetBatchId: { type: String, trim: true },
    targetBatchName: { type: String, trim: true },
    targetBatchTiming: { type: String, trim: true },
    selectedDays: { type: [String], default: [] },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: null },
    reason: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: Object.values(ASSIGNMENT_STATUS),
      default: ASSIGNMENT_STATUS.ACTIVE,
    },
  },
  { _id: false },
);

const memberSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      default: "",
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      enum: GENDER,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    instagramProfileId: {
      type: String,
      trim: true,
      default: "",
    },
    height: {
      type: String,
      trim: true,
      default: "",
    },
    weight: {
      type: String,
      trim: true,
      default: "",
    },
    bloodGroup: {
      type: String,
      enum: [...BLOOD_GROUPS, ""],
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "India",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    photo: {
      type: String,
      default: null,
    },
    photoName: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: Object.values(MEMBER_STATUS),
      default: MEMBER_STATUS.ACTIVE,
      index: true,
    },
    inquiryId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    contactDetails: {
      type: contactDetailsSchema,
      default: null,
    },
    statusHistory: {
      type: [memberStatusHistorySchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },

    batchId: {
      type: String,
      default: "",
      trim: true,
    },
    batchName: {
      type: String,
      default: "",
      trim: true,
    },
    batchTiming: {
      type: String,
      default: "",
      trim: true,
    },
    assignedBatch: {
      type: String,
      default: "General Access",
      trim: true,
    },
    schedule: {
      type: scheduleSchema,
      default: null,
    },
    batchHistory: {
      type: [batchHistorySchema],
      default: [],
    },
    activeFlexAssignments: {
      type: [activeFlexAssignmentSchema],
      default: [],
    },

    physicalStats: {
      type: physicalStatsSchema,
      default: null,
    },
    emergencyName: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyPhone: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyRelation: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: null,
    },

    membershipPlan: {
      type: membershipPlanSnapshotSchema,
      default: null,
    },
    paymentDetails: {
      type: paymentDetailsSchema,
      default: null,
    },

    pendingSessionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    carryForwardSessions: {
      type: [carryForwardSessionSchema],
      default: [],
    },
    membershipAdjustmentCredits: {
      type: [membershipAdjustmentCreditSchema],
      default: [],
    },
    totalAdjustmentCredit: {
      type: Number,
      default: 0,
      min: 0,
    },

    convertedAt: {
      type: Date,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "registeredAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

// Compound text index for search across members
memberSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  mobile: "text",
  id: "text",
});

module.exports = mongoose.model("Member", memberSchema);
