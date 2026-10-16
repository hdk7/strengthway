import api from "./apiClient";

/**
 * Simulate class cancellation and sequential rescheduling (dry-run preview).
 * Returns shifted dates, affected classes, and member adjustment calculations.
 */
export async function simulateCancellation(batchId, payload) {
  const targetBatchId = batchId || payload?.batchId;
  const res = await api.post(
    `/v1/batches/${encodeURIComponent(targetBatchId)}/schedule/cancel-reschedule/simulate`,
    payload
  );
  return res?.data || res;
}

/**
 * Apply class cancellation and sequential rescheduling.
 * Mutates batch schedule, updates sessions, assigns member adjustment credits
 * and carry-forward entitlements, and logs an audit record.
 */
export async function applyCancellation(batchId, payload) {
  const targetBatchId = batchId || payload?.batchId;
  const res = await api.post(
    `/v1/batches/${encodeURIComponent(targetBatchId)}/schedule/cancel-reschedule`,
    payload
  );
  return res?.data || res;
}

/**
 * Fetch cancellation history and audit logs for a batch.
 */
export async function getBatchCancellations(batchId, params = {}) {
  const res = await api.get(
    `/v1/batches/${encodeURIComponent(batchId)}/schedule/cancellations`,
    { params }
  );
  return res?.data || res;
}

/**
 * Fetch a member's available adjustment credits, carried forward pending sessions,
 * and historical adjustment transactions.
 */
export async function getMemberAdjustmentCredits(memberId) {
  const res = await api.get(
    `/v1/members/${encodeURIComponent(memberId)}/adjustment-credits`
  );
  return res?.data || res;
}

/**
 * Apply available adjustment credits to a member's renewal payment.
 */
export async function applyMemberRenewalAdjustment(memberId, payload) {
  const res = await api.post(
    `/v1/members/${encodeURIComponent(memberId)}/apply-adjustment-credit`,
    payload
  );
  return res?.data || res;
}

/**
 * Renew a member's subscription with automatic cancellation credit deduction.
 */
export async function renewMember(memberId, payload) {
  const res = await api.post(
    `/v1/members/${encodeURIComponent(memberId)}/renew`,
    payload
  );
  return res?.data || res;
}

export default {
  simulateCancellation,
  applyCancellation,
  getBatchCancellations,
  getMemberAdjustmentCredits,
  applyMemberRenewalAdjustment,
  renewMember,
};
