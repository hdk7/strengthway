/**
 * Member Discounts Service — Individual Member Discount Management
 *
 * Backend base endpoint: /api/v1/member-discounts
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch list of discounts with optional status, search, and plan filtering.
 * @param {object} [params] - { status, search, planId, discountType, campaignId, skip, limit }
 * @returns {Promise<{ data: Array, total: number }>}
 */
export async function getDiscounts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== "ALL" && params.status !== "All") {
      query.append("status", params.status);
    }
    if (params.search) {
      query.append("search", params.search.trim());
    }
    if (params.planId) {
      query.append("planId", params.planId);
    }
    if (params.discountType) {
      query.append("discountType", params.discountType);
    }
    if (params.campaignId) {
      query.append("campaignId", params.campaignId);
    }
    if (params.skip !== undefined) {
      query.append("skip", params.skip);
    }
    if (params.limit !== undefined) {
      query.append("limit", params.limit);
    }

    const queryStr = query.toString() ? `?${query.toString()}` : "";
    const response = await api.get(`/v1/member-discounts${queryStr}`);

    const rawList =
      response?.discounts ||
      response?.data?.discounts ||
      response?.data ||
      (Array.isArray(response) ? response : []);

    const list = Array.isArray(rawList) ? rawList : [];

    return {
      data: list,
      discounts: list,
      total: response?.total ?? list.length,
      page: response?.page ?? 1,
      totalPages: response?.totalPages ?? 1,
    };
  } catch (err) {
    console.error("Failed to fetch member discounts:", err);
    throw err;
  }
}

/**
 * Fetch a single discount by ID.
 * @param {string} id - Discount ID (e.g., "DSC-2026-0001")
 * @returns {Promise<object>}
 */
export async function getDiscountById(id) {
  if (!id) return null;
  try {
    const response = await api.get(`/v1/member-discounts/${encodeURIComponent(id)}`);
    return response || null;
  } catch (err) {
    console.error(`Failed to fetch discount ${id}:`, err);
    throw err;
  }
}

/**
 * Fetch active discount for the currently logged in member.
 * @returns {Promise<{ data: Array }>}
 */
export async function getMyActiveDiscounts() {
  try {
    const response = await api.get("/v1/member-discounts/my-active");
    return {
      data: Array.isArray(response?.data) ? response.data : [],
    };
  } catch (err) {
    console.error("Failed to fetch my active discounts:", err);
    throw err;
  }
}

/**
 * Preview backend calculation for a single discount configuration.
 * @param {object} payload - { memberId, planId, discountType, discountValue }
 * @returns {Promise<object>}
 */
export async function previewDiscount(payload) {
  try {
    const response = await api.post("/v1/member-discounts/preview", payload);
    return response?.data || response;
  } catch (err) {
    console.error("Failed to preview discount:", err);
    throw err;
  }
}

/**
 * Preview backend calculation for a batch of discount items.
 * @param {Array<object>} items - Array of { memberId, planId, discountType, discountValue }
 * @returns {Promise<Array<object>>}
 */
export async function previewDiscountBatch(items) {
  try {
    const response = await api.post("/v1/member-discounts/preview-batch", { items });
    return response?.data || [];
  } catch (err) {
    console.error("Failed to preview discount batch:", err);
    throw err;
  }
}

/**
 * Bulk assign individual discounts to multiple members.
 * @param {object} payload - { campaignName, notes, sendNotification, items: [...] }
 * @returns {Promise<object>}
 */
export async function assignBulkDiscounts(payload) {
  try {
    const discounts = payload.discounts || payload.items || [];
    const notifyMembers =
      payload.notifyMembers !== undefined
        ? payload.notifyMembers !== false
        : payload.sendNotification !== undefined
        ? payload.sendNotification !== false
        : true;

    const formattedPayload = {
      campaignName: payload.campaignName,
      notes: payload.notes,
      notifyMembers,
      sendNotification: notifyMembers,
      discounts,
      items: discounts,
    };
    const response = await api.post("/v1/member-discounts/bulk-assign", formattedPayload);
    return response;
  } catch (err) {
    console.error("Failed to bulk assign discounts:", err);
    throw err;
  }
}

/**
 * Cancel an active or pending discount.
 * @param {string} id - Discount ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<object>}
 */
export async function cancelDiscount(id, reason = "") {
  try {
    const response = await api.patch(`/v1/member-discounts/${encodeURIComponent(id)}/cancel`, { reason });
    return response;
  } catch (err) {
    console.error(`Failed to cancel discount ${id}:`, err);
    throw err;
  }
}

/**
 * Resend notification for an assigned discount offer.
 * @param {string} id - Discount ID
 * @returns {Promise<object>}
 */
export async function resendDiscountNotification(id) {
  try {
    const response = await api.post(`/v1/member-discounts/${encodeURIComponent(id)}/resend-notification`);
    return response;
  } catch (err) {
    console.error(`Failed to resend discount notification ${id}:`, err);
    throw err;
  }
}

/**
 * Generate checkout payment link for a discount offer.
 * @param {string} id - Discount ID
 * @returns {Promise<{ checkoutUrl: string, orderId: string, amount: number, keyId: string }>}
 */
export async function generateDiscountCheckoutLink(id) {
  try {
    const response = await api.post(`/v1/member-discounts/${encodeURIComponent(id)}/checkout-link`);
    return response?.data || response;
  } catch (err) {
    console.error(`Failed to generate discount checkout link ${id}:`, err);
    throw err;
  }
}

/**
 * Verify online payment for discount redemption and activate membership renewal.
 * @param {string} id - Discount ID
 * @param {object} paymentDetails - { razorpayPaymentId, razorpayOrderId, razorpaySignature }
 * @returns {Promise<object>}
 */
export async function verifyDiscountPayment(id, paymentDetails) {
  try {
    const response = await api.post(
      `/v1/member-discounts/${encodeURIComponent(id)}/verify-payment`,
      paymentDetails
    );
    return response?.data || response;
  } catch (err) {
    console.error(`Failed to verify discount payment for ${id}:`, err);
    throw err;
  }
}
