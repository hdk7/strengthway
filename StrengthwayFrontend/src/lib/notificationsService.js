/**
 * Notifications Service — API Client Layer
 *
 * Dedicated client for real-time leave status updates, administrative
 * request notifications, and attendance alerts.
 */

import { api } from "@/lib/apiClient";

/**
 * Retrieves notifications for the current authenticated user.
 *
 * @param {object} [params]
 * @param {boolean} [params.unreadOnly]
 * @param {number} [params.limit]
 * @returns {Promise<{ notifications: object[], unreadCount: number }>}
 */
export async function getNotifications(params = {}) {
  const q = new URLSearchParams();
  if (params.unreadOnly !== undefined) q.append("unreadOnly", String(params.unreadOnly));
  if (params.limit) q.append("limit", String(params.limit));

  const qs = q.toString() ? `?${q.toString()}` : "";
  return api.get(`/v1/notifications${qs}`);
}

/**
 * Marks a notification as read.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function markNotificationRead(id) {
  if (!id) return null;
  return api.patch(`/v1/notifications/${encodeURIComponent(id)}/read`);
}

/**
 * Marks all notifications as read for current user.
 *
 * @returns {Promise<object>}
 */
export async function markAllNotificationsRead() {
  return api.patch("/v1/notifications/read-all");
}

export default {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
