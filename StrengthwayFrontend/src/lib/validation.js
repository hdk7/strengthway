import * as yup from "yup";

export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NAME_PATTERN = /^[\p{L}\s.'\-]+$/u;
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
export const TRANSACTION_ID_PATTERN = /^[a-zA-Z0-9_\-\.\/]{3,50}$/;

export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return EMAIL_PATTERN.test(email.trim());
};

export const isValidName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && NAME_PATTERN.test(trimmed);
};

export const isValidPhone = (phone, minDigits = 10, maxDigits = 15) => {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= minDigits && digits.length <= maxDigits;
};

/**
 * Input sanitizers for keystroke and paste restriction
 */
export function sanitizePhoneInput(val) {
  if (typeof val !== "string" && typeof val !== "number") return "";
  const str = String(val);
  const hasLeadingPlus = str.startsWith("+");
  let digitsAndSeparators = str.replace(/[^\d\s-]/g, "");
  if (hasLeadingPlus) {
    digitsAndSeparators = "+" + digitsAndSeparators.replace(/\+/g, "");
  }
  return digitsAndSeparators;
}

export function sanitizeIntegerInput(val, maxDigits) {
  if (typeof val !== "string" && typeof val !== "number") return "";
  let digits = String(val).replace(/\D/g, "");
  if (maxDigits && digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits);
  }
  return digits;
}

export function sanitizeDecimalInput(val, maxDecimals = 2) {
  if (typeof val !== "string" && typeof val !== "number") return "";
  let str = String(val).replace(/[^\d.]/g, "");
  const parts = str.split(".");
  if (parts.length > 2) {
    str = parts[0] + "." + parts.slice(1).join("");
  }
  if (parts.length === 2 && maxDecimals !== undefined && parts[1].length > maxDecimals) {
    str = parts[0] + "." + parts[1].slice(0, maxDecimals);
  }
  return str;
}

export function sanitizePincodeInput(val) {
  return sanitizeIntegerInput(val, 6);
}

export function sanitizeAlphanumericInput(val) {
  if (typeof val !== "string" && typeof val !== "number") return "";
  return String(val).replace(/[^a-zA-Z0-9_\-\.\/]/g, "");
}

export function sanitizeInputByRestriction(val, restriction) {
  switch (restriction) {
    case "phone":
      return sanitizePhoneInput(val);
    case "integer":
      return sanitizeIntegerInput(val);
    case "decimal":
      return sanitizeDecimalInput(val);
    case "pincode":
      return sanitizePincodeInput(val);
    case "alphanumeric":
      return sanitizeAlphanumericInput(val);
    default:
      return val;
  }
}

/**
 * Standardized keystroke restriction handler for text/number/phone inputs.
 * Blocks invalid keystrokes while allowing shortcuts and control keys.
 */
export function handleRestrictedKeyDown(e, restriction, customOnKeyDown) {
  if (restriction) {
    const isControlKey = [
      "Backspace",
      "Tab",
      "Enter",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Delete",
      "Home",
      "End",
    ].includes(e.key);
    const isShortcut = e.ctrlKey || e.metaKey;

    if (!isControlKey && !isShortcut) {
      if (restriction === "phone") {
        const isDigit = /^[0-9]$/.test(e.key);
        const isSeparator = e.key === " " || e.key === "-";
        const isPlus = e.key === "+";
        const inputEl = e.currentTarget;
        const isCursorAtStart = inputEl.selectionStart === 0;
        const alreadyHasPlus = inputEl.value.includes("+");

        if (!isDigit && !isSeparator && !(isPlus && isCursorAtStart && !alreadyHasPlus)) {
          e.preventDefault();
        }
      } else if (restriction === "integer") {
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
        }
      } else if (restriction === "decimal") {
        const isDigit = /^[0-9]$/.test(e.key);
        const isDot = e.key === ".";
        const alreadyHasDot = e.currentTarget.value.includes(".");
        if (!isDigit && !(isDot && !alreadyHasDot)) {
          e.preventDefault();
        }
      } else if (restriction === "pincode") {
        const isDigit = /^[0-9]$/.test(e.key);
        const isFull =
          e.currentTarget.value.length >= 6 &&
          e.currentTarget.selectionStart === e.currentTarget.selectionEnd;
        if (!isDigit || isFull) {
          e.preventDefault();
        }
      } else if (restriction === "alphanumeric") {
        if (!/^[a-zA-Z0-9_\-\.\/]$/.test(e.key)) {
          e.preventDefault();
        }
      }
    }
  }

  if (typeof customOnKeyDown === "function") {
    customOnKeyDown(e);
  }
}

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
    const data =
      typeof formData === "object" && formData !== null && !Array.isArray(formData) && (fieldName in formData)
        ? formData
        : { [fieldName]: formData };

    schema.validateSyncAt(fieldName, data);
    return "";
  } catch (err) {
    if (err.name === "ValidationError") {
      return err.message || "";
    }
    return "";
  }
}

