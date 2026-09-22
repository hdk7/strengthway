/* eslint-disable max-lines */
import * as yup from "yup";

export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NAME_PATTERN = /^[a-zA-Z\s'-]+$/;
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

/**
 * Validates data against a Yup schema synchronously and returns an errors dictionary { [field]: errorMessage }.
 * Returns an empty object if validation passes.
 */
export function validateWithYup(schema, data) {
  try {
    schema.validateSync(data, { abortEarly: false, stripUnknown: false });
    return {};
  } catch (err) {
    if (err.name === "ValidationError" && Array.isArray(err.inner)) {
      const errors = {};
      err.inner.forEach((item) => {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      });
      return errors;
    }
    return { _form: err.message || "Validation failed." };
  }
}

/**
 * Validates a single field against a Yup schema synchronously.
 * Returns the error message string, or an empty string if valid.
 */
export function validateFieldWithYup(schema, fieldName, formData) {
  if (!schema || !schema.fields || !schema.fields[fieldName]) {
    return "";
  }
  try {
    schema.validateSyncAt(fieldName, formData);
    return "";
  } catch (err) {
    if (err.name === "ValidationError") {
      return err.message || "";
    }
    return "";
  }
}

// Reusable field validators
const nameValidator = (label, required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`${label} is required.`);
  }
  return schema
    .test("valid-name", `${label} can only contain letters.`, (value) => {
      if (!value || value.trim() === "") return !required;
      return NAME_PATTERN.test(value.trim());
    })
    .test("min-name-length", `${label} must be at least 2 characters.`, (value) => {
      if (!value || value.trim() === "") return !required;
      return value.trim().length >= 2;
    });
};

const emailValidator = (required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required("Email is required.");
  }
  return schema.test("valid-email", "Please enter a valid email address.", (value) => {
    if (!value || value.trim() === "") return !required;
    return EMAIL_PATTERN.test(value.trim());
  });
};

const phoneValidator = (label = "Mobile number", required = true, minDigits = 10) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`${label} is required.`);
  }
  return schema.test(
    "valid-phone",
    minDigits >= 10
      ? `Enter a valid mobile number (at least ${minDigits} digits).`
      : `Please enter a valid contact number (at least ${minDigits} digits).`,
    (value) => {
      if (!value || value.trim() === "") return !required;
      const digits = value.replace(/\D/g, "");
      return digits.length >= minDigits && digits.length <= 15;
    },
  );
};

const dobValidator = (minAge = 18, maxAge = 100, required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required("Date of birth is required.");
  }
  return schema.test(
    "valid-dob",
    `Only persons aged ${minAge} and above are eligible.`,
    function (value) {
      if (!value || value.trim() === "") return !required;
      const birth = new Date(value);
      if (Number.isNaN(birth.getTime())) {
        return this.createError({ message: "Please enter a valid date of birth." });
      }
      const today = new Date();
      if (birth > today) {
        return this.createError({ message: "Date of birth cannot be in the future." });
      }
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < minAge) {
        return this.createError({
          message: `Only persons aged ${minAge} and above are eligible.`,
        });
      }
      if (age > maxAge) {
        return this.createError({
          message: `Please enter a valid date of birth (maximum age ${maxAge} years).`,
        });
      }
      return true;
    },
  );
};

const pincodeValidator = (required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required("Pincode is required.");
  }
  return schema.test("valid-pincode", "Please enter a valid 6-digit pincode.", (value) => {
    if (!value || value.trim() === "") return !required;
    return PINCODE_PATTERN.test(value.trim());
  });
};

const selectValidator = (label, required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`Please select a ${label.toLowerCase()}.`);
  }
  return schema;
};

const textValidator = (label, min = 2, max = 500, required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`${label} is required.`);
  }
  return schema
    .test("min-text-length", `${label} must be at least ${min} characters.`, (value) => {
      if (!value || value.trim() === "") return !required;
      return value.trim().length >= min;
    })
    .test("max-text-length", `${label} cannot exceed ${max} characters.`, (value) => {
      if (!value || value.trim() === "") return true;
      return value.trim().length <= max;
    });
};

