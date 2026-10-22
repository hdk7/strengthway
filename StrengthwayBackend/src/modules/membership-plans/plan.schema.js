"use strict";

const yup = require("yup");
const { PLAN_STATUS } = require("../../shared/constants");

const createPlanSchema = yup.object().shape({
  id: yup.string().trim().nullable(),
  name: yup.string().trim().required("Plan name is required.").min(2, "Plan name must be at least 2 characters."),
  durationMonths: yup
    .number()
    .typeError("Duration must be a valid number.")
    .required("Duration is required.")
    .min(1, "Duration must be at least 1 month.")
    .max(60, "Duration cannot exceed 60 months."),
  price: yup
    .number()
    .typeError("Price must be a valid number.")
    .required("Price is required.")
    .min(0, "Price cannot be negative."),
  period: yup.string().trim().nullable(),
  description: yup.string().trim().max(500, "Description cannot exceed 500 characters.").nullable(),
  badge: yup.string().trim().max(50, "Badge cannot exceed 50 characters.").nullable(),
  popular: yup.boolean().nullable(),
  status: yup.string().oneOf(Object.values(PLAN_STATUS)).nullable(),
  features: yup.array().of(yup.string()).nullable(),
});

const updatePlanSchema = yup.object().shape({
  name: yup.string().trim().min(2, "Plan name must be at least 2 characters.").nullable(),
  durationMonths: yup
    .number()
    .typeError("Duration must be a valid number.")
    .min(1, "Duration must be at least 1 month.")
    .max(60, "Duration cannot exceed 60 months.")
    .nullable(),
  price: yup
    .number()
    .typeError("Price must be a valid number.")
    .min(0, "Price cannot be negative.")
    .nullable(),
  period: yup.string().trim().nullable(),
  description: yup.string().trim().max(500, "Description cannot exceed 500 characters.").nullable(),
  badge: yup.string().trim().max(50, "Badge cannot exceed 50 characters.").nullable(),
  popular: yup.boolean().nullable(),
  status: yup.string().oneOf(Object.values(PLAN_STATUS)).nullable(),
  features: yup.array().of(yup.string()).nullable(),
});

module.exports = { createPlanSchema, updatePlanSchema };
