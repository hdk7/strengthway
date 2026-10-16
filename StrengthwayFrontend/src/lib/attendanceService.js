/**
 * Attendance Service — API Layer
 *
 * All attendance tracking data is persisted to / retrieved from the Strengthway backend API.
 * Supports:
 * - Single and bulk attendance marking with flexible batch attendee indicators
 * - Batch monthly attendance matrix (primary members + inbound flex attendees)
 * - Individual member attendance history
 * - Trainer class conduction and hours logs
 *
 * Backend base: /api/v1/attendance
 */

import { api } from "@/lib/apiClient";

/**
 * Retrieves the full attendance grid/matrix for a batch for any given month.
 * Returns combined list of primary enrolled members and inbound flex members,
 * plus attendance records mapped by memberId and date.
 *
 * @param {string} batchId
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @returns {Promise<object>} { batchId, batchName, monthYear, daysInMonth, members, matrix, sessions }
 */
export async function getBatchAttendanceGrid(batchId, yearMonth) {
  if (!batchId) return null;
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  return api.get(`/v1/attendance/batch/${encodeURIComponent(batchId)}?month=${encodeURIComponent(ym)}`);
}

/**
 * Marks or updates attendance for a single member on a date.
 *
 * @param {object} payload
 * @param {string} payload.date YYYY-MM-DD
 * @param {string} payload.batchId
 * @param {string} payload.memberId
 * @param {string} [payload.memberName]
 * @param {string} [payload.sessionId]
 * @param {"PRESENT" | "CHECKED_IN" | "CHECKED_OUT" | "ABSENT" | "LATE" | "EXCUSED"} payload.status
 * @param {boolean} [payload.isFlexAttendance]
 * @param {string} [payload.originalPrimaryBatchId]
 * @param {string} [payload.assignmentId]
 * @param {string} [payload.checkInTime]
 * @param {string} [payload.checkOutTime]
 * @param {string} [payload.trainerId]
 * @param {string} [payload.markedBy]
 * @param {string} [payload.notes]
 * @returns {Promise<object>} Created / updated attendance record
 */
export async function markAttendance(payload) {
  return api.post("/v1/attendance/mark", payload);
}

/**
 * Bulk marks attendance for multiple members attending a class session or date.
 *
 * @param {object} payload
 * @param {string} payload.date YYYY-MM-DD
 * @param {string} payload.batchId
 * @param {string} [payload.sessionId]
 * @param {string} [payload.trainerId]
 * @param {string} [payload.markedBy]
 * @param {Array<{
 *   memberId: string,
 *   memberName?: string,
 *   status: "PRESENT" | "CHECKED_IN" | "CHECKED_OUT" | "ABSENT" | "LATE" | "EXCUSED",
 *   isFlexAttendance?: boolean,
 *   originalPrimaryBatchId?: string,
 *   assignmentId?: string,
 *   checkInTime?: string,
 *   checkOutTime?: string,
 *   notes?: string
 * }>} payload.attendees
 * @returns {Promise<{ count: number, records: object[] }>}
 */
export async function bulkMarkAttendance(payload) {
  return api.post("/v1/attendance/bulk-mark", payload);
}

/**
 * Retrieves attendance records for an individual member.
 *
 * @param {string} memberId
 * @param {string} [yearMonth] Optional YYYY-MM filter
 * @returns {Promise<object[]>}
 */
export async function getMemberAttendanceHistory(memberId, yearMonth) {
  if (!memberId) return [];
  const query = yearMonth ? `?month=${encodeURIComponent(yearMonth)}` : "";
  return api.get(`/v1/attendance/member/${encodeURIComponent(memberId)}${query}`);
}

/**
 * Records or updates a trainer class conduction log.
 *
 * @param {object} payload
 * @param {string} payload.date YYYY-MM-DD
 * @param {string} payload.trainerId
 * @param {string} [payload.trainerName]
 * @param {string} payload.batchId
 * @param {string} [payload.sessionId]
 * @param {"CONDUCTED" | "SUBSTITUTE" | "ABSENT" | "LEAVE"} [payload.status="CONDUCTED"]
 * @param {string} [payload.substituteTrainerId]
 * @param {string} [payload.checkInTime]
 * @param {number} [payload.durationMinutes=60]
 * @param {number} [payload.attendeesCount=0]
 * @param {string} [payload.notes]
 * @returns {Promise<object>}
 */
export async function recordTrainerLog(payload) {
  return api.post("/v1/attendance/trainer-logs", payload);
}

/**
 * Retrieves trainer class conduction logs for an individual trainer.
 *
 * @param {string} trainerId
 * @param {string} [yearMonth] Optional YYYY-MM filter
 * @returns {Promise<object[]>}
 */
export async function getTrainerAttendanceHistory(trainerId, yearMonth) {
  if (!trainerId) return [];
  const query = yearMonth ? `?month=${encodeURIComponent(yearMonth)}` : "";
  return api.get(`/v1/attendance/trainer-logs/${encodeURIComponent(trainerId)}${query}`);
}

/**
 * Retrieves all trainer conduction logs matching query filters.
 *
 * @param {object} [params]
 * @param {string} [params.date] YYYY-MM-DD
 * @param {string} [params.month] YYYY-MM
 * @param {string} [params.trainerId]
 * @returns {Promise<object[]>}
 */