const numberRangeValidator = (label, min, max, unit = "", required = true) => {
  return yup
    .mixed()
    .test("required-number", `${label} is required.`, (value) => {
      if (!required) return true;
      return value !== "" && value !== null && value !== undefined;
    })
    .test(
      "valid-range",
      `${label} must be between ${min} and ${max}${unit ? ` ${unit}` : ""}.`,
      (value) => {
        if (value === "" || value === null || value === undefined) {
          return !required;
        }
        const num = Number(value);
        return !Number.isNaN(num) && num >= min && num <= max;
      },
    );
};

// 1. Public Member Registration Schema (All fields required)
export const publicMemberRegistrationSchema = yup.object().shape({
  firstName: nameValidator("First name", true),
  lastName: nameValidator("Last name", true),
  dob: dobValidator(18, 100, true),
  gender: selectValidator("Gender", true),
  mobile: phoneValidator("Mobile number", true, 10),
  email: emailValidator(true),
  address: textValidator("Address", 5, 300, true),
  city: textValidator("City", 2, 100, true),
  state: textValidator("State", 2, 100, true),
  country: textValidator("Country", 2, 100, true),
  pincode: pincodeValidator(true),
  bio: textValidator("Bio", 10, 500, true),
});

// 2. Admin Submodule Member Registration Schema (All fields required)
export const adminMemberRegistrationSchema = yup.object().shape({
  firstName: nameValidator("First name", true),
  lastName: nameValidator("Last name", true),
  dob: dobValidator(18, 100, true),
  gender: selectValidator("Gender", true),
  mobile: phoneValidator("Mobile number", true, 10),
  email: emailValidator(true),
  address: textValidator("Address", 5, 300, true),
  city: textValidator("City", 2, 100, true),
  state: textValidator("State", 2, 100, true),
  country: textValidator("Country", 2, 100, true),
  pincode: pincodeValidator(true),
  emergencyName: nameValidator("Emergency contact name", true),
  emergencyRelationship: selectValidator("Relationship", true),
  emergencyNumber: phoneValidator("Emergency contact number", true, 7),
  height: numberRangeValidator("Height", 60, 260, "cm", true),
  weight: numberRangeValidator("Weight", 25, 300, "kg", true),
  bio: textValidator("Bio", 10, 500, true),
});

// 3. Public Contact Form Schema (All fields required)
export const contactFormSchema = yup.object().shape({
  name: nameValidator("Name", true),
  email: emailValidator(true),
  subject: textValidator("Subject", 2, 150, true),
  message: yup
    .string()
    .trim()
    .required("Message is required.")
    .min(10, "Message must be at least 10 characters.")
    .max(1000, "Message cannot exceed 1000 characters."),
});

// 4. Login Schema
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Email is required")
    .test("valid-email", "Enter a valid email address", (val) => {
      if (!val) return false;
      return EMAIL_PATTERN.test(val);
    }),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

// 5. Forgot Password Schema
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Email is required")
    .test("valid-email", "Enter a valid email address", (val) => {
      if (!val) return false;
      return EMAIL_PATTERN.test(val);
    }),
});

// 6. Trainer Management Schema (All fields required)
export const trainerSchema = yup.object().shape({
  name: nameValidator("Trainer name", true),
  specialization: textValidator("Specialization", 2, 100, true),
  experience: textValidator("Experience", 1, 50, true),
  phone: phoneValidator("Phone number", true, 10),
  email: emailValidator(true),
  shift: selectValidator("Shift", true),
  bio: textValidator("Bio", 10, 500, true),
});

// 7. Manual Inquiry Schema (All fields required)
export const inquirySchema = yup.object().shape({
  name: nameValidator("Full name", true),
  email: emailValidator(true),
  subject: textValidator("Subject", 2, 150, true),
  message: yup
    .string()
    .trim()
    .required("Message is required.")
    .min(10, "Message must be at least 10 characters.")
    .max(1000, "Message cannot exceed 1000 characters."),
});
