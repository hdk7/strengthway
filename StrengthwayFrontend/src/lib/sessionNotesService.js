import { api } from "@/lib/apiClient";

/**
 * Fetch session notes with optional filters (sessionId, batchId, trainerId, date).
 */
export async function getSessionNotes({ sessionId, batchId, trainerId, date } = {}) {
  const params = new URLSearchParams();
  if (sessionId) params.set("sessionId", sessionId);
  if (batchId) params.set("batchId", batchId);
  if (trainerId) params.set("trainerId", trainerId);
  if (date) params.set("date", date);
  const qs = params.toString();
  return api.get(`/v1/session-notes${qs ? `?${qs}` : ""}`);
}

/**
 * Fetch a single session note by its ID.
 */
export async function getSessionNoteById(id) {
  return api.get(`/v1/session-notes/${encodeURIComponent(id)}`);
}

/**
 * Save or update a session note for a specific trainer and class session.
 *
 * @param {Object} payload
 * @param {string} payload.sessionId
 * @param {string} payload.trainerId
 * @param {string} payload.trainerName
 * @param {string} payload.sessionSummary
 * @param {string} [payload.memberPerformance]
 * @param {string} [payload.observations]
 * @param {boolean} [payload.followUpRequired]
 */
export async function saveSessionNote(payload) {
  return api.post("/v1/session-notes", payload);
}

/**
 * Admin Daily Overview: Fetch notes for today's ongoing and completed classes.
 * Excludes upcoming and cancelled classes.
 */
export async function getDailyAdminSessionNotes({ date, batchId } = {}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (batchId) params.set("batchId", batchId);
  const qs = params.toString();
  return api.get(`/v1/session-notes/daily${qs ? `?${qs}` : ""}`);
}
