"use strict";

const yup = require("yup");
const { INQUIRY_STATUS, GENDER, CONTACT_METHODS } = require("../../shared/constants");

const NAME_PATTERN = /^[\p{L}\s.'\-]+$/u;

const createInquirySchema = yup.object().shape({
  id: yup.string().trim().nullable(),
  name: yup
    .string()
    .trim()
    .required("Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .test(
      "valid-name",
      "Name can only contain letters, spaces, hyphens, apostrophes, and periods.",
      (v) => !v || NAME_PATTERN.test(v.trim()),
    ),
  gender: yup.string().oneOf(GENDER, "Invalid gender.").nullable(),
  mobile: yup
    .string()
    .trim()
    .required("Mobile number is required.")
    .test("valid-phone", "Please enter a valid mobile number (10 to 15 digits).", (v) => {
      if (!v) return false;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }),
  email: yup.string().trim().email("Please enter a valid email address.").required("Email is required."),
  address: yup.string().trim().nullable(),
  subject: yup.string().trim().nullable(),
  message: yup.string().trim().nullable(),
  status: yup.string().oneOf(Object.values(INQUIRY_STATUS), "Invalid inquiry status.").nullable(),
});

const updateInquirySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .test(
      "valid-name",
      "Name can only contain letters, spaces, hyphens, apostrophes, and periods.",
      (v) => !v || NAME_PATTERN.test(v.trim()),
    )
    .nullable(),
  gender: yup.string().oneOf(GENDER, "Invalid gender.").nullable(),
  mobile: yup
    .string()
    .trim()
    .nullable()
    .test("valid-phone", "Please enter a valid mobile number (10 to 15 digits).", (v) => {
      if (!v) return true;
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }),
  email: yup.string().trim().email("Please enter a valid email address.").nullable(),
  address: yup.string().trim().nullable(),
  subject: yup.string().trim().nullable(),
  message: yup.string().trim().nullable(),
  status: yup.string().oneOf(Object.values(INQUIRY_STATUS), "Invalid inquiry status.").nullable(),
});

const updateStatusSchema = yup.object().shape({
  status: yup.string().required("Status is required.").oneOf(Object.values(INQUIRY_STATUS), "Invalid inquiry status."),
  notes: yup.string().trim().nullable(),
  convertedMemberId: yup.string().trim().nullable(),
});

const recordContactSchema = yup.object().shape({
  contactMethod: yup
    .string()
    .required("Contact method is required.")
    .oneOf(CONTACT_METHODS, "Invalid contact method."),
  contactNotes: yup
    .string()
    .trim()
    .required("Contact notes are required.")
    .min(5, "Contact notes must be at least 5 characters."),
  contactedAt: yup.date().nullable(),
  contactedBy: yup.string().trim().nullable(),
  followUpDate: yup.string().trim().nullable(),
  outcome: yup.string().trim().nullable(),
});

module.exports = {
  createInquirySchema,
  updateInquirySchema,
  updateStatusSchema,
  recordContactSchema,
};
