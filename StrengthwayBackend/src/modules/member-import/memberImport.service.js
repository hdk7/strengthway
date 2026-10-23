"use strict";

const XLSX = require("xlsx");
const Member = require("../members/member.model");
const memberRepository = require("../members/member.repository");
const { generateMemberId } = require("../../shared/idGenerator");
const { MEMBER_STATUS, BLOOD_GROUPS, GENDER } = require("../../shared/constants");
const { calculateBmi } = require("../../shared/dateUtils");
const { BadRequestError } = require("../../shared/apiError");

/**
 * Standard Member Import Schema Fields
 */
const IMPORT_COLUMNS = [
  { key: "fullName", label: "Full Name", required: true, aliases: ["full name", "fullname", "name", "member name", "client name", "athlete name", "athlete", "customer name"] },
  { key: "email", label: "Email Address", required: true, aliases: ["email", "email address", "e-mail", "mail", "email id", "primary email", "e-mail id"] },
  { key: "mobile", label: "Mobile Number", required: true, aliases: ["mobile", "mobile number", "phone", "phone number", "contact", "contact number", "whatsapp", "cell", "phone no", "mobile no", "contact no"] },
  { key: "gender", label: "Gender", required: true, aliases: ["gender", "sex"] },
  { key: "dob", label: "Date of Birth", required: true, aliases: ["dob", "date of birth", "birth date", "birthday", "birthdate", "d.o.b", "d.o.b."] },
  { key: "address", label: "Address", required: true, aliases: ["address", "street", "residential address", "home address", "locality", "address line 1", "street address"] },
  { key: "city", label: "City", required: true, aliases: ["city", "town", "district"] },
  { key: "state", label: "State", required: true, aliases: ["state", "province"] },
  { key: "pincode", label: "Pincode", required: true, aliases: ["pincode", "pin code", "postal code", "zip", "zip code", "postal", "pin"] },
  { key: "emergencyName", label: "Emergency Contact Name", required: false, aliases: ["emergency contact name", "emergency name", "guardian name", "contact person", "emergency contact"] },
  { key: "emergencyPhone", label: "Emergency Contact Phone", required: false, aliases: ["emergency contact phone", "emergency phone", "emergency mobile", "guardian phone", "guardian contact"] },
  { key: "emergencyRelation", label: "Emergency Contact Relation", required: false, aliases: ["emergency contact relation", "emergency relation", "relationship", "relation"] },
  { key: "bloodGroup", label: "Blood Group", required: false, aliases: ["blood group", "blood", "blood type"] },
  { key: "height", label: "Height (cm)", required: false, aliases: ["height", "height cm", "height (cm)"] },
  { key: "weight", label: "Weight (kg)", required: false, aliases: ["weight", "weight kg", "weight (kg)"] },
  { key: "instagramProfileId", label: "Instagram Profile", required: false, aliases: ["instagram", "instagram profile", "insta id", "instagram handle", "insta"] },
  { key: "bio", label: "Bio / Notes", required: false, aliases: ["bio", "notes", "remarks"] },
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Normalizes header string by stripping asterisks, brackets, punctuation, and extra whitespace.
 */
function normalizeHeader(str) {
  if (!str) return "";
  return String(str)
    .replace(/[*_#()[\]:;,.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractPhoneDigits(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  return cleaned.length > 10 ? cleaned.slice(-10) : cleaned;
}

/**
 * Normalizes any date representation (ISO string, DD/MM/YYYY, or numeric Excel serial date like 32275) to YYYY-MM-DD.
 */
function normalizeDate(raw) {
  if (raw === null || raw === undefined || raw === "") return null;

  // 1. If already Date object from XLSX
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }

  // 2. If numeric Excel date code (e.g. 32275 = 12 May 1988)
  const num = Number(raw);
  if (!isNaN(num) && num > 1000 && num < 100000) {
    try {
      const parsedCode = XLSX.SSF.parse_date_code(num);
      if (parsedCode && parsedCode.y && parsedCode.m && parsedCode.d) {
        const y = String(parsedCode.y).padStart(4, "0");
        const m = String(parsedCode.m).padStart(2, "0");
        const d = String(parsedCode.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    } catch {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }

  const s = String(raw).trim();
  // 3. Standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : s;
  }

  // 4. DD/MM/YYYY or DD-MM-YYYY
  const parts = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (parts) {
    const day = parts[1].padStart(2, "0");
    const month = parts[2].padStart(2, "0");
    const year = parts[3];
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : iso;
  }

  // 5. Fallback Date constructor
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

class MemberImportService {
  /**
   * Generates an official formatted Excel template (.xlsx) for bulk member import.
   */
  generateTemplate(format = "xlsx") {
    const headers = IMPORT_COLUMNS.map((c) => (c.required ? `${c.label} *` : c.label));

    // Sample guidance row (clear reference for admin to follow)
    const exampleRow = [
      "Aarav Sharma",
      "aarav.sharma@example.com",
      "9876543210",
      "Male",
      "1998-05-15",
      "Flat 402, Greenfield Heights, MG Road",
      "Mumbai",
      "Maharashtra",
      "400001",
      "Rajesh Sharma",
      "9876543211",
      "Father",
      "O+",
      "178",
      "75",
      "@aarav_fit",
      "Regular fitness enthusiast",
    ];

    const dataSheetData = [headers, exampleRow];
    const dataSheet = XLSX.utils.aoa_to_sheet(dataSheetData);

    // Column widths
    dataSheet["!cols"] = [
      { wch: 22 }, // Full Name
      { wch: 28 }, // Email
      { wch: 16 }, // Mobile
      { wch: 12 }, // Gender
      { wch: 15 }, // DOB
      { wch: 35 }, // Address
      { wch: 16 }, // City
      { wch: 16 }, // State
      { wch: 12 }, // Pincode
      { wch: 24 }, // Emergency Name
      { wch: 20 }, // Emergency Phone
      { wch: 18 }, // Emergency Relation
      { wch: 14 }, // Blood Group
      { wch: 14 }, // Height
      { wch: 14 }, // Weight
      { wch: 20 }, // Instagram
      { wch: 25 }, // Bio
    ];

    // Instructions Sheet
    const instructionData = [
      ["StrengthWay Athletic Club — Member Bulk Import Guidelines"],
      [""],
      ["Rule", "Requirement & Description"],
      ["Required Fields (*)", "Full Name, Email Address, Mobile Number, Gender, Date of Birth, Address, City, State, Pincode."],
      ["Uniqueness Rules", "Both Email Address and Mobile Number must be unique across all existing gym members and within this file."],
      ["Mobile Numbers", "Must contain 10 valid digits (standard Indian mobile format). Example: 9876543210"],
      ["Age Requirement", "Members must be between 18 and 100 years of age as on the registration date."],
      ["Date Format", "Use YYYY-MM-DD (e.g., 1995-08-24) or DD/MM/YYYY (e.g., 24/08/1995), or standard Excel Date cells."],
      ["Gender Values", "Allowed values: 'Male', 'Female', or 'Other'."],
      ["Pincode", "Must be a 6-digit Indian postal code (e.g. 400001)."],
      ["Blood Groups", "Allowed: A+, A-, B+, B-, AB+, AB-, O+, O-."],
      ["Height & Weight", "Height in centimeters (60 - 260 cm), Weight in kilograms (25 - 300 kg)."],
      ["Guidance Row Notice", "Row 2 of the template contains sample format guidance. You may delete it or replace it with real member data."],
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructionData);
    instructionSheet["!cols"] = [{ wch: 25 }, { wch: 80 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Member Import Template");
    XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions & Rules");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: format === "csv" ? "csv" : "xlsx",
    });

    return {
      buffer,
      filename: `StrengthWay_Member_Import_Template.${format === "csv" ? "csv" : "xlsx"}`,
      mimeType:
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  /**
   * Parses uploaded Excel (.xlsx, .xls) or CSV buffer into structured records.
   * Resilient to multiple sheets, title banners, header rows, and empty rows.
   */
  async parseUploadedFile(fileBuffer, originalname) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError("The uploaded file is empty.");
    }

    let workbook;
    try {
      workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
    } catch (err) {
      throw new BadRequestError(`Failed to parse spreadsheet file: ${err.message}`);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new BadRequestError("The uploaded spreadsheet contains no sheets.");
    }

    // 1. Locate the data worksheet (prefer sheets named 'member', 'template', 'data', or the sheet with most rows, skipping instructions)
    let targetSheet = null;
    let targetSheetName = "";
    let maxRowCount = -1;

    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase();
      if (lower.includes("instruction") || lower.includes("guideline") || lower.includes("readme")) {
        continue;
      }
      const sheet = workbook.Sheets[name];
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (matrix && matrix.length > maxRowCount) {
        maxRowCount = matrix.length;
        targetSheet = sheet;
        targetSheetName = name;
      }
    }

    if (!targetSheet) {
      targetSheetName = workbook.SheetNames[0];
      targetSheet = workbook.Sheets[targetSheetName];
    }

    // 2. Convert sheet to 2D array matrix to accurately detect header row
    const rawMatrix = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: "" });
    if (!rawMatrix || rawMatrix.length === 0) {
      throw new BadRequestError("No data rows found in the spreadsheet.");
    }

    // 3. Find the header row (first row with at least 1 recognizable column)
    let headerRowIndex = 0;
    let headerRow = [];

    for (let r = 0; r < Math.min(rawMatrix.length, 10); r++) {
      const row = rawMatrix[r];
      if (Array.isArray(row)) {
        const matchCount = row.filter((cell) => {
          const norm = normalizeHeader(cell);
          if (!norm) return false;
          return IMPORT_COLUMNS.some(
            (col) =>
              normalizeHeader(col.label) === norm ||
              col.key.toLowerCase() === norm ||
              col.aliases.some((a) => normalizeHeader(a) === norm)
          );
        }).length;

        if (matchCount >= 1) {
          headerRowIndex = r;
          headerRow = row;
          break;
        }
      }
    }

    if (headerRow.length === 0) {
      headerRow = rawMatrix[0] || [];
    }

    // 4. Map column index to schema key
    const columnMap = {}; // colIndex -> schema key
    headerRow.forEach((cell, colIdx) => {
      const norm = normalizeHeader(cell);
      if (!norm) return;

      const match = IMPORT_COLUMNS.find((col) => {
        if (normalizeHeader(col.label) === norm || col.key.toLowerCase() === norm) {
          return true;
        }
        return col.aliases.some((alias) => normalizeHeader(alias) === norm);
      });

      if (match) {
        columnMap[colIdx] = match.key;
      }
    });

    // 5. Transform all data rows below header row
    const parsedRows = [];
    for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row)) continue;

      const record = {};
      let hasData = false;

      row.forEach((cell, colIdx) => {
        const targetKey = columnMap[colIdx];
        if (targetKey) {
          let val = cell;
          if (val instanceof Date) {
            val = val.toISOString().slice(0, 10);
          } else if (typeof val === "string") {
            val = val.trim();
          }
          record[targetKey] = val;
          if (val !== "" && val !== null && val !== undefined) {
            hasData = true;
          }
        }
      });

      if (hasData) {
        parsedRows.push({
          rowNumber: r + 1, // 1-based index matching spreadsheet line
          rawRow: row,
          ...record,
        });
      }
    }

    return {
      filename: originalname,
      fileSize: fileBuffer.length,
      sheetName: targetSheetName,
      totalRows: parsedRows.length,
      headers: headerRow.map((c) => String(c).trim()).filter(Boolean),
      mappedFields: Object.values(columnMap),
      rows: parsedRows,
    };
  }

  /**
   * Validates parsed member rows and detects within-file and database duplicates.
   */
  async validateAndPreview(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestError("No rows provided for validation.");
    }

    // 1. Gather all unique emails and mobile numbers to run batch query against MongoDB
    const emailsInFile = [];
    const phonesInFile = [];

    rows.forEach((r) => {
      if (r.email && typeof r.email === "string") {
        emailsInFile.push(r.email.trim().toLowerCase());
      }
      if (r.mobile) {
        const digits = extractPhoneDigits(r.mobile);
        if (digits) phonesInFile.push(digits);
      }
    });

    // 2. Query existing members from MongoDB Atlas in a single batch
    const existingMembers = await Member.find(
      {
        isDeleted: false,
        $or: [
          { email: { $in: emailsInFile } },
          { mobile: { $in: phonesInFile.map((d) => new RegExp(`${d}$`)) } },
        ],
      },
      "id fullName firstName lastName email mobile status"
    ).lean();

    const existingByEmail = new Map();
    const existingByPhone = new Map();

    existingMembers.forEach((m) => {
      if (m.email) existingByEmail.set(m.email.toLowerCase().trim(), m);
      if (m.mobile) {
        const d = extractPhoneDigits(m.mobile);
        if (d) existingByPhone.set(d, m);
      }
    });

    // 3. Track seen items within the file for within-file duplicate detection
    const seenEmailsInFile = new Map(); // email -> rowNumber
    const seenPhonesInFile = new Map(); // phoneDigits -> rowNumber

    const validatedRows = [];
    let readyCount = 0;
    let fileDuplicateCount = 0;
    let dbDuplicateCount = 0;
    let invalidCount = 0;

    const today = new Date();

    rows.forEach((row) => {
      const rowNumber = row.rowNumber || validatedRows.length + 2;
      const errors = [];
      const warnings = [];

      // Validate Full Name
      const fullName = (row.fullName || "").trim();
      if (!fullName) {
        errors.push("Full Name is required.");
      } else if (fullName.length < 2) {
        errors.push("Full Name must be at least 2 characters.");
      }

      // Validate Email
      const email = (row.email || "").trim().toLowerCase();
      if (!email) {
        errors.push("Email Address is required.");
      } else if (!EMAIL_REGEX.test(email)) {
        errors.push(`Invalid email format: "${email}".`);
      }

      // Validate Mobile
      const rawMobile = String(row.mobile || "").trim();
      const phoneDigits = extractPhoneDigits(rawMobile);
      if (!rawMobile) {
        errors.push("Mobile number is required.");
      } else if (!phoneDigits || phoneDigits.length < 10) {
        errors.push(`Mobile number must be at least 10 digits (got "${rawMobile}").`);
      }

      // Validate Gender
      let gender = (row.gender || "").trim();
      const lowerGender = gender.toLowerCase();
      if (!gender) {
        errors.push("Gender is required.");
      } else if (["m", "male"].includes(lowerGender)) {
        gender = "Male";
      } else if (["f", "female"].includes(lowerGender)) {
        gender = "Female";
      } else if (["o", "other", "others"].includes(lowerGender)) {
        gender = "Other";
      } else {
        errors.push("Gender must be 'Male', 'Female', or 'Other'.");
      }

      // Validate Date of Birth & Age
      const normalizedDob = normalizeDate(row.dob);
      if (!row.dob) {
        errors.push("Date of birth is required.");
      } else if (!normalizedDob) {
        errors.push(`Invalid date format for DOB: "${row.dob}". Expected YYYY-MM-DD or DD/MM/YYYY.`);
      } else {
        const birthDate = new Date(normalizedDob);
        if (birthDate > today) {
          errors.push("Date of birth cannot be in the future.");
        } else {
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 18) {
            errors.push(`Member must be at least 18 years old (calculated age: ${age}).`);
          } else if (age > 100) {
            errors.push("Please check DOB: member age cannot exceed 100 years.");
          }
        }
      }

      // Validate Address, City, State, Pincode
      const address = (row.address || "").trim();
      if (!address) {
        errors.push("Address is required.");
      } else if (address.length < 5) {
        errors.push("Address must be at least 5 characters.");
      }

      const city = (row.city || "").trim();
      if (!city) {
        errors.push("City is required.");
      }

      const state = (row.state || "").trim();
      if (!state) {
        errors.push("State is required.");
      }

      const pincode = String(row.pincode || "").trim();
      if (!pincode) {
        errors.push("Pincode is required.");
      } else if (!PINCODE_REGEX.test(pincode)) {
        errors.push(`Pincode must be a valid 6-digit postal code (got "${pincode}").`);
      }

      // Emergency Contact Name (Defaults to Member Name or Self if omitted)
      let emergencyName = (row.emergencyName || "").trim();
      if (!emergencyName) {
        emergencyName = fullName || "Self";
      }

      // Optional field validations
      let bloodGroup = (row.bloodGroup || "").trim().toUpperCase();
      if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
        warnings.push(`Unrecognized blood group "${bloodGroup}". Valid values: ${BLOOD_GROUPS.join(", ")}.`);
        bloodGroup = "";
      }

      let height = row.height ? Number(row.height) : null;
      if (height !== null && (isNaN(height) || height < 60 || height > 260)) {
        warnings.push(`Height must be between 60 and 260 cm (got "${row.height}").`);
        height = null;
      }

      let weight = row.weight ? Number(row.weight) : null;
      if (weight !== null && (isNaN(weight) || weight < 25 || weight > 300)) {
        warnings.push(`Weight must be between 25 and 300 kg (got "${row.weight}").`);
        weight = null;
      }

      // --- DUPLICATE CHECKS ---
      let isFileDuplicate = false;
      let isDbDuplicate = false;
      let duplicateReason = "";

      // 1. Within-file duplicate check
      if (email && seenEmailsInFile.has(email)) {
        isFileDuplicate = true;
        duplicateReason = `Duplicate email within file (matches Row ${seenEmailsInFile.get(email)})`;
        errors.push(duplicateReason);
      } else if (email) {
        seenEmailsInFile.set(email, rowNumber);
      }

      if (phoneDigits && seenPhonesInFile.has(phoneDigits)) {
        isFileDuplicate = true;
        const msg = `Duplicate phone number within file (matches Row ${seenPhonesInFile.get(phoneDigits)})`;
        duplicateReason = duplicateReason ? `${duplicateReason}; ${msg}` : msg;
        errors.push(msg);
      } else if (phoneDigits) {
        seenPhonesInFile.set(phoneDigits, rowNumber);
      }

      // 2. Database duplicate check
      let existingMember = null;
      if (email && existingByEmail.has(email)) {
        isDbDuplicate = true;
        existingMember = existingByEmail.get(email);
        duplicateReason = `Email already registered to existing member ${existingMember.id} (${existingMember.fullName || existingMember.firstName})`;
      } else if (phoneDigits && existingByPhone.has(phoneDigits)) {
        isDbDuplicate = true;
        existingMember = existingByPhone.get(phoneDigits);
        duplicateReason = `Mobile number already registered to existing member ${existingMember.id} (${existingMember.fullName || existingMember.firstName})`;
      }

      // Determine final row status
      let status = "READY";
      if (errors.length > 0) {
        status = isFileDuplicate ? "DUPLICATE_IN_FILE" : "INVALID";
      } else if (isDbDuplicate) {
        status = "EXISTING_IN_DB";
      }

      if (status === "READY") readyCount++;
      else if (status === "DUPLICATE_IN_FILE") fileDuplicateCount++;
      else if (status === "EXISTING_IN_DB") dbDuplicateCount++;
      else invalidCount++;

      validatedRows.push({
        rowNumber,
        fullName,
        email,
        mobile: rawMobile,
        gender,
        dob: normalizedDob || row.dob,
        address,
        city,
        state,
        pincode,
        emergencyName,
        emergencyPhone: row.emergencyPhone || "",
        emergencyRelation: row.emergencyRelation || "",
        bloodGroup,
        height,
        weight,
        instagramProfileId: row.instagramProfileId || "",
        bio: row.bio || "",
        status,
        errors,
        warnings,
        isDbDuplicate,
        isFileDuplicate,
        duplicateReason,
        existingMember: existingMember
          ? {
              id: existingMember.id,
              name: existingMember.fullName || `${existingMember.firstName} ${existingMember.lastName}`,
              email: existingMember.email,
              mobile: existingMember.mobile,
            }
          : null,
      });
    });

    return {
      summary: {
        totalRows: rows.length,
        readyCount,
        fileDuplicateCount,
        dbDuplicateCount,
        invalidCount,
      },
      rows: validatedRows,
    };
  }

  /**
   * Executes bulk member import directly into MongoDB Atlas.
   * Inserts only valid, non-duplicate member records.
   */
  async executeImport({ records, adminUser, sourceFilename = "member_import.xlsx" }) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestError("No records provided for execution.");
    }

    // Filter to only records marked READY or without errors
    const validRecords = records.filter(
      (r) => r.status === "READY" || (!r.errors || r.errors.length === 0)
    );

    if (validRecords.length === 0) {
      throw new BadRequestError("No valid records to import. All rows contain errors or duplicates.");
    }

    // Check again against DB in real-time to avoid race conditions
    const emailsToImport = validRecords.map((r) => r.email.toLowerCase().trim());
    const phonesToImport = validRecords.map((r) => extractPhoneDigits(r.mobile));

    const conflicts = await Member.find(
      {
        isDeleted: false,
        $or: [
          { email: { $in: emailsToImport } },
          { mobile: { $in: phonesToImport.map((d) => new RegExp(`${d}$`)) } },
        ],
      },
      "id email mobile"
    ).lean();

    const conflictEmails = new Set(conflicts.map((c) => c.email.toLowerCase().trim()));
    const conflictPhones = new Set(conflicts.map((c) => extractPhoneDigits(c.mobile)));

    let maxSuffix = await memberRepository.getMaxIdSuffix();

    const membersToInsert = [];
    const skippedRecords = [];

    validRecords.forEach((record) => {
      const normEmail = record.email.toLowerCase().trim();
      const normPhone = extractPhoneDigits(record.mobile);

      if (conflictEmails.has(normEmail) || conflictPhones.has(normPhone)) {
        skippedRecords.push({
          rowNumber: record.rowNumber,
          fullName: record.fullName,
          email: record.email,
          mobile: record.mobile,
          reason: "Database record created concurrently.",
        });
        return;
      }

      maxSuffix += 1;
      const memberId = generateMemberId(maxSuffix - 1);

      const nameParts = (record.fullName || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "Member";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Member";

      const heightStr = record.height ? `${record.height} cm` : "";
      const weightStr = record.weight ? `${record.weight} kg` : "";
      const bmi = calculateBmi(record.height, record.weight);

      const physicalStats = {
        height: heightStr,
        weight: weightStr,
        bmi: bmi ? String(bmi) : "",
        bloodGroup: record.bloodGroup || "",
      };

      const emergencyContact = {
        name: record.emergencyName || "Self",
        phone: record.emergencyPhone || "",
        relation: record.emergencyRelation || "",
      };

      membersToInsert.push({
        id: memberId,
        fullName: record.fullName,
        firstName,
        lastName,
        email: normEmail,
        mobile: String(record.mobile).trim(),
        gender: record.gender || "Other",
        dob: record.dob,
        instagramProfileId: record.instagramProfileId || "",
        height: heightStr,
        weight: weightStr,
        bloodGroup: record.bloodGroup || "",
        address: record.address || "",
        city: record.city || "",
        state: record.state || "",
        country: "India",
        pincode: String(record.pincode).trim(),
        bio: record.bio || "",
        status: MEMBER_STATUS.ACTIVE,
        isDeleted: false,
        deletedAt: null,
        batchId: "",
        batchName: "",
        batchTiming: "",
        assignedBatch: "General Access",
        physicalStats,
        emergencyName: record.emergencyName || "Self",
        emergencyPhone: record.emergencyPhone || "",
        emergencyRelation: record.emergencyRelation || "",
        emergencyContact,
        membershipPlan: null,
        paymentDetails: null,
        registeredAt: new Date(),
      });
    });

    const importedMembers = [];
    const failedRows = [];

    // Insert individually to safely isolate any unexpected schema failure without aborting entire batch
    for (const memberDoc of membersToInsert) {
      try {
        const created = await Member.create(memberDoc);
        importedMembers.push({
          id: created.id,
          fullName: created.fullName,
          email: created.email,
          mobile: created.mobile,
        });
      } catch (err) {
        failedRows.push({
          identifier: memberDoc.id,
          fullName: memberDoc.fullName,
          email: memberDoc.email,
          mobile: memberDoc.mobile,
          reason: err.message,
        });
      }
    }

    return {
      success: true,
      sourceFilename,
      totalRowsProcessed: records.length,
      importedCount: importedMembers.length,
      skippedCount: records.length - validRecords.length + skippedRecords.length,
      failedCount: failedRows.length,
      importedMembers,
      failedRows,
    };
  }
}

module.exports = new MemberImportService();
