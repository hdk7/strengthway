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
import { SHIFT_SLOTS, resolveDaysDetails } from "./batchUtils";
import {
  executeBatchTransfer,
  createFlexibleBatchAssignment,
  getMemberBatchAssignments,
  revokeFlexibleAssignment,
  getBatchMonthTracking,
  getBatchCapacityCheck,
  getBatchEffectiveAttendees,
} from "./batchTransferService";

export { SHIFT_SLOTS, resolveDaysDetails };
export {
  executeBatchTransfer,
  createFlexibleBatchAssignment,
  getMemberBatchAssignments,
  revokeFlexibleAssignment,
  getBatchMonthTracking,
  getBatchCapacityCheck,
  getBatchEffectiveAttendees,
};

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
