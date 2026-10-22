"use strict";

const yup = require("yup");
const { GENDER, DISCOUNT_TYPES } = require("../../shared/constants");

const NAME_PATTERN = /^[\p{L}\s.'\-]+$/u;

const createEnrollmentSchema = yup.object().shape({
  inquiryId: yup.string().trim().required("Inquiry ID is required to link enrollment."),
  firstName: yup
    .string()
    .trim()
    .required("First name is required.")
    .min(2, "First name must be at least 2 characters.")
    .test(
      "valid-name",
      "First name can only contain letters, spaces, hyphens, apostrophes, and periods.",
      (v) => !v || NAME_PATTERN.test(v.trim()),
    ),
  lastName: yup.string().trim().nullable(),
  email: yup.string().trim().email("Please provide a valid email.").required("Email is required."),
  mobile: yup
    .string()
    .trim()
    .required("Mobile number is required.")
    .test("valid-phone", "Please enter a valid mobile number (10 to 15 digits).", (v) => {
      if (!v) return false;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }),
  gender: yup.string().oneOf(GENDER, "Invalid gender.").default("Male"),
  dob: yup.string().trim().nullable(),
  address: yup.string().trim().nullable(),
  city: yup.string().trim().nullable(),
  state: yup.string().trim().nullable(),
  pincode: yup.string().trim().nullable(),
  emergencyName: yup.string().trim().nullable(),
  emergencyPhone: yup.string().trim().nullable(),
  emergencyRelation: yup.string().trim().nullable(),
  bio: yup.string().trim().nullable(),
  photo: yup.string().nullable(),
  photoName: yup.string().nullable(),
  planId: yup.string().trim().required("Membership plan selection is required."),
  proposedStartDate: yup.string().trim().required("Proposed membership start date is required."),
  batchId: yup.string().trim().nullable(),
  discountType: yup
    .string()
    .oneOf(Object.values(DISCOUNT_TYPES), "Invalid discount type.")
    .default(DISCOUNT_TYPES.NONE),
  discountValue: yup
    .number()
    .min(0, "Discount cannot be negative.")
    .test("percentage-max", "Discount percentage cannot exceed 100%.", function (val) {
      if (this.parent.discountType === DISCOUNT_TYPES.PERCENTAGE) {
        return val <= 100;
      }
      return true;
    })
    .default(0),
  discountReason: yup.string().trim().nullable(),
  paymentMode: yup
    .string()
    .oneOf(["PAYMENT_LINK", "OFFLINE_CASH", "OFFLINE_UPI", "CARD"], "Invalid payment option.")
    .default("PAYMENT_LINK"),
  offlinePaidAmount: yup.number().min(0).nullable(),
  offlineTransactionId: yup.string().trim().nullable(),
  offlineNotes: yup.string().trim().nullable(),
});

const recordOfflinePaymentSchema = yup.object().shape({
  amount: yup.number().positive("Payment amount must be greater than 0.").required("Amount is required."),
  paymentMethod: yup.string().oneOf(["Cash", "UPI", "Card"], "Payment method must be Cash, UPI, or Card.").required("Payment method is required."),
  transactionId: yup.string().trim().nullable(),
  receiptNotes: yup.string().trim().nullable(),
});

const verifyPaymentSchema = yup.object().shape({
  razorpay_order_id: yup.string().trim().nullable(),
  razorpay_payment_id: yup.string().trim().nullable(),
  razorpay_signature: yup.string().trim().nullable(),
  mockPayment: yup.boolean().nullable(),
});

const cancelEnrollmentSchema = yup.object().shape({
  reason: yup.string().trim().nullable(),
});

module.exports = {
  createEnrollmentSchema,
  recordOfflinePaymentSchema,
  verifyPaymentSchema,
  cancelEnrollmentSchema,
};
