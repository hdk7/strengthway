/* eslint-disable max-lines */
/**
 * Batches Service — API Layer
 *
 * All business data is fetched from / persisted to the Strengthway backend API.
 * No localStorage is used for batch data, coach shifts, or scheduled classes.
 *
 * Backend base: /api/v1/batches
 */

import { api } from "@/lib/apiClient";
import { getTrainers, SEED_TRAINERS } from "./trainersService";
import { getMembers } from "./membersService";

export const SHIFT_SLOTS = [
  {
    key: "6_00_am_mwf",
    label: "6.00 am MWF",
    time: "06:00 AM - 07:00 AM",
    days: "MWF",
    batchId: "BATCH-01",
  },
  {
    key: "8_00_am_mwf",
    label: "8.00am MWF",
    time: "08:00 AM - 09:00 AM",
    days: "MWF",
    batchId: "BATCH-02",
  },
  {
    key: "6_00_am_tts",
    label: "6 am TTS",
    time: "06:00 AM - 07:00 AM",
    days: "TTS",
    batchId: "BATCH-04",
  },
  {
    key: "8_00_am_tts",
    label: "8 AM TTS",
    time: "08:00 AM - 09:00 AM",
    days: "TTS",
    batchId: "BATCH-05",
  },
  {
    key: "6_30_pm_mwf",
    label: "6.30 PM MWF",
    time: "06:30 PM - 07:30 PM",
    days: "MWF",
    batchId: "BATCH-03",
  },
  {
    key: "8_00_pm_mwf",
    label: "8 00 PM MWF",
    time: "08:00 PM - 09:00 PM",
    days: "MWF",
    batchId: "BATCH-06",
  },
];

