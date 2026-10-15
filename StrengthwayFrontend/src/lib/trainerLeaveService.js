/**
 * Trainer Leave Service — API Layer
 *
 * Dedicated client for trainer leave applications, status approvals,
 * and advance-notice policy enforcement records.
 *
 * Backend base: /api/v1/trainer-leaves
 */

import { api } from "@/lib/apiClient";

/**
 * Retrieves trainer leave requests with optional filters.
 *
 * @param {object} [params]
 * @param {string} [params.trainerId]
 * @param {string} [params.status] "PENDING" | "APPROVED" | "DENIED" | "CANCELLED"
 * @param {string} [params.leaveType] "REGULAR" | "EMERGENCY"
 * @param {string} [params.month] YYYY-MM
 * @param {string} [params.startDate] YYYY-MM-DD
 * @param {string} [params.endDate] YYYY-MM-DD
 * @param {string} [params.search] Search query
 * @returns {Promise<object[]>} Array of leave request documents
 */
export async function getTrainerLeaves(params = {}) {
  const q = new URLSearchParams();
  if (params.trainerId && params.trainerId !== "all") q.append("trainerId", params.trainerId);
  if (params.status && params.status !== "all" && params.status !== "ALL") q.append("status", params.status);
  if (params.leaveType && params.leaveType !== "all" && params.leaveType !== "ALL") q.append("leaveType", params.leaveType);
  if (params.month) q.append("month", params.month);
  if (params.startDate) q.append("startDate", params.startDate);
  if (params.endDate) q.append("endDate", params.endDate);
  if (params.search) q.append("search", params.search);

  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/trainer-leaves${qs}`);
}

/**
 * Retrieves a single trainer leave request by ID.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getTrainerLeaveById(id) {
  if (!id) return null;
  return api.get(`/v1/trainer-leaves/${encodeURIComponent(id)}`);
}

/**
 * Submits a new trainer leave request.
 *
 * @param {object} payload
 * @param {string} payload.trainerId
 * @param {string} [payload.trainerName]
 * @param {"REGULAR" | "EMERGENCY"} [payload.leaveType="REGULAR"]
 * @param {string} payload.leaveStartDate YYYY-MM-DD
 * @param {string} payload.leaveEndDate YYYY-MM-DD
 * @param {string} [payload.submittedOn] YYYY-MM-DD
 * @param {string} [payload.reason]
 * @param {boolean} [payload.allowPolicyOverride]
 * @param {string} [payload.overrideReason]
 * @returns {Promise<object>} Created leave request
 */
export async function createTrainerLeave(payload) {
  return api.post("/v1/trainer-leaves", payload);
}

/**
 * Updates status of a trainer leave request (approve / deny / cancel).
 *
 * @param {string} id
 * @param {object} updateData
 * @param {"APPROVED" | "DENIED" | "REJECTED" | "CANCELLED"} updateData.status
 * @param {string} [updateData.approvedStartDate] Optional adjusted approval start date
 * @param {string} [updateData.approvedEndDate] Optional adjusted approval end date
 * @param {string} [updateData.reviewNote] Remarks / justification
 * @returns {Promise<object>}
 */
export async function updateTrainerLeaveStatus(id, updateData) {
  if (!id) throw new Error("Leave request ID is required.");
  return api.patch(`/v1/trainer-leaves/${encodeURIComponent(id)}/status`, updateData);
}

/**
 * Cancels a trainer leave request.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function cancelTrainerLeave(id) {
  if (!id) throw new Error("Leave request ID is required.");
  return api.delete(`/v1/trainer-leaves/${encodeURIComponent(id)}`);
}

/**
 * Retrieves batch sessions affected by a trainer's leave window.
 *
 * @param {string} id
 * @returns {Promise<object>} { leave, sessions, totalSessionsCount }
 */
export async function getLeaveAffectedSessions(id) {
  if (!id) throw new Error("Leave request ID is required.");
  return api.get(`/v1/trainer-leaves/${encodeURIComponent(id)}/affected-sessions`);
}

/**
 * Retrieves monthly trainer leave summary aggregation with balances and deductions.
 *
 * @param {string} [month] YYYY-MM
 * @returns {Promise<object>}
 */
export async function getTrainerLeaveMonthlySummary(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return api.get(`/v1/trainer-leaves/monthly-summary${qs}`);
}

/**
 * Retrieves annual trainer leave summary aggregation with balances and LOP deductions.
 *
 * @param {object} [params]
 * @param {number|string} [params.year] YYYY
 * @param {string} [params.trainerId]
 * @returns {Promise<object>}
 */
export async function getTrainerLeaveAnnualSummary(params = {}) {
  const q = new URLSearchParams();
  if (params.year) q.append("year", params.year);
  if (params.trainerId && params.trainerId !== "all") q.append("trainerId", params.trainerId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/trainer-leaves/annual-summary${qs}`);
}

export default {
  getTrainerLeaves,
  getTrainerLeaveById,
  createTrainerLeave,
  updateTrainerLeaveStatus,
  cancelTrainerLeave,
  getLeaveAffectedSessions,
  getTrainerLeaveMonthlySummary,
  getTrainerLeaveAnnualSummary,
};
