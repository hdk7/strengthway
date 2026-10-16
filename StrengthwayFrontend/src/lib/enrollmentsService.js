/**
 * Enrollments Service — Payment-First Member Conversion
 *
 * Backend base endpoint: /api/v1/enrollments
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch list of enrollments with optional status and search filtering.
 * @param {object} [params] - { status, search, skip, limit }
 * @returns {Promise<{ data: Array, total: number }>}
 */
export async function getEnrollments(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL" && params.status !== "All") {
      query.append("status", params.status);
    }
    if (params.search) {
      query.append("search", params.search.trim());
    }
    if (params.skip !== undefined) {
      query.append("skip", params.skip);
    }
    if (params.limit !== undefined) {
      query.append("limit", params.limit);
    }

    const queryStr = query.toString() ? `?${query.toString()}` : "";
    const response = await api.get(`/v1/enrollments${queryStr}`);
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      total: response?.total || 0,
    };
  } catch (err) {
    console.error("Failed to fetch enrollments:", err);
    throw err;
  }
}

/**
 * Fetch a single enrollment by its ID.
 * @param {string} id - Enrollment ID (e.g. "ENR-2026-0001")
 * @returns {Promise<object>}
 */
export async function getEnrollmentById(id) {
  if (!id) return null;
  try {
    const response = await api.get(`/v1/enrollments/${encodeURIComponent(id)}`);
    return response || null;
  } catch (err) {
    console.error(`Failed to fetch enrollment ${id}:`, err);
    throw err;
  }
}

/**
 * Fetch active enrollment linked to an inquiry.
 * @param {string} inquiryId - e.g. "INQ-2026-001"
 * @returns {Promise<object|null>}
 */
export async function getInquiryEnrollment(inquiryId) {
  if (!inquiryId) return null;
  try {
    const response = await api.get(`/v1/enrollments/inquiry/${encodeURIComponent(inquiryId)}`);
    return response || null;
  } catch (err) {
    console.error(`Failed to fetch inquiry enrollment ${inquiryId}:`, err);
    return null;
  }
}

/**
 * Fetch next auto-sequenced enrollment ID and invoice number.
 * @returns {Promise<{ enrollmentId: string, invoiceNumber: string }>}
 */
export async function getNextEnrollmentIds() {
  try {
    return await api.get("/v1/enrollments/next-id");
  } catch (err) {
    console.error("Failed to fetch next enrollment IDs:", err);
    throw err;
  }
}

/**
 * Create a new enrollment dossier and generate pending invoice and payment link.
 * @param {object} payload - Personal details, plan, discount, paymentMode
 * @returns {Promise<object>}
 */
export async function createEnrollment(payload) {
  try {
    return await api.post("/v1/enrollments", payload);
  } catch (err) {
    console.error("Failed to create enrollment:", err);
    throw err;
  }
}

/**
 * Generate and send Razorpay payment link via WhatsApp (or reuse active link).
 * @param {string} id - Enrollment ID
 * @returns {Promise<object>}
 */
export async function generateAndSendPaymentLink(id) {
  try {
    return await api.post(`/v1/enrollments/${encodeURIComponent(id)}/generate-send-link`, {});
  } catch (err) {
    console.error(`Failed to generate and send payment link for ${id}:`, err);
    throw err;
  }
}

/**
 * Resend payment link to candidate via WhatsApp without creating duplicate records.
 * @param {string} id - Enrollment ID
 * @returns {Promise<object>}
 */
export async function resendPaymentLink(id) {
  try {
    return await api.post(`/v1/enrollments/${encodeURIComponent(id)}/resend-link`, {});
  } catch (err) {
    console.error(`Failed to resend payment link for ${id}:`, err);
    throw err;
  }
}

/**
 * Record an offline Cash/UPI collection.
 * Converts to active member if full balance is paid.
 * @param {string} id - Enrollment ID
 * @param {object} paymentData - { amount, paymentMethod, transactionId, receiptNotes }
 * @returns {Promise<object>}
 */
export async function recordOfflinePayment(id, paymentData) {
  try {
    return await api.post(
      `/v1/enrollments/${encodeURIComponent(id)}/record-offline-payment`,
      paymentData
    );
  } catch (err) {
    console.error(`Failed to record offline payment for ${id}:`, err);
    throw err;
  }
}

/**
 * Verify online payment and activate member record.
 * @param {string} id - Enrollment ID
 * @param {object} verifyData - { razorpay_order_id, razorpay_payment_id, razorpay_signature, mockPayment }
 * @returns {Promise<object>}
 */
export async function verifyOnlinePayment(id, verifyData) {
  try {
    return await api.post(
      `/v1/enrollments/${encodeURIComponent(id)}/verify-payment`,
      verifyData
    );
  } catch (err) {
    console.error(`Failed to verify payment for ${id}:`, err);
    throw err;
  }
}

/**
 * Cancel a pending enrollment.
 * @param {string} id - Enrollment ID
 * @param {string} [reason]
 * @returns {Promise<object>}
 */
export async function cancelEnrollment(id, reason = "") {
  try {
    return await api.patch(`/v1/enrollments/${encodeURIComponent(id)}/cancel`, { reason });
  } catch (err) {
    console.error(`Failed to cancel enrollment ${id}:`, err);
    throw err;
  }
}