// Pure schedule utility
export function resolveDaysDetails(daysPattern, customLabel, customList) {
  const p = (daysPattern || "MWF").trim();
  if (p === "MWF") {
    return {
      daysPattern: "MWF",
      daysLabel: "Monday • Wednesday • Friday",
      daysList: ["Monday", "Wednesday", "Friday"],
    };
  }
  if (p === "TTS") {
    return {
      daysPattern: "TTS",
      daysLabel: "Tuesday • Thursday • Saturday",
      daysList: ["Tuesday", "Thursday", "Saturday"],
    };
  }
  if (p === "Mon - Fri" || p === "WEEKDAYS") {
    return {
      daysPattern: "Mon - Fri",
      daysLabel: "Monday to Friday (Weekdays)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };
  }
  if (p === "Mon - Sat" || p === "6DAYS") {
    return {
      daysPattern: "Mon - Sat",
      daysLabel: "Monday to Saturday (6 Days)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    };
  }
  if (p === "Daily" || p === "DAILY") {
    return {
      daysPattern: "Daily",
      daysLabel: "Monday to Sunday (All 7 Days)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    };
  }
  if (p === "Weekend" || p === "WEEKEND") {
    return {
      daysPattern: "Weekend",
      daysLabel: "Saturday • Sunday (Weekend)",
      daysList: ["Saturday", "Sunday"],
    };
  }

  if (customLabel && customList && Array.isArray(customList) && customList.length > 0) {
    return {
      daysPattern: daysPattern || "CUSTOM",
      daysLabel: customLabel,
      daysList: customList,
    };
  }

  return {
    daysPattern: p,
    daysLabel: customLabel || p,
    daysList: customList && customList.length > 0 ? customList : [p],
  };
}

// ── Batches Read ─────────────────────────────────────────────────────────────

/**
 * Fetch all training batches from backend API.
 *
 * @param {string} [status] Optional filter ("Active" | "Inactive")
 * @returns {Promise<object[]>}
 */
export async function getBatches(status) {
  try {
    const query = status && status !== "ALL" && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
    const result = await api.get(`/v1/batches${query}`);
    if (Array.isArray(result)) return result;
    if (result?.data && Array.isArray(result.data)) return result.data;
    return [];
  } catch (err) {
    console.error("Failed to fetch batches:", err);
    return [];
  }
}

/**
 * Fetch a single batch by ID.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getBatchById(id) {
  if (!id) return null;
  try {
    return await api.get(`/v1/batches/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

// ── Batches Write ────────────────────────────────────────────────────────────

/**
 * Create a new batch.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createBatch(data) {
  const daysInfo = resolveDaysDetails(data.daysPattern, data.daysLabel, data.daysList || data.customDays);
  const payload = {
    ...data,
    daysPattern: daysInfo.daysPattern,
    daysLabel: daysInfo.daysLabel,
    daysList: daysInfo.daysList,
  };
  if (!payload.id) {
    const existing = await getBatches();
    const maxNum = existing.reduce((max, b) => {
      const match = b.id?.match(/BATCH-(\d+)/i);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    payload.id = `BATCH-${String(maxNum + 1).padStart(2, "0")}`;
  }
  return api.post("/v1/batches", payload);
}

/**
 * Update an existing batch.
 *
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateBatch(id, updates) {
  return api.put(`/v1/batches/${encodeURIComponent(id)}`, updates);
}

/**
 * Delete a batch.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteBatch(id) {
  await api.delete(`/v1/batches/${encodeURIComponent(id)}`);
  return true;
}

/**
 * Toggle a batch's status between Active and Inactive.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function toggleBatchStatus(id) {
  return api.patch(`/v1/batches/${encodeURIComponent(id)}/toggle-status`);
}

/**
 * Enroll a member into a batch.
 *
 * @param {string} batchId
 * @param {string} memberId
 * @returns {Promise<object>}
 */
export async function enrollMemberInBatch(batchId, memberId) {
  return api.patch(`/v1/batches/${encodeURIComponent(batchId)}/enroll`, { memberId });
}

/**
 * Unenroll a member from a batch.
 *
 * @param {string} batchId
 * @param {string} memberId
 * @returns {Promise<object>}
 */
export async function unenrollMemberFromBatch(batchId, memberId) {
  return api.patch(`/v1/batches/${encodeURIComponent(batchId)}/unenroll`, { memberId });
}

/**
 * Sync trainers assigned to a batch.
 *
 * @param {string} batchId
 * @param {string[]} trainerIds
 * @returns {Promise<object>}
 */
export async function syncBatchTrainers(batchId, trainerIds) {
  return api.patch(`/v1/batches/${encodeURIComponent(batchId)}/sync-trainers`, { trainerIds });
}

export const syncTrainerBatchesFromBatch = syncBatchTrainers;

// ── Coach Shift Matrix ───────────────────────────────────────────────────────

/**
 * Get the coach shift matrix.
 *
 * @returns {Promise<object[]>}
 */
export async function getCoachShiftMatrix() {
  try {
    const result = await api.get("/v1/batches/coach-shifts");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * Toggle a specific coach's shift slot.
 *
 * @param {string} coachId
 * @param {string} slotKey
 * @returns {Promise<object>}
 */
export async function toggleCoachSlot(coachId, slotKey) {
  return api.patch("/v1/batches/coach-shifts/toggle", { coachId, slotKey });
}

// ── Scheduled Classes ────────────────────────────────────────────────────────

/**
 * Get all scheduled curriculum classes across all batches.
 *
 * @returns {Promise<object[]>}
 */
export async function getAllScheduledClasses() {
  try {
    const result = await api.get("/v1/batches/classes");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * Get scheduled classes for a specific batch.
 *
 * @param {string} batchId
 * @returns {Promise<object[]>}
 */
export async function getScheduledClassesByBatch(batchId) {
  if (!batchId) return [];
  try {
    const result = await api.get(`/v1/batches/${encodeURIComponent(batchId)}/classes`);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * Create a scheduled class for a batch.
 *
 * @param {string} batchId
 * @param {object} classData
 * @returns {Promise<object>}
 */
export async function createDayClass(batchId, classData) {
  const targetBatchId = typeof batchId === "string" ? batchId : classData?.batchId;
  return api.post(`/v1/batches/${encodeURIComponent(targetBatchId)}/classes`, classData);
}

/**
 * Update a scheduled class.
 *
 * @param {string} classId
 * @param {object} updates
 * @param {string} [batchId]
 * @returns {Promise<object>}
 */
export async function updateDayClass(classId, updates, batchId) {
  if (batchId) {
    return api.put(
      `/v1/batches/${encodeURIComponent(batchId)}/classes/${encodeURIComponent(classId)}`,
      updates
    );
  }
  return api.put(`/v1/batches/classes/${encodeURIComponent(classId)}`, updates);
}

/**
 * Delete a scheduled class.
 *
 * @param {string} classId
 * @param {string} [batchId]
 * @returns {Promise<boolean>}
 */
export async function deleteDayClass(classId, batchId) {
  if (batchId) {
    await api.delete(
      `/v1/batches/${encodeURIComponent(batchId)}/classes/${encodeURIComponent(classId)}`
    );
  } else {
    await api.delete(`/v1/batches/classes/${encodeURIComponent(classId)}`);
  }
  return true;
}

// ── Cross-Entity Helpers ─────────────────────────────────────────────────────

/**
 * Resolve trainer objects from an array of trainer IDs.
 * Accepts cached trainers to avoid redundant network calls.
 *
 * @param {string[]} trainerIds
 * @param {object[]} [cachedTrainers]
 * @returns {object[]}
 */
export function getBatchTrainers(trainerIds = [], cachedTrainers = null, batchId = null) {
  const allTrainers = Array.isArray(cachedTrainers)
    ? cachedTrainers
    : Array.isArray(SEED_TRAINERS)
      ? SEED_TRAINERS
      : [];
  return allTrainers.filter(
    (t) =>
      !t.isDeleted &&
      ((Array.isArray(trainerIds) && trainerIds.includes(t.id)) ||
        (batchId && Array.isArray(t.batchIds) && t.batchIds.includes(batchId)))
  );
}

/**
 * Resolve member objects assigned to a batch.
 * Accepts cached members or returns empty/filtered.
 *
 * @param {string} batchId
 * @param {number} [maxCount=18]
 * @param {object[]} [cachedMembers]
 * @returns {object[]}
 */
export function getBatchMembers(batchId, maxCount = 18, cachedMembers = null) {
  if (!batchId) return [];
  const members = Array.isArray(cachedMembers) ? cachedMembers : [];
  return members.filter(
    (m) =>
      !m.isDeleted &&
      (m.batchId === batchId || m.schedule?.batchId === batchId)
  );
}

/**
 * Returns an array of batch IDs that the given trainer is currently assigned to.
 *
 * @param {string} trainerId
 * @returns {Promise<string[]>}
 */
export async function getTrainerBatchIds(trainerId) {
  if (!trainerId) return [];
  try {
    const batches = await getBatches();
    const list = Array.isArray(batches) ? batches : [];
    return list
      .filter((b) => Array.isArray(b.trainerIds) && b.trainerIds.includes(trainerId))
      .map((b) => b.id);
  } catch {
    return [];
  }
}

/**
 * Synchronizes batch assignments for a specific trainer across all batches.
 *
 * @param {string} trainerId
 * @param {string[]} selectedBatchIds
 * @returns {Promise<object>}
 */
export async function syncTrainerBatches(trainerId, selectedBatchIds = []) {
  if (!trainerId) return [];
  try {
    return await api.patch(`/v1/trainers/${encodeURIComponent(trainerId)}/sync-batches`, {
      batchIds: selectedBatchIds,
    });
  } catch (err) {
    console.error("Failed to sync trainer batches:", err);
    return [];
  }
}

// ── Batch Transfers & Flexible Assignments ─────────────────────────────────────

/**
 * Executes a permanent transfer of a member from their current batch to a target batch.
 * Supports both object payload and positional arguments:
 *   executeBatchTransfer({ memberId, targetBatchId, effectiveDate, reason, transferredBy })
 *   executeBatchTransfer(memberId, targetBatchId, reason)
 *
 * @param {object|string} payloadOrMemberId
 * @param {string} [targetBatchId]
 * @param {string} [effectiveDateOrReason]
 * @param {string} [reason]
 * @param {string} [transferredBy]
 * @returns {Promise<object>}
 */
export async function executeBatchTransfer(
  payloadOrMemberId,
  targetBatchId,
  effectiveDateOrReason,
  reason,
  transferredBy = "Admin"
) {
  let memberId, targetBatch, effectiveDate, transferReason, by;
  if (payloadOrMemberId && typeof payloadOrMemberId === "object") {
    memberId = payloadOrMemberId.memberId;
    targetBatch = payloadOrMemberId.targetBatchId;
    effectiveDate = payloadOrMemberId.effectiveDate || new Date().toISOString().slice(0, 10);
    transferReason = payloadOrMemberId.reason;
    by = payloadOrMemberId.transferredBy || "Admin";
  } else {
    memberId = payloadOrMemberId;
    targetBatch = targetBatchId;
    if (typeof effectiveDateOrReason === "string" && /^\d{4}-\d{2}-\d{2}$/.test(effectiveDateOrReason)) {
      effectiveDate = effectiveDateOrReason;
      transferReason = reason;
    } else {
      effectiveDate = new Date().toISOString().slice(0, 10);
      transferReason = effectiveDateOrReason;
    }
    by = transferredBy || "Admin";
  }

  return api.post("/v1/batches/assignments/transfer", {
    memberId,
    targetBatchId: targetBatch,
    effectiveDate,
    reason: transferReason,
    transferredBy: by,
  });
}

/**
 * Creates a flexible / temporary multi-day batch assignment for a member.
 * Supports both object payload and positional arguments:
 *   createFlexibleBatchAssignment({ memberId, targetBatchId, selectedDays, startDate, endDate, reason, transferredBy })
 *   createFlexibleBatchAssignment(data)
 *
 * @param {object|string} dataOrMemberId
 * @param {string} [targetBatchId]
 * @param {string[]} [selectedDays] e.g. ["Monday", "Wednesday"]
 * @param {string} [startDate] YYYY-MM-DD
 * @param {string} [endDate] YYYY-MM-DD
 * @param {string} [reason]
 * @param {string} [transferredBy]
 * @returns {Promise<object>}
 */
export async function createFlexibleBatchAssignment(
  dataOrMemberId,
  targetBatchId,
  selectedDays,
  startDate,
  endDate = null,
  reason = "",
  transferredBy = "Admin"
) {
  let payload;
  if (dataOrMemberId && typeof dataOrMemberId === "object" && !Array.isArray(dataOrMemberId)) {
    payload = {
      memberId: dataOrMemberId.memberId,
      targetBatchId: dataOrMemberId.targetBatchId,
      selectedDays: dataOrMemberId.selectedDays,
      startDate: dataOrMemberId.startDate,
      endDate: dataOrMemberId.endDate || null,
      reason: dataOrMemberId.reason,
      transferredBy: dataOrMemberId.transferredBy || "Admin",
    };
  } else {
    payload = {
      memberId: dataOrMemberId,
      targetBatchId,
      selectedDays,
      startDate,
      endDate,
      reason,
      transferredBy,
    };
  }

  return api.post("/v1/batches/assignments/flex", payload);
}

/**
 * Retrieves all assignment history (primary, transfer, flex) for a specific member.
 *
 * @param {string} memberId
 * @returns {Promise<object>} { memberId, primaryBatch, activeFlexAssignments, batchHistory, allAssignments }
 */
export async function getMemberBatchAssignments(memberId) {
  if (!memberId) return null;
  return api.get(`/v1/batches/assignments/member/${encodeURIComponent(memberId)}`);
}

/**
 * Revokes an active flexible batch assignment.
 * Supports both:
 *   revokeFlexibleAssignment(assignmentId, reason)
 *   revokeFlexibleAssignment(assignmentId, { reason, revokedBy })
 *
 * @param {string} assignmentId
 * @param {string|object} [reasonOrOptions]
 * @returns {Promise<object>}
 */
export async function revokeFlexibleAssignment(assignmentId, reasonOrOptions = {}) {
  if (!assignmentId) return null;
  let reason = "Revoked by admin";
  let revokedBy = "Admin";

  if (typeof reasonOrOptions === "string") {
    reason = reasonOrOptions;
  } else if (reasonOrOptions && typeof reasonOrOptions === "object") {
    if (reasonOrOptions.reason !== undefined) reason = reasonOrOptions.reason;
    if (reasonOrOptions.revokedBy !== undefined) revokedBy = reasonOrOptions.revokedBy;
  }

  return api.delete(`/v1/batches/assignments/${encodeURIComponent(assignmentId)}/revoke`, {
    reason,
    revokedBy,
  });
}

// ── Month-Wise Category Tracking & Capacity ────────────────────────────────────

/**
 * Retrieves month-wise 3-category tracking for a batch:
 * Category 1: Assigned Trainers & Conduction logs
 * Category 2: Enrolled Members (Primary + Active Flex In)
 * Category 3: Scheduled Classes & Sessions in this Month
 *
 * @param {string} batchId
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @returns {Promise<object>}
 */
export async function getBatchMonthTracking(batchId, yearMonth) {
  if (!batchId) return null;
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  return api.get(`/v1/batches/${encodeURIComponent(batchId)}/month-tracking?month=${encodeURIComponent(ym)}`);
}

/**
 * Checks live capacity and available headroom for a batch on any target calendar date.
 *
 * @param {string} batchId
 * @param {string} [date] Format: YYYY-MM-DD (defaults to today)
 * @returns {Promise<object>} { batchId, date, dayOfWeek, maxPax, effectivePax, spotsRemaining, isFull }
 */
export async function getBatchCapacityCheck(batchId, date) {
  if (!batchId) return null;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return api.get(`/v1/batches/${encodeURIComponent(batchId)}/capacity-check?date=${encodeURIComponent(targetDate)}`);
}

/**
 * Retrieves the effective attendee roster for a batch on a specific calendar date
 * (primary members not flexed out + inbound flex members).
 *
 * @param {string} batchId
 * @param {string} [date] Format: YYYY-MM-DD (defaults to today)
 * @returns {Promise<object>} { batchId, date, dayOfWeek, totalAttendeesCount, maxPax, attendees }
 */
export async function getBatchEffectiveAttendees(batchId, date) {
  if (!batchId) return null;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  return api.get(`/v1/batches/${encodeURIComponent(batchId)}/effective-attendees?date=${encodeURIComponent(targetDate)}`);
}

export default {
  SHIFT_SLOTS,
  resolveDaysDetails,
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  toggleBatchStatus,
  enrollMemberInBatch,
  unenrollMemberFromBatch,
  syncBatchTrainers,
  syncTrainerBatchesFromBatch,
  getCoachShiftMatrix,
  toggleCoachSlot,
  getAllScheduledClasses,
  getScheduledClassesByBatch,
  createDayClass,
  updateDayClass,
  deleteDayClass,
  getBatchTrainers,
  getBatchMembers,
  getTrainerBatchIds,
  syncTrainerBatches,
  executeBatchTransfer,
  createFlexibleBatchAssignment,
  getMemberBatchAssignments,
  revokeFlexibleAssignment,
  getBatchMonthTracking,
  getBatchCapacityCheck,
  getBatchEffectiveAttendees,
};

