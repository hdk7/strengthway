/**
 * Standard gym membership plans and payment configuration for The Strength Way.
 * Features backend API persistence (/api/v1/plans) and dynamic master management.
 * All localStorage reads/writes for business plan data have been replaced by API calls.
 */

import { api } from "@/lib/apiClient";

export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: "plan-monthly",
    name: "Monthly Starter",
    durationMonths: 1,
    price: 7000,
    formattedPrice: "₹7,000",
    period: "/mo",
    billing: "Billed ₹7,000 every month",
    description: "Full facility access with flexible month-to-month commitment.",
    badge: null,
    popular: false,
    status: "Active",
    features: [
      "Full access to every program — Strength, Calisthenics & Mobility",
      "Unlimited group training classes",
      "Certified coach floor supervision",
      "Locker & shower facilities",
    ],
  },
  {
    id: "plan-quarterly",
    name: "Quarterly Pro",
    durationMonths: 3,
    price: 18000,
    formattedPrice: "₹18,000",
    period: "/3mo",
    billing: "Billed ₹18,000 every 3 months",
    description:
      "Billed ₹18,000 every 3 months. Perfect balance of commitment and athletic progression.",
    badge: "MOST POPULAR",
    popular: true,
    status: "Active",
    features: [
      "All Monthly Starter tier benefits included",
      "Quarterly 1-on-1 athletic fitness assessment",
      "Customized hypertrophy & strength split",
      "Priority batch slot booking",
      "Bi-weekly body composition analysis",
    ],
  },
];

/**
 * Fetch membership plans from the backend API.
 * @param {boolean} includeInactive - Whether to include Inactive plans (default: true)
 * @param {boolean} includeDeleted  - Whether to include soft-deleted/archived plans (default: false)
 * @returns {Promise<Array>} List of membership plan objects
 */
export async function getMembershipPlans(includeInactive = true, includeDeleted = false) {
  try {
    const params = new URLSearchParams();
    if (includeDeleted) {
      params.append("includeDeleted", "true");
    }
    if (!includeInactive) {
      params.append("status", "Active");
    }

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(`/v1/plans${queryStr}`);
    return Array.isArray(response) ? response : (response?.plans || []);
  } catch (err) {
    console.error("Failed to fetch membership plans:", err);
    throw err;
  }
}

/**
 * Fetch a single membership plan by ID from backend.
 * @param {string} id - Plan ID (e.g. "plan-monthly")
 * @returns {Promise<object|null>} Plan object or null
 */
export async function getMembershipPlanById(id) {
  if (!id) return null;
  try {
    const response = await api.get(`/v1/plans/${encodeURIComponent(id)}`);
    return response || null;
  } catch (err) {
    console.error(`Failed to fetch membership plan ${id}:`, err);
    throw err;
  }
}

/**
 * Create a new membership plan via backend API.
 * @param {object} planData - Plan details
 * @returns {Promise<object>} Created plan object
 */
export async function createMembershipPlan(planData) {
  const priceNum = Number(planData.price) || 0;
  const durationMonths = Number(planData.durationMonths) || 1;

  const payload = {
    id: planData.id?.trim() || undefined,
    name: planData.name?.trim(),
    durationMonths,
    price: priceNum,
    period: planData.period?.trim() || (durationMonths === 1 ? "/mo" : `/${durationMonths}mo`),
    billing:
      planData.billing?.trim() ||
      `Billed ₹${priceNum.toLocaleString("en-IN")} for ${durationMonths} month(s)`,
    description: planData.description?.trim() || "",
    badge: planData.badge?.trim() || null,
    popular: Boolean(planData.popular),
    status: planData.status || "Active",
    features: Array.isArray(planData.features) ? planData.features.filter(Boolean) : [],
  };

  const created = await api.post("/v1/plans", payload);
  return created;
}

/**
 * Update an existing membership plan by ID.
 * @param {string} id - Plan ID
 * @param {object} patch - Partial plan updates
 * @returns {Promise<object>} Updated plan object
 */
export async function updateMembershipPlan(id, patch) {
  const payload = { ...patch };
  if (payload.price !== undefined) {
    payload.price = Number(payload.price);
  }
  if (payload.durationMonths !== undefined) {
    payload.durationMonths = Number(payload.durationMonths);
  }
  if (Array.isArray(payload.features)) {
    payload.features = payload.features.filter(Boolean);
  }

  const updated = await api.put(`/v1/plans/${encodeURIComponent(id)}`, payload);
  return updated;
}

/**
 * Toggle Active / Inactive status of a plan.
 * @param {string} id - Plan ID
 * @returns {Promise<object>} Updated plan object
 */
export async function toggleMembershipPlanStatus(id) {
  const updated = await api.patch(`/v1/plans/${encodeURIComponent(id)}/toggle-status`);
  return updated;
}

/**
 * Soft delete (archive) a membership plan.
 * @param {string} id - Plan ID
 * @returns {Promise<object>} Archived plan object
 */
export async function softDeleteMembershipPlan(id) {
  const deleted = await api.patch(`/v1/plans/${encodeURIComponent(id)}/soft-delete`);
  return deleted;
}

/**
 * Alias for softDeleteMembershipPlan.
 */
export function deleteMembershipPlan(id) {
  return softDeleteMembershipPlan(id);
}

/**
 * Restore an archived (soft-deleted) membership plan.
 * @param {string} id - Plan ID
 * @returns {Promise<object>} Restored plan object
 */
export async function restoreMembershipPlan(id) {
  const restored = await api.patch(`/v1/plans/${encodeURIComponent(id)}/restore`);
  return restored;
}

/**
 * Permanently delete a membership plan from the database.
 * @param {string} id - Plan ID
 * @returns {Promise<boolean>} Success confirmation
 */
export async function permanentDeleteMembershipPlan(id) {
  await api.delete(`/v1/plans/${encodeURIComponent(id)}`);
  return true;
}

// Backward compatible static export
export const MEMBERSHIP_PLANS = DEFAULT_MEMBERSHIP_PLANS;

export const PAYMENT_METHODS = [
  {
    id: "UPI",
    name: "UPI / QR Code",
    description: "Instant payment via Google Pay, PhonePe, Paytm, BHIM",
    icon: "QrCode",
  },
  {
    id: "Card",
    name: "Credit / Debit Card",
    description: "Visa, MasterCard, RuPay, Maestro",
    icon: "CreditCard",
  },
  {
    id: "NetBanking",
    name: "Net Banking",
    description: "Direct bank transfer from all major Indian banks",
    icon: "Building2",
  },
  {
    id: "Cash",
    name: "Cash / Front Desk POS",
    description: "Physical cash payment received at gym reception counter",
    icon: "Banknote",
  },
];

/**
 * Calculates start and expiry dates for a membership plan.
 * Pure utility function — remains synchronous.
 */
export function calculateMembershipDates(durationMonths, startDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + durationMonths);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    formattedStart: start.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    formattedEnd: end.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };
}

/**
 * Generates an official transaction reference number.
 * Pure utility function — remains synchronous.
 */
export function generateTransactionId(method = "UPI") {
  const prefix = method.toUpperCase().slice(0, 3);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a formal membership receipt number.
 * Pure utility function — remains synchronous.
 */
export function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const sequence = Math.floor(10000 + Math.random() * 90000);
  return `TSW-REC-${year}-${sequence}`;
}
