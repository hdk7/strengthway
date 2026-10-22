"use strict";

const XLSX = require("xlsx");
const Member = require("../members/member.model");
const MembershipPlan = require("../membership-plans/plan.model");
const Batch = require("../batches/batch.model");
const memberRepository = require("../members/member.repository");
const { MemberImportHistory, MemberImportConfig } = require("./memberImport.model");
const { generateMemberId, generateImportId } = require("../../shared/idGenerator");
const { MEMBER_STATUS } = require("../../shared/constants");
const { calculateBmi } = require("../../shared/dateUtils");
const { NotFoundError, BadRequestError } = require("../../shared/apiError");

const CRM_FIELDS = [
  {
    key: "fullName",
    label: "Full Name",
    required: true,
    description: "First & Last name of the member",
    aliases: [
      "full name", "fullname", "name", "member name", "full name of member",
      "member full name", "athlete name", "client name", "customer name", "student name"
    ],
  },
  {
    key: "firstName",
    label: "First Name",
    required: false,
    description: "Member first name",
    aliases: ["first name", "firstname", "given name"],
  },
  {
    key: "lastName",
    label: "Last Name",
    required: false,
    description: "Member last name",
    aliases: ["last name", "lastname", "surname", "family name"],
  },
  {
    key: "mobile",
    label: "Phone Number",
    required: true,
    description: "10-digit mobile number",
    aliases: [
      "phone number", "phone", "mobile", "mobile number", "mobile no",
      "contact number", "contact", "whatsapp number", "cell", "telephone",
      "phone no", "primary phone", "contact no", "whatsapp"
    ],
  },
  {
    key: "email",
    label: "Email Address",
    required: true,
    description: "Valid email address",
    aliases: ["email address", "email", "e-mail", "mail", "email id", "primary email"],
  },
  {
    key: "gender",
    label: "Gender",
    required: true,
    description: "Male, Female, or Other",
    aliases: ["gender", "sex"],
  },
  {
    key: "dob",
    label: "Date of Birth",
    required: true,
    description: "YYYY-MM-DD or DD/MM/YYYY",
    aliases: ["date of birth", "dob", "birth date", "birthday", "bday", "birthdate"],
  },
  {
    key: "id",
    label: "Existing Member ID",
    required: false,
    description: "CRM Member ID e.g. MEM-2001 (if existing member)",
    aliases: [
      "existing member id", "member id", "id", "membership id",
      "membership number", "reg no", "registration number", "old member id"
    ],
  },
  {
    key: "planName",
    label: "Membership Plan",
    required: false,
    description: "Name of the membership plan in CRM",
    aliases: [
      "membership plan", "plan", "plan name", "selected plan",
      "subscription plan", "package", "plan choice", "membership"
    ],
  },
  {
    key: "batchName",
    label: "Batch",
    required: false,
    description: "Batch name, code, or timing (e.g. BATCH 1)",
    aliases: [
      "batch", "batch name", "assigned batch", "timing", "batch timing",
      "preferred batch", "slot", "batch slot", "training slot", "shift"
    ],
  },
  {
    key: "bloodGroup",
    label: "Blood Group",
    required: false,
    description: "A+, A-, B+, B-, AB+, AB-, O+, O-",
    aliases: ["blood group", "blood type", "blood", "bg"],
  },
  {
    key: "height",
    label: "Height (cm)",
    required: false,
    description: "Height in centimetres",
    aliases: ["height", "height cm", "height (cm)", "height in cm", "ht"],
  },
  {
    key: "weight",
    label: "Weight (kg)",
    required: false,
    description: "Weight in kilograms",
    aliases: ["weight", "weight kg", "weight (kg)", "weight in kg", "wt"],
  },
  {
    key: "address",
    label: "Address",
    required: false,
    description: "Street / Residential address",
    aliases: ["address", "residential address", "home address", "street address", "location"],
  },
  {
    key: "city",
    label: "City",
    required: false,
    description: "City name",
    aliases: ["city", "town"],
  },
  {
    key: "state",
    label: "State",
    required: false,
    description: "State name",
    aliases: ["state", "province"],
  },
  {
    key: "pincode",
    label: "Pincode",
    required: false,
    description: "Postal code / Zip code",
    aliases: ["pincode", "pin code", "zip", "zip code", "postal code"],
  },
  {
    key: "emergencyName",
    label: "Emergency Contact Name",
    required: false,
    description: "Emergency contact full name",
    aliases: [
      "emergency contact name", "emergency name", "guardian name",
      "in case of emergency name", "emergency contact person", "kin name"
    ],
  },
  {
    key: "emergencyPhone",
    label: "Emergency Contact Phone",
    required: false,
    description: "Emergency contact phone number",
    aliases: [
      "emergency contact phone", "emergency phone", "emergency contact number",
      "guardian phone", "emergency mobile", "kin phone"
    ],
  },
  {
    key: "emergencyRelation",
    label: "Emergency Contact Relation",
    required: false,
    description: "Relationship to member (Spouse, Parent, Friend)",
    aliases: [
      "emergency contact relation", "emergency relation", "relationship",
      "relation", "kin relation", "guardian relation"
    ],
  },
  {
    key: "bio",
    label: "Medical Notes / Fitness Background",
    required: false,
    description: "Medical clearance, injuries, or athletic history",
    aliases: [
      "medical notes", "medical notes / fitness background", "medical history",
      "health issues", "notes", "fitness background", "medical clearance",
      "health notes", "comments", "bio", "medical conditions"
    ],
  },
  {
    key: "instagramProfileId",
    label: "Instagram Profile ID",
    required: false,
    description: "Instagram handle e.g. @athlete_name",
    aliases: ["instagram profile id", "instagram", "insta id", "instagram handle", "social handle", "ig handle"],
  },
];