// Reusable field validators
export const nameValidator = (label, required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`${label} is required.`);
  }
  return schema
    .test(
      "valid-name",
      `${label} can only contain letters, spaces, hyphens, apostrophes, and periods.`,
      (value) => {
        if (!value || value.trim() === "") return !required;
        return NAME_PATTERN.test(value.trim());
      },
    )
    .test("min-name-length", `${label} must be at least 2 characters.`, (value) => {
      if (!value || value.trim() === "") return !required;
      return value.trim().length >= 2;
    });
};

export const emailValidator = (required = true) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required("Email is required.");
  }
  return schema.test("valid-email", "Enter a valid email address.", (value) => {
    if (!value || value.trim() === "") return !required;
    return EMAIL_PATTERN.test(value.trim());
  });
};

export const phoneValidator = (label = "Mobile number", required = true, minDigits = 10, maxDigits = 15) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`${label} is required.`);
  }
  return schema.test(
    "valid-phone",
    minDigits >= 10
      ? `Enter a valid mobile number (${minDigits} to ${maxDigits} digits).`
      : `Please enter a valid contact number (${minDigits} to ${maxDigits} digits).`,
    (value) => {
      if (!value || value.trim() === "") return !required;
      const digits = value.replace(/\D/g, "");
      return digits.length >= minDigits && digits.length <= maxDigits;
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
  fullName: nameValidator("Full name", true),
  firstName: yup.string().trim().nullable(),
  lastName: yup.string().trim().nullable(),
  dob: dobValidator(18, 100, true),
  gender: selectValidator("Gender", true),
  mobile: phoneValidator("Mobile number", true, 10),
  email: emailValidator(true),
  instagramProfileId: yup.string().trim().max(100, "Instagram Profile ID cannot exceed 100 characters.").nullable(),
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
  bloodGroup: selectValidator("Blood group", true),
  bio: yup.string().trim().max(500, "Bio cannot exceed 500 characters.").nullable(),
  photo: yup.string().trim().nullable(),
  photoName: yup.string().trim().nullable(),
});

// 3. Public Contact Form Schema (All fields required)
export const contactFormSchema = yup.object().shape({
  name: nameValidator("Name", true),
  email: emailValidator(true),
  mobile: phoneValidator("Mobile number", true, 10),
  gender: selectValidator("Gender", true),
  address: textValidator("Address", 5, 300, true),
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
    .test("valid-email", "Enter a valid email address", (val) => !val || EMAIL_PATTERN.test(val)),
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
    .test("valid-email", "Enter a valid email address", (val) => !val || EMAIL_PATTERN.test(val)),
});

