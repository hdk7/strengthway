import { api } from "@/lib/apiClient";

/**
 * Retrieves eligible substitute trainers for a scheduled session with conflict validation status.
 *
 * @param {string} batchId
 * @param {string} sessionId
 * @returns {Promise<{
 *   session: object,
 *   batch: object,
 *   eligibleTrainers: object[],
 *   unavailableTrainers: object[],
 *   totalEligible: number,
 *   totalUnavailable: number
 * }>}
 */
export async function getEligibleSubstitutes(batchId, sessionId) {
  if (!sessionId) return null;
  const endpoint = batchId
    ? `/v1/batches/${encodeURIComponent(batchId)}/sessions/${encodeURIComponent(sessionId)}/substitutes/eligible`
    : `/v1/batches/sessions/${encodeURIComponent(sessionId)}/substitutes/eligible`;
  const res = await api.get(endpoint);
  return res?.data || res;
}

/**
 * Assigns or optionally proceeds without a substitute trainer for a scheduled session.
 *
 * @param {object} params
 * @param {string} params.batchId
 * @param {string} params.sessionId
 * @param {string} [params.substituteTrainerId]
 * @param {"Leave" | "Absent" | "Emergency" | "Other"} [params.reason]
 * @param {string} [params.notes]
 * @param {boolean} [params.proceedWithoutSubstitute=false]
 * @param {string} [params.idempotencyKey]
 * @returns {Promise<object>}
 */
export async function assignSubstituteTrainer({
  batchId,
  sessionId,
  originalTrainerId,
  substituteTrainerId,
  reason,
  notes = "",
  proceedWithoutSubstitute = false,
  idempotencyKey = "",
}) {
  if (!sessionId) throw new Error("sessionId is required.");
  const endpoint = batchId
    ? `/v1/batches/${encodeURIComponent(batchId)}/sessions/${encodeURIComponent(sessionId)}/substitute`
    : `/v1/batches/sessions/${encodeURIComponent(sessionId)}/substitute`;
  const res = await api.post(endpoint, {
    originalTrainerId,
    substituteTrainerId,
    reason,
    notes,
    proceedWithoutSubstitute,
    idempotencyKey,
  });
  return res?.data || res;
}

/**
 * Cancels a substitute trainer assignment and restores the primary assigned coach.
 *
 * @param {object} params
 * @param {string} params.batchId
 * @param {string} params.sessionId
 * @param {string} [params.cancellationReason]
 * @returns {Promise<object>}
 */
export async function cancelSubstituteTrainer({ batchId, sessionId, cancellationReason = "" }) {
  if (!sessionId) throw new Error("sessionId is required.");
  const endpoint = batchId
    ? `/v1/batches/${encodeURIComponent(batchId)}/sessions/${encodeURIComponent(sessionId)}/substitute/cancel`
    : `/v1/batches/sessions/${encodeURIComponent(sessionId)}/substitute/cancel`;
  const res = await api.post(endpoint, { cancellationReason });
  return res?.data || res;
}

/**
 * Retrieves the substitution audit history for a batch.
 *
 * @param {string} batchId
 * @param {object} [params]
 * @returns {Promise<{ batchId: string, totalCount: number, logs: object[] }>}
 */
export async function getBatchSubstitutionAuditLogs(batchId, params = {}) {
  if (!batchId) return { batchId: "", totalCount: 0, logs: [] };
  const query = new URLSearchParams();
  if (params.sessionId) query.append("sessionId", params.sessionId);
  if (params.status && params.status !== "ALL" && params.status !== "All") query.append("status", params.status);
  if (params.actionType && params.actionType !== "ALL" && params.actionType !== "All") query.append("actionType", params.actionType);
  if (params.reason && params.reason !== "ALL" && params.reason !== "All") query.append("reason", params.reason);
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.search) query.append("search", params.search);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await api.get(`/v1/batches/${encodeURIComponent(batchId)}/substitute-audits${qs}`);
  return res?.data || res || { batchId, totalCount: 0, logs: [] };
}

/**
 * Retrieves the substitution audit history for a specific scheduled session.
 *
 * @param {string} batchId
 * @param {string} sessionId
 * @returns {Promise<{ sessionId: string, totalCount: number, logs: object[] }>}
 */
export async function getSessionSubstitutionHistory(batchId, sessionId) {
  if (!sessionId) return { sessionId: "", totalCount: 0, logs: [] };
  const endpoint = batchId
    ? `/v1/batches/${encodeURIComponent(batchId)}/sessions/${encodeURIComponent(sessionId)}/substitute-history`
    : `/v1/batches/sessions/${encodeURIComponent(sessionId)}/substitute-audits`;
  const res = await api.get(endpoint);
  return res?.data || res || { sessionId, totalCount: 0, logs: [] };
}
