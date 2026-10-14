/**
 * Permissions Service — API Layer
 * ================================
 * Fetches dynamic RBAC matrix, updates role permissions, and tracks audit logs.
 *
 * Backend base: /api/v1/permissions
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch the complete permissions matrix and module action definitions (Admin only)
 * @returns {Promise<{ definitions: Array, roles: Object, metadata: Object }>}
 */
export async function getPermissionsMatrix() {
  const res = await api.get("/v1/permissions");
  return res?.data || res;
}

/**
 * Fetch permissions for the currently authenticated user
 * @returns {Promise<{ role: string, permissions: Object }>}
 */
export async function getMyPermissions() {
  const res = await api.get("/v1/permissions/me");
  return res?.data || res;
}

/**
 * Update permissions for a specific role (Admin only)
 * @param {string} role 'trainer' | 'member'
 * @param {Object} permissions Module -> array of action strings
 * @returns {Promise<Object>}
 */
export async function updateRolePermissions(role, permissions) {
  const res = await api.put(`/v1/permissions/${encodeURIComponent(role)}`, {
    permissions,
  });
  return res?.data || res;
}

/**
 * Reset permissions for a role to factory defaults (Admin only)
 * @param {string} role 'trainer' | 'member'
 * @returns {Promise<Object>}
 */
export async function resetRolePermissions(role) {
  const res = await api.post(`/v1/permissions/${encodeURIComponent(role)}/reset`);
  return res?.data || res;
}

/**
 * Get recent permission audit logs (Admin only)
 * @returns {Promise<Array>}
 */
export async function getPermissionAuditLogs() {
  const res = await api.get("/v1/permissions/audit");
  return res?.data || res;
}
