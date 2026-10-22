import { api, getAuthToken } from "@/lib/apiClient";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

/**
 * Fetch Google Form template URL, CRM fields catalog, and active plans/batches.
 */
export async function getImportConfig() {
  return api.get("/v1/member-import/config");
}

/**
 * Update custom Google Form URL or saved mappings.
 */
export async function updateImportConfig(data) {
  return api.put("/v1/member-import/config", data);
}

/**
 * Download sample template (Excel .xlsx or CSV).
 */
export async function downloadImportTemplate(format = "xlsx") {
  const token = getAuthToken();
  const url = `${BASE_URL}/v1/member-import/template?format=${format}`;

  const response = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to download template.");
  }

  const blob = await response.blob();
  const filename =
    format === "csv"
      ? "StrengthWay_Member_Import_Template.csv"
      : "StrengthWay_Member_Import_Template.xlsx";

  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Upload an Excel or CSV file to parse headers and rows.
 * @param {File} file
 */
export async function uploadAndParseImportFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api.upload("/v1/member-import/parse", formData);
}

/**
 * Validate parsed rows against CRM plans, batches, and existing members.
 * @param {Array} rows
 * @param {Object} mappings
 */
export async function validateImportRows(rows, mappings) {
  return api.post("/v1/member-import/validate", { rows, mappings });
}

/**
 * Execute the bulk import after admin review.
 * @param {Object} payload { records, customMappingsToSave, sourceFilename, fileSize }
 */
export async function executeMemberImport(payload) {
  return api.post("/v1/member-import/execute", payload);
}

/**
 * Fetch paginated past import history.
 */
export async function getImportHistory(page = 1, pageSize = 10) {
  return api.get(`/v1/member-import/history?page=${page}&pageSize=${pageSize}`);
}

/**
 * Download error report CSV for a past import.
 */
export async function downloadErrorReport(importId) {
  const token = getAuthToken();
  const url = `${BASE_URL}/v1/member-import/history/${importId}/error-report`;

  const response = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to download error report.");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `Error_Report_${importId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
