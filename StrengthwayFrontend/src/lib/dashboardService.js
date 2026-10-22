/**
 * Dashboard Service — API Layer for Role-Based Dashboards
 *
 * Communicates with /api/v1/dashboard:
 *  - /admin: Full operational, financial, session, and attendance metrics
 *  - /trainer: Assigned batches, live/today classes, student counts, personal attendance & stats
 *  - /member: Personal schedule, live class status, attendance rate, membership plan validity & renewal
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch Admin Dashboard analytics and metrics.
 *
 * @param {Object} [params]
 * @param {number} [params.year]
 * @param {number} [params.month] (1-12)
 * @param {string} [params.batchId] (optional or "ALL")
 * @returns {Promise<Object>}
 */
export async function getAdminDashboard(params = {}) {
  const query = new URLSearchParams();
  if (params.year) query.set("year", params.year);
  if (params.month) query.set("month", params.month);
  if (params.batchId && params.batchId !== "ALL") query.set("batchId", params.batchId);

  const qs = query.toString();
  return api.get(`/v1/dashboard/admin${qs ? `?${qs}` : ""}`);
}

/**
 * Fetch Trainer Dashboard metrics.
 *
 * @param {Object} [params]
 * @param {number} [params.year]
 * @param {number} [params.month] (1-12)
 * @param {string} [params.batchId] (optional or "ALL")
 * @param {string} [params.trainerId] (optional for admin preview)
 * @returns {Promise<Object>}
 */
export async function getTrainerDashboard(params = {}) {
  const query = new URLSearchParams();
  if (params.year) query.set("year", params.year);
  if (params.month) query.set("month", params.month);
  if (params.batchId && params.batchId !== "ALL") query.set("batchId", params.batchId);
  if (params.trainerId) query.set("trainerId", params.trainerId);

  const qs = query.toString();
  return api.get(`/v1/dashboard/trainer${qs ? `?${qs}` : ""}`);
}

/**
 * Fetch Member Dashboard metrics.
 *
 * @param {Object} [params]
 * @param {number} [params.year]
 * @param {number} [params.month] (1-12)
 * @param {string} [params.memberId] (optional for admin/trainer preview)
 * @returns {Promise<Object>}
 */
export async function getMemberDashboard(params = {}) {
  const query = new URLSearchParams();
  if (params.year) query.set("year", params.year);
  if (params.month) query.set("month", params.month);
  if (params.memberId) query.set("memberId", params.memberId);

  const qs = query.toString();
  return api.get(`/v1/dashboard/member${qs ? `?${qs}` : ""}`);
}