export async function getAllTrainerLogs(params = {}) {
  const q = new URLSearchParams();
  if (params.date) q.append("date", params.date);
  if (params.month) q.append("month", params.month);
  if (params.trainerId && params.trainerId !== "all") q.append("trainerId", params.trainerId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/attendance/trainer-logs${qs}`);
}

/**
 * Retrieves attendance records matching query filters.
 *
 * @param {object} [params]
 * @param {string} [params.date] YYYY-MM-DD
 * @param {string} [params.batchId]
 * @param {string} [params.month] YYYY-MM
 * @param {string} [params.memberId]
 * @returns {Promise<object[]>}
 */
export async function getDailyAttendanceRecords(params = {}) {
  const q = new URLSearchParams();
  if (params.date) q.append("date", params.date);
  if (params.batchId && params.batchId !== "all") q.append("batchId", params.batchId);
  if (params.month) q.append("month", params.month);
  if (params.memberId) q.append("memberId", params.memberId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/attendance${qs}`);
}

/**
 * Initiates check-in for a trainer session or consecutive session block.
 *
 * @param {object} payload
 * @param {string} payload.trainerId
 * @param {string} payload.date
 * @param {string} [payload.sessionId]
 * @param {string} [payload.batchId]
 * @param {string} [payload.checkInTime]
 * @param {boolean} [payload.isAdminOverride]
 * @param {string} [payload.overrideReason]
 * @returns {Promise<object>}
 */
export async function trainerCheckIn(payload) {
  return api.post("/v1/attendance/trainer-checkin", payload);
}

/**
 * Completes check-out for a trainer session or continuous session interval,
 * calculating actual presence and scheduled teaching duration.
 *
 * @param {object} payload
 * @param {string} payload.trainerId
 * @param {string} payload.date
 * @param {string} [payload.intervalId]
 * @param {string} [payload.sessionId]
 * @param {string} [payload.checkOutTime]
 * @param {boolean} [payload.isAdminOverride]
 * @param {string} [payload.overrideReason]
 * @returns {Promise<object>}
 */
export async function trainerCheckOut(payload) {
  return api.post("/v1/attendance/trainer-checkout", payload);
}

/**
 * Retrieves a trainer's scheduled sessions on a given date, grouped by consecutive blocks.
 *
 * @param {string} trainerId
 * @param {string} [date] YYYY-MM-DD
 * @returns {Promise<object>}
 */
export async function getTrainerDailySchedule(trainerId, date) {
  if (!trainerId) return null;
  const d = date || new Date().toISOString().slice(0, 10);
  return api.get(`/v1/attendance/trainer-schedule/${encodeURIComponent(trainerId)}?date=${encodeURIComponent(d)}`);
}

/**
 * Retrieves continuous attendance intervals for trainers.
 *
 * @param {object} [params]
 * @param {string} [params.trainerId]
 * @param {string} [params.date]
 * @param {string} [params.month]
 * @returns {Promise<object[]>}
 */
export async function getTrainerIntervals(params = {}) {
  const q = new URLSearchParams();
  if (params.trainerId && params.trainerId !== "all") q.append("trainerId", params.trainerId);
  if (params.date) q.append("date", params.date);
  if (params.month) q.append("month", params.month);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/attendance/trainer-intervals${qs}`);
}

/**
 * Administrative override / correction for member attendance with mandatory reason.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function adminOverrideMemberAttendance(payload) {
  return api.post("/v1/attendance/admin/override-member", payload);
}

/**
 * Administrative override / correction for trainer attendance with mandatory reason.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function adminOverrideTrainerAttendance(payload) {
  return api.post("/v1/attendance/admin/override-trainer", payload);
}

/**
 * Transitions trainer attendance to the next consecutive scheduled session ("Add Another Session").
 * Closes the current session interval and initiates check-in for the next eligible class.
 *
 * @param {object} payload
 * @param {string} payload.trainerId
 * @param {string} payload.date
 * @param {string} payload.currentSessionId
 * @param {string} payload.nextSessionId
 * @param {string} [payload.transitionTime]
 * @returns {Promise<object>}
 */
export async function trainerAddAnotherSession(payload) {
  return api.post("/v1/attendance/trainer/add-another-session", payload);
}

/**
 * Triggers backend processing for automatic member check-outs for expired class sessions.
 *
 * @param {object} [payload]
 * @param {string} [payload.date]
 * @param {string} [payload.batchId]
 * @returns {Promise<{ count: number, records: object[] }>}
 */
export async function processMemberAutoCheckouts(payload = {}) {
  return api.post("/v1/attendance/process-auto-checkouts", payload);
}

/**
 * Admin manual correction when a trainer forgot "Add Another Session",
 * calculating accurate session overlaps and recording audit trail.
 *
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function adminCorrectContinuousSession(payload) {
  return api.post("/v1/attendance/admin/correct-continuous-session", payload);
}

/**
 * Retrieves attendance audit logs.
 *
 * @param {object} [params]
 * @returns {Promise<object[]>}
 */
export async function getAttendanceAuditLogs(params = {}) {
  const q = new URLSearchParams();
  if (params.attendanceType) q.append("attendanceType", params.attendanceType);
  if (params.date) q.append("date", params.date);
  if (params.memberId) q.append("memberId", params.memberId);
  if (params.trainerId) q.append("trainerId", params.trainerId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/attendance/audit-logs${qs}`);
}

export default {
  getBatchAttendanceGrid,
  markAttendance,
  bulkMarkAttendance,
  getMemberAttendanceHistory,
  recordTrainerLog,
  getTrainerAttendanceHistory,
  getAllTrainerLogs,
  getDailyAttendanceRecords,
  trainerCheckIn,
  trainerCheckOut,
  trainerAddAnotherSession,
  processMemberAutoCheckouts,
  adminCorrectContinuousSession,
  getTrainerDailySchedule,
  getTrainerIntervals,
  adminOverrideMemberAttendance,
  adminOverrideTrainerAttendance,
  getAttendanceAuditLogs,
};