const IGNORE_PATTERNS = [
  "timestamp", "submission date", "response id", "submitted at",
  "created at", "id (google)", "submission time"
];

function normalizeHeader(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/[*()_]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(str) {
  if (!str) return "";
  const raw = String(str).trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const core = digits.slice(2);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    const core = digits.slice(1);
    return `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }
  if (digits.length > 10) {
    return `+${digits}`;
  }
  return raw;
}

function extractPhoneDigits(str) {
  if (!str) return "";
  const digits = String(str).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function parseFlexibleDate(val) {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (!str) return "";

  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const yyyy = isoMatch[1];
    const mm = String(isoMatch[2]).padStart(2, "0");
    const dd = String(isoMatch[3]).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (ddmmyyyyMatch) {
    const dd = String(ddmmyyyyMatch[1]).padStart(2, "0");
    const mm = String(ddmmyyyyMatch[2]).padStart(2, "0");
    const yyyy = ddmmyyyyMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return str;
}

function normalizeGender(val) {
  if (!val) return "Other";
  const s = String(val).trim().toLowerCase();
  if (s.startsWith("m") || s === "man" || s === "boy") return "Male";
  if (s.startsWith("f") || s === "woman" || s === "girl") return "Female";
  return "Other";
}

function normalizeBloodGroup(val) {
  if (!val) return "";
  const s = String(val).trim().toUpperCase().replace(/\s+/g, "");
  const valid = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  return valid.includes(s) ? s : "";
}

class MemberImportService {
  async getImportConfig() {
    let config = await MemberImportConfig.findOne({ key: "default" }).lean();
    if (!config) {
      config = await MemberImportConfig.create({
        key: "default",
        googleFormUrl:
          "https://docs.google.com/forms/d/e/1FAIpQLScP_StrengthWayMemberRegistrationTemplate/viewform",
        googleSheetUrl: "",
        customMappings: {},
        instructions:
          "1. Open & duplicate the Google Form template.\n2. Connect responses to Google Sheets.\n3. Share the Google Form with your members.\n4. Download the responses spreadsheet as CSV or Excel (.xlsx).\n5. Upload the file here for smart automatic mapping and validation.",
      });
    }

    const plans = await MembershipPlan.find({ status: "Active" }, "id name durationMonths price formattedPrice").lean();
    const batches = await Batch.find({ status: "Active" }, "id name shortName startTime endTime timingLabel").lean();

    return {
      config,
      standardFields: CRM_FIELDS,
      activePlans: plans,
      activeBatches: batches,
    };
  }

  async updateImportConfig(data, adminUser) {
    const updates = {
      updatedBy: adminUser?.name || adminUser?.email || "Admin",
      updatedAt: new Date(),
    };
    if (data.googleFormUrl !== undefined) updates.googleFormUrl = data.googleFormUrl.trim();
    if (data.googleSheetUrl !== undefined) updates.googleSheetUrl = data.googleSheetUrl.trim();
    if (data.instructions !== undefined) updates.instructions = data.instructions.trim();
    if (data.customMappings && typeof data.customMappings === "object") {
      updates.customMappings = data.customMappings;
    }

    const config = await MemberImportConfig.findOneAndUpdate(
      { key: "default" },
      { $set: updates },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return config;
  }

  generateTemplate(format = "xlsx") {
    const headers = [
      "Full Name",
      "Phone Number",
      "Email Address",
      "Gender",
      "Date of Birth",
      "Existing Member ID",
      "Membership Plan",
      "Batch",
      "Blood Group",
      "Height (cm)",
      "Weight (kg)",
      "Address",
      "City",
      "State",
      "Pincode",
      "Emergency Contact Name",
      "Emergency Contact Phone",
      "Emergency Contact Relation",
      "Medical Notes / Fitness Background",
      "Instagram Profile ID",
    ];

    const sampleRows = [
      [
        "Arun Varma",
        "+91 98400 10000",
        "arun.varma@example.com",
        "Male",
        "1994-06-14",
        "MEM-2001",
        "Quarterly Pro",
        "BATCH 1",
        "O+",
        "178",
        "76",
        "Apt 4B, Emerald Heights, Indiranagar",
        "Bengaluru",
        "Karnataka",
        "560038",
        "Pooja Varma",
        "+91 98401 98765",
        "Spouse",
        "No prior spinal injury. Cleared for heavy barbell training.",
        "@arun_varma_fit",
      ],
      [
        "Priya Nair",
        "+91 98401 17919",
        "priya.nair@example.com",
        "Female",
        "1997-03-22",
        "",
        "Monthly Starter",
        "BATCH 2",
        "B+",
        "165",
        "58",
        "Villa 12, Palm Meadows, Whitefield",
        "Bengaluru",
        "Karnataka",
        "560066",
        "Suresh Nair",
        "+91 98402 98765",
        "Father",
        "Cleared for high-intensity athletic conditioning.",
        "@priya_strength",
      ],
    ];

    const data = [headers, ...sampleRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));
    XLSX.utils.book_append_sheet(wb, ws, "Member Import Template");

    if (format === "csv") {
      const csvContent = XLSX.write(wb, { type: "string", bookType: "csv" });
      return {
        buffer: Buffer.from("\uFEFF" + csvContent, "utf8"),
        mimeType: "text/csv; charset=utf-8",
        filename: "StrengthWay_Member_Import_Template.csv",
      };
    }

    const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return {
      buffer: xlsxBuffer,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: "StrengthWay_Member_Import_Template.xlsx",
    };
  }

  async parseUploadedFile(fileBuffer, originalname) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError("Uploaded file is empty.");
    }

    let wb;
    try {
      wb = XLSX.read(fileBuffer, {
        type: "buffer",
        cellDates: true,
        raw: false,
        defval: "",
      });
    } catch (e) {
      throw new BadRequestError(`Could not parse spreadsheet file: ${e.message}`);
    }

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      throw new BadRequestError("Spreadsheet contains no readable sheets.");
    }

    let sheetName = wb.SheetNames.find((s) => /form\s*responses/i.test(s)) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestError("Uploaded file contains no data rows.");
    }

    const rows = rawRows.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).trim() !== "")
    );

    if (rows.length === 0) {
      throw new BadRequestError("Uploaded file contains only empty rows.");
    }

    const headers = Object.keys(rows[0] || {});
    const config = await MemberImportConfig.findOne({ key: "default" }).lean();
    const savedCustomMappings = config?.customMappings || {};

    const mappings = {};
    headers.forEach((header) => {
      const norm = normalizeHeader(header);

      if (IGNORE_PATTERNS.some((p) => norm.includes(p))) {
        mappings[header] = {
          targetField: "IGNORE",
          confidence: "HIGH",
          matchType: "AUTO_IGNORED",
          label: "Ignore (Google Timestamp / Metadata)",
        };
        return;
      }

      if (savedCustomMappings[header]) {
        const fieldKey = savedCustomMappings[header];
        const fieldDef = CRM_FIELDS.find((f) => f.key === fieldKey);
        mappings[header] = {
          targetField: fieldKey,
          confidence: "HIGH",
          matchType: "SAVED_PRESET",
          label: fieldDef?.label || fieldKey,
        };
        return;
      }

      const exactMatch = CRM_FIELDS.find(
        (f) =>
          f.key.toLowerCase() === norm ||
          normalizeHeader(f.label) === norm ||
          f.label.toLowerCase() === header.trim().toLowerCase()
      );
      if (exactMatch) {
        mappings[header] = {
          targetField: exactMatch.key,
          confidence: "HIGH",
          matchType: "EXACT",
          label: exactMatch.label,
        };
        return;
      }

      const aliasMatch = CRM_FIELDS.find((f) =>
        f.aliases.some((alias) => normalizeHeader(alias) === norm || norm.includes(normalizeHeader(alias)))
      );
      if (aliasMatch) {
        mappings[header] = {
          targetField: aliasMatch.key,
          confidence: "HIGH",
          matchType: "ALIAS",
          label: aliasMatch.label,
        };
        return;
      }

      mappings[header] = {
        targetField: "",
        confidence: "LOW",
        matchType: "UNMAPPED",
        label: "Select CRM Field...",
      };
    });

    return {
      filename: originalname,
      fileSize: fileBuffer.length,
      totalRows: rows.length,
      headers,
      mappings,
      sampleRows: rows.slice(0, 5),
      allRows: rows,
    };
  }

  async validateAndPreview(rows, mappings = {}) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestError("No rows provided for validation.");
    }

    const [dbPlans, dbBatches, existingMembers] = await Promise.all([
      MembershipPlan.find({}, "id name durationMonths price formattedPrice status").lean(),
      Batch.find({}, "id name shortName startTime endTime timingLabel status currentPax maxPax").lean(),
      Member.find({ isDeleted: false }, "id fullName firstName lastName email mobile assignedBatch batchName batchId membershipPlan").lean(),
    ]);

    const memberById = new Map();
    const memberByPhone = new Map();
    const memberByEmail = new Map();

    existingMembers.forEach((m) => {
      if (m.id) memberById.set(m.id.toUpperCase().trim(), m);
      if (m.mobile) {
        const d = extractPhoneDigits(m.mobile);
        if (d) memberByPhone.set(d, m);
      }
      if (m.email) memberByEmail.set(m.email.toLowerCase().trim(), m);
    });

    const matchPlan = (planStr) => {
      if (!planStr) return null;
      const s = String(planStr).trim().toLowerCase();
      return (
        dbPlans.find(
          (p) =>
            p.id.toLowerCase() === s ||
            p.name.toLowerCase() === s ||
            s.includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(s)
        ) || null
      );
    };

    const matchBatch = (batchStr) => {
      if (!batchStr) return null;
      const s = String(batchStr).trim().toLowerCase();
      const numMatch = s.match(/\d+/);
      const batchNum = numMatch ? parseInt(numMatch[0], 10) : null;

      return (
        dbBatches.find((b) => {
          if (b.id.toLowerCase() === s) return true;
          if (b.name.toLowerCase() === s) return true;
          if (b.shortName && b.shortName.toLowerCase() === s) return true;
          if (b.timingLabel && b.timingLabel.toLowerCase().includes(s)) return true;
          if (batchNum !== null) {
            const bNumMatch = b.name.match(/\d+/) || b.id.match(/\d+/);
            if (bNumMatch && parseInt(bNumMatch[0], 10) === batchNum) return true;
          }
          return false;
        }) || null
      );
    };

    const seenPhonesInFile = new Map();
    const seenEmailsInFile = new Map();

    const readyRecords = [];
    const existingRecords = [];
    const issueRecords = [];

    rows.forEach((rawRow, index) => {
      const rowNumber = index + 1;
      const record = {};

      Object.entries(mappings).forEach(([header, mappingObj]) => {
        const target = typeof mappingObj === "string" ? mappingObj : mappingObj?.targetField;
        if (target && target !== "IGNORE" && rawRow[header] !== undefined) {
          record[target] = String(rawRow[header] ?? "").trim();
        }
      });

      let fullName = record.fullName || "";
      let firstName = record.firstName || "";
      let lastName = record.lastName || "";

      if (!fullName && (firstName || lastName)) {
        fullName = `${firstName} ${lastName}`.trim();
      } else if (fullName && (!firstName || !lastName)) {
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "";
      }

      record.fullName = fullName;
      record.firstName = firstName;
      record.lastName = lastName;

      const rawMobile = record.mobile || "";
      const normalizedMobile = normalizePhone(rawMobile);
      const phoneDigits = extractPhoneDigits(rawMobile);
      record.mobile = normalizedMobile;
      record.phoneDigits = phoneDigits;

      const email = (record.email || "").toLowerCase().trim();
      record.email = email;

      record.dob = parseFlexibleDate(record.dob);
      record.gender = normalizeGender(record.gender);
      record.bloodGroup = normalizeBloodGroup(record.bloodGroup);

      const matchedPlan = matchPlan(record.planName);
      record.matchedPlan = matchedPlan
        ? {
            id: matchedPlan.id,
            name: matchedPlan.name,
            durationMonths: matchedPlan.durationMonths,
            price: matchedPlan.price,
            formattedPrice: matchedPlan.formattedPrice,
          }
        : null;

      const matchedBatch = matchBatch(record.batchName);
      record.matchedBatch = matchedBatch
        ? {
            id: matchedBatch.id,
            name: matchedBatch.name,
            timingLabel: matchedBatch.timingLabel,
          }
        : null;

      const errors = [];
      const warnings = [];

      if (!fullName) errors.push("Full Name is required.");
      if (!email) {
        errors.push("Email Address is required.");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email format: "${email}".`);
      }

      if (!rawMobile) {
        errors.push("Phone Number is required.");
      } else if (!phoneDigits || phoneDigits.length < 10) {
        errors.push(`Phone number must contain at least 10 digits (got "${rawMobile}").`);
      }

      if (record.planName && !matchedPlan) {
        warnings.push(`Plan "${record.planName}" was not found in CRM. Will default to General Access.`);
      }

      if (record.batchName && !matchedBatch) {
        warnings.push(`Batch "${record.batchName}" was not found in CRM. Will default to General Access.`);
      }

      let isFileDuplicate = false;
      if (phoneDigits && seenPhonesInFile.has(phoneDigits)) {
        isFileDuplicate = true;
        errors.push(`Duplicate phone number in file (matches Row ${seenPhonesInFile.get(phoneDigits)}).`);
      } else if (phoneDigits) {
        seenPhonesInFile.set(phoneDigits, rowNumber);
      }

      if (email && seenEmailsInFile.has(email)) {
        isFileDuplicate = true;
        errors.push(`Duplicate email in file (matches Row ${seenEmailsInFile.get(email)}).`);
      } else if (email) {
        seenEmailsInFile.set(email, rowNumber);
      }

      let dbMatch = null;
      let matchedBy = null;

      if (record.id && memberById.has(record.id.toUpperCase())) {
        dbMatch = memberById.get(record.id.toUpperCase());
        matchedBy = `Existing Member ID (${record.id})`;
      } else if (phoneDigits && memberByPhone.has(phoneDigits)) {
        dbMatch = memberByPhone.get(phoneDigits);
        matchedBy = `Phone Number (${normalizedMobile})`;
      } else if (email && memberByEmail.has(email)) {
        dbMatch = memberByEmail.get(email);
        matchedBy = `Email Address (${email})`;
      }

      const item = {
        rowNumber,
        data: record,
        rawRow,
        errors,
        warnings,
        hasError: errors.length > 0,
        isFileDuplicate,
        isExistingMember: Boolean(dbMatch),
        matchedBy,
        existingMember: dbMatch
          ? {
              id: dbMatch.id,
              fullName: dbMatch.fullName || `${dbMatch.firstName} ${dbMatch.lastName}`,
              email: dbMatch.email,
              mobile: dbMatch.mobile,
              batchName: dbMatch.batchName || dbMatch.assignedBatch,
              planName: dbMatch.membershipPlan?.name,
            }
          : null,
        action: dbMatch ? "SKIP" : errors.length > 0 ? "EXCLUDE" : "CREATE",
      };

      if (item.hasError) {
        issueRecords.push(item);
      } else if (item.isExistingMember) {
        existingRecords.push(item);
      } else {
        readyRecords.push(item);
      }
    });

    return {
      summary: {
        totalRows: rows.length,
        readyCount: readyRecords.length,
        existingCount: existingRecords.length,
        issueCount: issueRecords.length,
      },
      records: {
        ready: readyRecords,
        existing: existingRecords,
        issues: issueRecords,
      },
      availablePlans: dbPlans,
      availableBatches: dbBatches,
    };
  }

  async executeImport({
    records,
    customMappingsToSave,
    adminUser,
    sourceFilename = "member_import.xlsx",
    fileSize = 0,
  }) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestError("No records provided for execution.");
    }

    const importId = generateImportId();
    const createdMemberIds = [];
    const updatedMemberIds = [];
    const skippedMemberIds = [];
    const errors = [];

    let maxSuffix = await memberRepository.getMaxIdSuffix();

    for (const item of records) {
      const { rowNumber, action, data } = item;

      if (!action || action === "SKIP" || action === "EXCLUDE") {
        if (item.existingMember?.id) {
          skippedMemberIds.push(item.existingMember.id);
        }
        continue;
      }

      try {
        if (action === "CREATE") {
          maxSuffix += 1;
          const memberId = generateMemberId(maxSuffix - 1);

          const heightStr = data.height ? `${data.height} cm` : "";
          const weightStr = data.weight ? `${data.weight} kg` : "";
          const bmi = calculateBmi(data.height, data.weight);

          const physicalStats = {
            height: heightStr,
            weight: weightStr,
            bmi: bmi ? String(bmi) : "",
            bloodGroup: data.bloodGroup || "",
          };

          const emergencyContact = {
            name: data.emergencyName || "",
            phone: data.emergencyPhone ? normalizePhone(data.emergencyPhone) : "",
            relation: data.emergencyRelation || "",
          };

          const batchId = data.matchedBatch?.id || "";
          const batchName = data.matchedBatch?.name || (batchId ? "Assigned" : "");
          const batchTiming = data.matchedBatch?.timingLabel || "";
          const assignedBatch = batchName || "General Access";

          const newMember = new Member({
            id: memberId,
            fullName: data.fullName,
            firstName: data.firstName || data.fullName.split(" ")[0],
            lastName: data.lastName || (data.fullName.split(" ").slice(1).join(" ") || "Member"),
            email: data.email.toLowerCase().trim(),
            mobile: data.mobile.trim(),
            gender: data.gender || "Other",
            dob: data.dob || "2000-01-01",
            instagramProfileId: data.instagramProfileId || "",
            height: heightStr,
            weight: weightStr,
            bloodGroup: data.bloodGroup || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "India",
            pincode: data.pincode || "",
            bio: data.bio || "",
            status: MEMBER_STATUS.ACTIVE,
            isDeleted: false,
            deletedAt: null,
            batchId,
            batchName,
            batchTiming,
            assignedBatch,
            physicalStats,
            emergencyName: data.emergencyName || "",
            emergencyPhone: data.emergencyPhone || "",
            emergencyRelation: data.emergencyRelation || "",
            emergencyContact,
            membershipPlan: data.matchedPlan
              ? {
                  id: data.matchedPlan.id,
                  name: data.matchedPlan.name,
                  durationMonths: data.matchedPlan.durationMonths,
                  price: data.matchedPlan.price,
                  formattedPrice: data.matchedPlan.formattedPrice,
                  startDate: new Date(),
                  endDate: new Date(Date.now() + (data.matchedPlan.durationMonths || 1) * 30 * 24 * 60 * 60 * 1000),
                }
              : null,
            registeredAt: new Date(),
          });

          await newMember.save();
          createdMemberIds.push(memberId);

          if (batchId) {
            await Batch.findOneAndUpdate(
              { id: batchId },
              {
                $addToSet: { memberIds: memberId },
                $inc: { currentPax: 1 },
              }
            );
          }
        } else if (action === "UPDATE") {
          const targetId = item.existingMember?.id || data.id;
          if (!targetId) {
            throw new Error("Missing member ID for update action.");
          }

          const existing = await Member.findOne({ id: targetId });
          if (!existing) {
            throw new Error(`Member with ID "${targetId}" not found for update.`);
          }

          const updates = {};

          if (data.fullName && data.fullName !== existing.fullName) {
            updates.fullName = data.fullName;
            if (data.firstName) updates.firstName = data.firstName;
            if (data.lastName) updates.lastName = data.lastName;
          }
          if (data.mobile && data.mobile !== existing.mobile) updates.mobile = data.mobile;
          if (data.email && data.email !== existing.email) updates.email = data.email;
          if (data.gender && data.gender !== existing.gender) updates.gender = data.gender;
          if (data.dob && data.dob !== existing.dob) updates.dob = data.dob;
          if (data.bloodGroup) updates.bloodGroup = data.bloodGroup;
          if (data.address) updates.address = data.address;
          if (data.city) updates.city = data.city;
          if (data.state) updates.state = data.state;
          if (data.pincode) updates.pincode = data.pincode;
          if (data.instagramProfileId) updates.instagramProfileId = data.instagramProfileId;
          if (data.bio) updates.bio = data.bio;

          if (data.height || data.weight || data.bloodGroup) {
            const h = data.height ? `${data.height} cm` : existing.physicalStats?.height || "";
            const w = data.weight ? `${data.weight} kg` : existing.physicalStats?.weight || "";
            const bmi = calculateBmi(data.height || existing.physicalStats?.height, data.weight || existing.physicalStats?.weight);
            updates.physicalStats = {
              height: h,
              weight: w,
              bmi: bmi ? String(bmi) : existing.physicalStats?.bmi || "",
              bloodGroup: data.bloodGroup || existing.physicalStats?.bloodGroup || "",
            };
          }

          if (data.emergencyName || data.emergencyPhone || data.emergencyRelation) {
            updates.emergencyName = data.emergencyName || existing.emergencyName;
            updates.emergencyPhone = data.emergencyPhone || existing.emergencyPhone;
            updates.emergencyRelation = data.emergencyRelation || existing.emergencyRelation;
            updates.emergencyContact = {
              name: updates.emergencyName,
              phone: updates.emergencyPhone,
              relation: updates.emergencyRelation,
            };
          }

          if (data.matchedBatch && data.matchedBatch.id !== existing.batchId) {
            const oldBatchId = existing.batchId;
            const newBatchId = data.matchedBatch.id;

            updates.batchId = newBatchId;
            updates.batchName = data.matchedBatch.name;
            updates.batchTiming = data.matchedBatch.timingLabel || "";
            updates.assignedBatch = data.matchedBatch.name;

            if (oldBatchId) {
              await Batch.findOneAndUpdate(
                { id: oldBatchId },
                {
                  $pull: { memberIds: targetId },
                  $inc: { currentPax: -1 },
                }
              );
            }
            await Batch.findOneAndUpdate(
              { id: newBatchId },
              {
                $addToSet: { memberIds: targetId },
                $inc: { currentPax: 1 },
              }
            );
          }

          if (data.matchedPlan && data.matchedPlan.id !== existing.membershipPlan?.id) {
            updates.membershipPlan = {
              id: data.matchedPlan.id,
              name: data.matchedPlan.name,
              durationMonths: data.matchedPlan.durationMonths,
              price: data.matchedPlan.price,
              formattedPrice: data.matchedPlan.formattedPrice,
              startDate: new Date(),
              endDate: new Date(Date.now() + (data.matchedPlan.durationMonths || 1) * 30 * 24 * 60 * 60 * 1000),
            };
          }

          updates.updatedAt = new Date();
          await Member.updateOne({ id: targetId }, { $set: updates });
          updatedMemberIds.push(targetId);
        }
      } catch (err) {
        errors.push({
          rowNumber,
          identifier: data.fullName || data.email || data.mobile || `Row ${rowNumber}`,
          fullName: data.fullName || "",
          email: data.email || "",
          mobile: data.mobile || "",
          reason: err.message || "Failed to process record.",
          raw: data,
        });
      }
    }

    if (customMappingsToSave && Object.keys(customMappingsToSave).length > 0) {
      await MemberImportConfig.findOneAndUpdate(
        { key: "default" },
        { $set: { customMappings: customMappingsToSave, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    const totalProcessed = records.length;
    const createdCount = createdMemberIds.length;
    const updatedCount = updatedMemberIds.length;
    const skippedCount = skippedMemberIds.length;
    const failedCount = errors.length;

    const overallStatus =
      failedCount === 0 ? "COMPLETED" : createdCount + updatedCount > 0 ? "PARTIAL" : "FAILED";

    const historyDoc = new MemberImportHistory({
      importId,
      adminId: adminUser?.id || "",
      adminName: adminUser?.name || adminUser?.fullName || "Admin",
      adminEmail: adminUser?.email || "",
      sourceFilename,
      fileSize,
      totalRows: totalProcessed,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      createdMemberIds,
      updatedMemberIds,
      skippedMemberIds,
      errors,
      status: overallStatus,
      notes: `Imported ${createdCount} new, updated ${updatedCount}, skipped ${skippedCount}, failed ${failedCount}.`,
    });

    await historyDoc.save();

    return {
      importId,
      totalRows: totalProcessed,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      status: overallStatus,
      errors,
      createdMemberIds,
      updatedMemberIds,
    };
  }

  async getHistory({ page = 1, pageSize = 10 } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(pageSize, 10) || 10));
    const skip = (p - 1) * limit;

    const [total, list] = await Promise.all([
      MemberImportHistory.countDocuments(),
      MemberImportHistory.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      data: list,
      pagination: {
        total,
        page: p,
        pageSize: limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async generateErrorReportCsv(historyId) {
    const history = await MemberImportHistory.findOne({ importId: historyId }).lean();
    if (!history) {
      throw new NotFoundError(`Import record "${historyId}" not found.`);
    }

    if (!history.errors || history.errors.length === 0) {
      throw new BadRequestError("This import has no logged errors.");
    }

    const headers = [
      "Row Number",
      "Identifier",
      "Full Name",
      "Phone Number",
      "Email Address",
      "Failure Reason",
    ];

    const rows = history.errors.map((e) => [
      e.rowNumber,
      `"${String(e.identifier || "").replace(/"/g, '""')}"`,
      `"${String(e.fullName || "").replace(/"/g, '""')}"`,
      `"${String(e.mobile || "").replace(/"/g, '""')}"`,
      `"${String(e.email || "").replace(/"/g, '""')}"`,
      `"${String(e.reason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return {
      buffer: Buffer.from(csvContent, "utf8"),
      filename: `Error_Report_${historyId}.csv`,
    };
  }
}

module.exports = new MemberImportService();
