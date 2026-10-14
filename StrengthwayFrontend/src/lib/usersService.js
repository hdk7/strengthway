/**
 * Users & Access Management Service — API Layer
 *
 * Dedicated admin service for user account provisioning, role assignment,
 * status activation/deactivation, and password resets.
 *
 * Backend base: /api/v1/auth
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch all registered system user accounts.
 * @returns {Promise<object[]>} Array of user objects (sanitized, no passwordHash)
 */
export async function getAllUsers() {
  const result = await api.get("/v1/auth/users");
  if (Array.isArray(result)) return result;
  if (result?.data && Array.isArray(result.data)) return result.data;
  return [];
}

/**
 * Provision a new user login account.
 * Links to existing trainerId or memberId if provided, without duplicate records.
 *
 * @param {object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} payload.password
 * @param {'admin'|'trainer'|'member'} payload.role
 * @param {string} [payload.trainerId]
 * @param {string} [payload.memberId]
 * @returns {Promise<object>} Created user and token info
 */
export async function createUserAccount(payload) {
  return api.post("/v1/auth/register", payload);
}

/**
 * Toggle active / suspended status for a user account.
 *
 * @param {string} userId - User MongoDB _id
 * @returns {Promise<object>} Updated user object
 */
export async function toggleUserStatus(userId) {
  return api.patch(`/v1/auth/users/${userId}/status`);
}

/**
 * Administrative password reset for any user account.
 *
 * @param {string} userId - User MongoDB _id
 * @param {string} newPassword - New password (min 6 chars)
 * @returns {Promise<object>} Response message
 */
export async function adminResetPassword(userId, newPassword) {
  return api.patch(`/v1/auth/users/${userId}/reset-password`, {
    password: newPassword,
  });
}

/**
 * Delete a user login account permanently.
 *
 * @param {string} userId - User MongoDB _id
 * @returns {Promise<object>}
 */
export async function deleteUserAccount(userId) {
  return api.delete(`/v1/auth/users/${userId}`);
}

/**
 * Check whether a Trainer or Member profile already has a linked login account.
 *
 * @param {'trainer'|'member'} type
 * @param {string} profileId - e.g. "TRN-001" or "MEM-0001"
 * @returns {Promise<{ hasAccount: boolean, user: object|null }>}
 */
export async function checkProfileAccount(type, profileId) {
  if (!type || !profileId) return { hasAccount: false, user: null };
  return api.get(`/v1/auth/users/check/${type}/${encodeURIComponent(profileId)}`);
}

export default {
  getAllUsers,
  createUserAccount,
  toggleUserStatus,
  adminResetPassword,
  deleteUserAccount,
  checkProfileAccount,
};
