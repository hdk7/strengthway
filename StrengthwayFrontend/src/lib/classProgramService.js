import { api } from "@/lib/apiClient";

/**
 * Reusable Class System API Client Service
 */

export async function getClasses({ search = "", status = "ALL", page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.append("search", search.trim());
  if (status && status !== "ALL") params.append("status", status);
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/v1/classes${query}`);
  // api.get automatically unwraps res.data if envelope present
  return res || [];
}

export async function getClassById(id) {
  if (!id) throw new Error("Class ID is required");
  return api.get(`/v1/classes/${id}`);
}

/**
 * Creates a reusable class.
 * Strictly sends only 3 fields: name, beginnerWorkouts, intermediateWorkouts
 */
export async function createClass({ name, beginnerWorkouts = "", intermediateWorkouts = "" }) {
  const payload = {
    name: name?.trim() || "",
    beginnerWorkouts: beginnerWorkouts?.trim() || "Not specified",
    intermediateWorkouts: intermediateWorkouts?.trim() || "Not specified",
  };
  return api.post("/v1/classes", payload);
}

export async function updateClass(id, { name, beginnerWorkouts, intermediateWorkouts, status }) {
  if (!id) throw new Error("Class ID is required");
  const payload = {};
  if (name !== undefined) payload.name = name.trim();
  if (beginnerWorkouts !== undefined) payload.beginnerWorkouts = beginnerWorkouts.trim() || "Not specified";
  if (intermediateWorkouts !== undefined) payload.intermediateWorkouts = intermediateWorkouts.trim() || "Not specified";
  if (status !== undefined) payload.status = status;

  return api.put(`/v1/classes/${id}`, payload);
}

export async function deleteClass(id) {
  if (!id) throw new Error("Class ID is required");
  return api.delete(`/v1/classes/${id}`);
}

export async function getClassCalendar({ date, month, dayOfWeek, batchId } = {}) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (month) params.append("month", month);
  if (dayOfWeek) params.append("dayOfWeek", dayOfWeek);
  if (batchId) params.append("batchId", batchId);

  const query = params.toString() ? `?${params.toString()}` : "";
  return api.get(`/v1/classes/calendar${query}`);
}

// ─── Batch Schedule & Mapping APIs (for Phases 4 & 5) ─────────────────────────

export async function getBatchSchedule(batchId, { month, status, date, dayOfWeek, page = 1, limit = 50 } = {}) {
  if (!batchId) throw new Error("batchId is required");
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (status && status !== "ALL") params.append("status", status);
  if (date) params.append("date", date);
  if (dayOfWeek) params.append("dayOfWeek", dayOfWeek);
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));

  const query = params.toString() ? `?${params.toString()}` : "";
  return api.get(`/v1/batches/${batchId}/schedule${query}`);
}

export async function assignClassesToBatch(batchId, { classIds = [], startDate, overrideExisting = false, reason = "" }) {
  if (!batchId) throw new Error("batchId is required");
  return api.post(`/v1/batches/${batchId}/schedule/assign-classes`, {
    classIds,
    startDate,
    overrideExisting,
    reason,
  });
}

export async function shuffleBatchClasses(batchId, { mode = "SWAP", sourceSessionId, targetSessionId, startDate, endDate, reason = "" }) {
  if (!batchId) throw new Error("batchId is required");
  return api.post(`/v1/batches/${batchId}/schedule/shuffle`, {
    mode,
    sourceSessionId,
    targetSessionId,
    startDate,
    endDate,
    reason,
  });
}

export const shuffleBatchSchedule = shuffleBatchClasses;

export async function getBatchScheduleHistory(batchId, limit = 50) {
  if (!batchId) throw new Error("batchId is required");
  return api.get(`/v1/batches/${batchId}/schedule/history?limit=${limit}`);
}