// 6. Coach / Trainer Management Schema
export const trainerSchema = yup.object().shape({
  name: nameValidator("Coach name", true),
  dob: yup.string().trim().nullable(),
  gender: yup.string().trim().nullable(),
  bloodGroup: yup.string().trim().nullable(),
  experience: textValidator("Experience", 1, 50, true),
  phone: phoneValidator("Phone number", true, 10),
  email: emailValidator(true),
  instagramProfileId: yup.string().trim().max(100, "Instagram Profile ID cannot exceed 100 characters.").nullable(),
  address: yup.string().trim().nullable(),
  city: yup.string().trim().nullable(),
  state: yup.string().trim().nullable(),
  country: yup.string().trim().nullable(),
  pincode: yup.string().trim().nullable(),
  status: yup.string().trim().nullable(),
  quote: yup.string().trim().max(300, "Quote cannot exceed 300 characters.").nullable(),
  programs: yup.mixed().nullable(),
  photo: yup.string().trim().nullable(),
  bio: yup.string().trim().nullable(),
  shift: yup.string().trim().nullable(),
  batchIds: yup.array().nullable(),
});

// 7. Transaction Reference Validator
export const transactionIdValidator = (label = "Transaction reference", required = false) => {
  let schema = yup.string().trim();
  if (required) {
    schema = schema.required(`${label} is required.`);
  }
  return schema.test("valid-txn-id", `${label} must be a valid reference (alphanumeric, hyphens, slashes).`, (value) => {
    if (!value || value.trim() === "") return !required;
    return TRANSACTION_ID_PATTERN.test(value.trim());
  });
};

// 8. Financial and Monetary Validators
export const financialValidator = (label = "Amount", min = 0, max = 10000000, required = true) => {
  return yup
    .mixed()
    .test("required-financial", `${label} is required.`, (value) => {
      if (!required) return true;
      return value !== "" && value !== null && value !== undefined;
    })
    .test("valid-financial", `${label} must be between ₹${min.toLocaleString("en-IN")} and ₹${max.toLocaleString("en-IN")}.`, (value) => {
      if (value === "" || value === null || value === undefined) return !required;
      const num = Number(value);
      return !Number.isNaN(num) && num >= min && num <= max;
    });
};

export const discountPercentValidator = (max = 100, required = true) => {
  return yup
    .mixed()
    .test("required-discount-pct", "Discount percentage is required.", (value) => {
      if (!required) return true;
      return value !== "" && value !== null && value !== undefined;
    })
    .test("valid-discount-pct", `Discount percentage must be between 0% and ${max}%.`, (value) => {
      if (value === "" || value === null || value === undefined) return !required;
      const num = Number(value);
      return !Number.isNaN(num) && num >= 0 && num <= max;
    });
};

// 9. Membership Plan Master Schema
export const membershipPlanSchema = yup.object().shape({
  name: nameValidator("Plan name", true),
  price: financialValidator("Price", 0, 10000000, true),
  durationMonths: yup
    .number()
    .typeError("Duration must be a number.")
    .required("Duration is required.")
    .min(1, "Duration must be at least 1 month.")
    .max(60, "Duration cannot exceed 60 months."),
  period: yup.string().trim().nullable(),
  billing: yup.string().trim().nullable(),
  badge: yup.string().trim().max(50, "Badge cannot exceed 50 characters.").nullable(),
  status: yup.string().trim().nullable(),
  description: yup.string().trim().max(500, "Description cannot exceed 500 characters.").nullable(),
});

// 10. Batch Management Schema
export const batchSchema = yup.object().shape({
  name: textValidator("Batch name", 2, 80, true),
  startTime: yup.string().trim().required("Start time is required."),
  endTime: yup.string().trim().required("End time is required."),
  daysPattern: yup.string().trim().required("Days pattern is required."),
  capacity: yup
    .number()
    .typeError("Capacity must be a number.")
    .required("Capacity limit is required.")
    .min(1, "Capacity must be at least 1 pax.")
    .max(500, "Capacity cannot exceed 500 pax."),
  description: yup.string().trim().max(500, "Description cannot exceed 500 characters.").nullable(),
});

// 11. Offline Payment Collection Schema
export const offlinePaymentSchema = yup.object().shape({
  amount: yup
    .number()
    .typeError("Please enter a valid numeric amount.")
    .positive("Payment amount must be greater than zero.")
    .required("Payment amount is required."),
  paymentMethod: yup.string().trim().required("Please select a payment method."),
  transactionId: yup.string().trim().nullable(),
  receiptNotes: yup.string().trim().max(500, "Notes cannot exceed 500 characters.").nullable(),
});
