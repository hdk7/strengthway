/**
 * Meta WhatsApp Cloud API Frontend Service
 *
 * Provides connection monitoring, test message dispatch, and delivery log inspection.
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch WhatsApp integration configuration status and safe connection metadata.
 * @returns {Promise<object>}
 */
export async function getWhatsAppConfig() {
  try {
    return await api.get("/v1/whatsapp/config");
  } catch (err) {
    console.error("Failed to fetch WhatsApp configuration:", err);
    throw err;
  }
}

/**
 * Dispatch an admin test message to verify Cloud API connectivity and templates.
 * @param {object} payload - { toPhone, messageText, useTemplate }
 * @returns {Promise<object>}
 */
export async function sendWhatsAppTestMessage(payload) {
  try {
    return await api.post("/v1/whatsapp/test-send", payload);
  } catch (err) {
    console.error("Failed to send WhatsApp test message:", err);
    throw err;
  }
}

/**
 * Fetch paginated WhatsApp delivery history and audit logs.
 * @param {object} [params] - { status, search, enrollmentId, skip, limit }
 * @returns {Promise<{ data: Array, total: number }>}
 */
export async function getWhatsAppLogs(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL" && params.status !== "All") {
      query.append("status", params.status);
    }
    if (params.search) {
      query.append("search", params.search.trim());
    }
    if (params.enrollmentId) {
      query.append("enrollmentId", params.enrollmentId.trim());
    }
    if (params.skip !== undefined) {
      query.append("skip", params.skip);
    }
    if (params.limit !== undefined) {
      query.append("limit", params.limit);
    }

    const queryStr = query.toString() ? `?${query.toString()}` : "";
    const response = await api.get(`/v1/whatsapp/logs${queryStr}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      total: response?.total || 0,
    };
  } catch (err) {
    console.error("Failed to fetch WhatsApp logs:", err);
    throw err;
  }
}
