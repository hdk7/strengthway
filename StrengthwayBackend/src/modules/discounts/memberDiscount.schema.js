"use strict";

const yup = require("yup");
const { DISCOUNT_TYPES } = require("../../shared/constants");

const calculatePreviewSchema = yup.object().shape({
  planId: yup.string().trim().required("Membership plan ID is required."),
  discountType: yup
    .string()
    .oneOf(
      [DISCOUNT_TYPES.PERCENTAGE, DISCOUNT_TYPES.FIXED],
      "Discount type must be either 'percentage' or 'fixed'."
    )
    .required("Discount type is required."),
  discountValue: yup
    .number()
    .typeError("Discount value must be a valid number.")
    .positive("Discount value must be greater than zero.")
    .test("percentage-max", "Discount percentage cannot exceed 100%.", function (val) {
      if (this.parent.discountType === DISCOUNT_TYPES.PERCENTAGE) {
        return val <= 100;
      }
      return true;
    })
    .required("Discount value is required."),
});

const individualDiscountItemSchema = yup.object().shape({
  memberId: yup.string().trim().required("Member ID is required."),
  planId: yup.string().trim().required("Membership plan ID is required."),
  discountType: yup
    .string()
    .oneOf(
      [DISCOUNT_TYPES.PERCENTAGE, DISCOUNT_TYPES.FIXED],
      "Discount type must be either 'percentage' or 'fixed'."
    )
    .required("Discount type is required."),
  discountValue: yup
    .number()
    .typeError("Discount value must be a valid number.")
    .positive("Discount value must be greater than zero.")
    .test("percentage-max", "Discount percentage cannot exceed 100%.", function (val) {
      if (this.parent.discountType === DISCOUNT_TYPES.PERCENTAGE) {
        return val <= 100;
      }
      return true;
    })
    .required("Discount value is required."),
  expiryDate: yup.date().nullable().optional(),
  applicationRule: yup
    .string()
    .oneOf(["NEXT_PAYMENT_ONLY", "SINGLE_USE"])
    .default("NEXT_PAYMENT_ONLY"),
});

const assignBulkDiscountsSchema = yup.object().shape({
  campaignName: yup.string().trim().nullable().optional(),
  notifyMembers: yup.boolean().default(true),
  discounts: yup
    .array()
    .of(individualDiscountItemSchema)
    .min(1, "At least one member discount configuration is required.")
    .required("Discounts list is required."),
});

const cancelDiscountSchema = yup.object().shape({
  reason: yup
    .string()
    .trim()
    .min(3, "Cancellation reason must be at least 3 characters.")
    .required("Cancellation reason is required."),
});

const applyDiscountSchema = yup.object().shape({
  discountId: yup.string().trim().required("Discount ID is required."),
  memberId: yup.string().trim().required("Member ID is required."),
  planId: yup.string().trim().required("Membership plan ID is required."),
  invoiceNumber: yup.string().trim().nullable().optional(),
});

module.exports = {
  calculatePreviewSchema,
  assignBulkDiscountsSchema,
  cancelDiscountSchema,
  applyDiscountSchema,
};
