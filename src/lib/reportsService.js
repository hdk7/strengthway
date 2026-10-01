/**
 * Reports Service — API Layer & Analytics Client
 *
 * Fetches monthly reports and analytics from the Strengthway backend API:
 * 1. Batch-wise Monthly Summary Report
 * 2. Member-wise Monthly Attendance & Compliance Report
 * 3. Trainer-wise Monthly Performance & Conduction Report
 * 4. Scheduled Class Monthly Progression Report
 *
 * Includes CSV export utility for all 4 report types.
 *
 * Backend base: /api/v1/reports
 */

import { api } from "@/lib/apiClient";

/**
 * 1. Retrieves Batch-wise Monthly Summary Report.
 *
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @param {string} [batchId] Optional specific batchId or "ALL"
 * @returns {Promise<object>}
 */
export async function getMonthlyBatchReport(yearMonth, batchId = "ALL") {
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  const params = new URLSearchParams({ month: ym });
  if (batchId && batchId !== "ALL") {
    params.set("batchId", batchId);
  }
  return api.get(`/v1/reports/monthly-batch-summary?${params.toString()}`);
}

/**
 * 2. Retrieves Member-wise Monthly Attendance & Compliance Report.
 *
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @param {string} [statusFilter="All"] "All" | "Active" | "Inactive" | "Lead"
 * @returns {Promise<object>}
 */
export async function getMonthlyMemberReport(yearMonth, statusFilter = "All") {
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  const params = new URLSearchParams({ month: ym });
  if (statusFilter && statusFilter !== "All") {
    params.set("status", statusFilter);
  }
  return api.get(`/v1/reports/monthly-member-summary?${params.toString()}`);
}

/**
 * 3. Retrieves Trainer-wise Monthly Performance & Output Report.
 *
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @returns {Promise<object>}
 */
export async function getMonthlyTrainerReport(yearMonth) {
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  return api.get(`/v1/reports/monthly-trainer-summary?month=${encodeURIComponent(ym)}`);
}

/**
 * 4. Retrieves Scheduled Class Monthly Progression Report.
 *
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @param {string} [scheduleId] Optional master schedule ID filter
 * @returns {Promise<object>}
 */
export async function getMonthlyClassReport(yearMonth, scheduleId = null) {
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  const params = new URLSearchParams({ month: ym });
  if (scheduleId) {
    params.set("scheduleId", scheduleId);
  }
  return api.get(`/v1/reports/monthly-class-summary?${params.toString()}`);
}

// ─── CSV Export Utility ────────────────────────────────────────────────────────

/**
 * Converts array of objects to CSV string and initiates browser download.
 * Supports both exportReportToCsv(reportType, rows, filename) and exportReportToCsv(reportType, { rows, filename }).
 *
 * @param {string} reportType e.g., "batch-summary", "member-compliance", "trainer-performance", "class-tracking"
 * @param {Array<object>|{ rows: Array<object>, filename?: string }} rowsOrParams Data rows or params object
 * @param {string} [customFilename] Optional custom filename
 */
export function exportReportToCsv(reportType, rowsOrParams, customFilename) {
  const rows = Array.isArray(rowsOrParams)
    ? rowsOrParams
    : rowsOrParams?.rows || rowsOrParams?.data || [];

  const filename = typeof rowsOrParams === "object" && !Array.isArray(rowsOrParams) && rowsOrParams?.filename
    ? rowsOrParams.filename
    : customFilename;

  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn("No rows to export to CSV.");
    return false;
  }

  // Extract column headers
  const headers = Object.keys(rows[0]);
  const csvLines = [];

  // Header line
  csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

  // Value rows
  for (const row of rows) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvLines.push(values.join(","));
  }

  const csvString = csvLines.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `strengthway_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename || defaultFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

export default {
  getMonthlyBatchReport,
  getMonthlyMemberReport,
  getMonthlyTrainerReport,
  getMonthlyClassReport,
  exportReportToCsv,
};
