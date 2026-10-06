/**
 * Members Service — API Layer
 *
 * All business data is fetched from / persisted to the backend.
 * No localStorage is used for members data.
 *
 * Backend base: /api/v1/members
 */

import { api } from "@/lib/apiClient";

// ── Read ───────────────────────────────────────────────────────────────────────

/**
 * Fetch all members.
 * Backend returns paginated { data, pagination } — we request a large page
 * so the existing local filter/sort/paginate logic in pages still works.
 *
 * @param {boolean} includeDeleted  Include soft-deleted (archived) members.
 * @returns {Promise<object[]>}
 */
export async function getMembers(includeDeleted = false) {
  const params = new URLSearchParams({ pageSize: "1000" });
  if (includeDeleted) params.set("includeDeleted", "true");
  const result = await api.get(`/v1/members?${params}`);
  // Backend wraps in { data: [...], pagination: {...} } via paginated()
  if (Array.isArray(result)) return result;
  if (result?.data && Array.isArray(result.data)) return result.data;
  return [];
}

/**
 * Fetch a single member by ID.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getMemberById(id) {
  if (!id) return null;
  return api.get(`/v1/members/${id}`);
}

// ── Write ──────────────────────────────────────────────────────────────────────

/**
 * Register a new member.
 *
 * @param {object} data  Member fields from the registration form.
 * @returns {Promise<object>}  Created member record.
 */
export async function createMember(data) {
  return api.post("/v1/members", data);
}

/**
 * Update an existing member's profile.
 *
 * @param {string} id
 * @param {object} updates  Partial or full member fields to update.
 * @returns {Promise<object>}  Updated member record.
 */
export async function updateMember(id, updates) {
  return api.put(`/v1/members/${id}`, updates);
}

/**
 * Soft-delete a member (archive): sets isDeleted = true, status = "Archived".
 * Member data is preserved and can be restored.
 *
 * @param {string} id
 * @returns {Promise<object>}  Updated member record.
 */
export async function softDeleteMember(id) {
  return api.patch(`/v1/members/${id}/soft-delete`);
}

/**
 * Restore a previously archived member back to Active status.
 *
 * @param {string} id
 * @returns {Promise<object>}  Updated member record.
 */
export async function restoreMember(id) {
  return api.patch(`/v1/members/${id}/restore`);
}

/**
 * Permanently delete a member record. This action is irreversible.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function permanentDeleteMember(id) {
  await api.delete(`/v1/members/${id}`);
  return true;
}

/**
 * Toggle a member's status between Active and Inactive.
 *
 * @param {string} id
 * @returns {Promise<object>}  Updated member record with new status.
 */
export async function toggleMemberStatus(id) {
  return api.patch(`/v1/members/${id}/toggle-status`);
}

/**
 * Convert a Lead / Inquiry into a confirmed Active member.
 * Merges `additionalDetails` (membership plan, payment, batch) onto the record.
 *
 * @param {string} id                  Existing lead/inquiry member ID.
 * @param {object} additionalDetails   Extra data to merge (plan, payment, batch, etc.)
 * @returns {Promise<object>}          The converted active member record.
 */
export async function convertLeadToMember(id, additionalDetails = {}) {
  return api.patch(`/v1/members/${id}/convert`, additionalDetails);
}

/**
 * Record interaction/contact details for a lead/inquiry member, advancing status to Contacted.
 * @param {string} id - Member ID
 * @param {object} contactData - Contact payload
 * @returns {Promise<object>}
 */
export async function recordMemberContact(id, contactData) {
  return api.post(`/v1/members/${id}/contact`, contactData);
}

/**
 * Move an unconfirmed member inquiry to Archived status.
 * @param {string} id - Member ID
 * @param {string} [reason] - Reason for archiving
 * @returns {Promise<object>}
 */
export async function archiveMemberInquiry(id, reason = "") {
  return api.patch(`/v1/members/${id}/archive`, { reason });
}

/**
 * Retrieves month-wise tracking for an individual member:
 * - Primary batch details
 * - Active flexible assignments
 * - Full batch transfer and assignment history audit trail
 * - Monthly attendance ledger and compliance metrics
 *
 * @param {string} id Member ID
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @returns {Promise<object>}
 */
export async function getMemberMonthTracking(id, yearMonth) {
  if (!id) return null;
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  return api.get(`/v1/members/${encodeURIComponent(id)}/month-tracking?month=${encodeURIComponent(ym)}`);
}

