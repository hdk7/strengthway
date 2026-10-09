/**
 * Inquiries Service — Backend API Integration
 *
 * All inquiries are retrieved from and persisted to the Strengthway backend API.
 * No localStorage persistence is used.
 *
 * Backend base endpoint: /api/v1/inquiries
 */

import { api } from "@/lib/apiClient";

/**
 * Fetch all inquiries from the backend API.
 * @param {object} [params] - Optional filters { status, search, includeDeleted }
 * @returns {Promise<Array>} List of inquiry objects
 */
export async function getInquiries(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All") {
      query.append("status", params.status);
    }
    if (params.search) {
      query.append("search", params.search.trim());
    }
    if (params.includeDeleted) {
      query.append("includeDeleted", "true");
    }

    const queryStr = query.toString() ? `?${query.toString()}` : "";
    const response = await api.get(`/v1/inquiries${queryStr}`);
    return Array.isArray(response) ? response : (response?.inquiries || []);
  } catch (err) {
    console.error("Failed to fetch inquiries:", err);
    throw err;
  }
}

/**
 * Fetch a single inquiry by its ID.
 * @param {string} id - Inquiry ID (e.g. "INQ-123456")
 * @returns {Promise<object|null>} The inquiry record or null
 */
export async function getInquiryById(id) {
  if (!id) return null;
  try {
    const response = await api.get(`/v1/inquiries/${encodeURIComponent(id)}`);
    return response || null;
  } catch (err) {
    console.error(`Failed to fetch inquiry ${id}:`, err);
    throw err;
  }
}

/**
 * Fetch next auto-sequenced inquiry ID from backend.
 * @returns {Promise<string>} Next ID, e.g. "INQ-2026-001"
 */
export async function getNextInquiryId() {
  try {
    const res = await api.get("/v1/inquiries/next-id");
    return res?.nextId || `INQ-${new Date().getFullYear()}-001`;
  } catch (err) {
    console.warn("Failed to fetch next inquiry ID from server:", err);
    return `INQ-${new Date().getFullYear()}-001`;
  }
}

/**
 * Create a new customer inquiry via backend API.
 * @param {object} data - Form data
 * @returns {Promise<object>} Created inquiry record
 */
export async function createInquiry(data) {
  const payload = {
    id: data.id?.trim() || undefined,
    name: data.name?.trim(),
    gender: data.gender || "Male",
    mobile: data.mobile?.trim(),
    email: data.email?.trim().toLowerCase(),
    address: data.address?.trim() || "",
    subject: data.subject?.trim() || "General Inquiry",
    message: data.message?.trim() || "",
    status: data.status === "Lead" ? "Inquiry" : data.status || "Inquiry",
  };

  const created = await api.post("/v1/inquiries", payload);
  return created;
}

/**
 * Update the status of an existing inquiry.
 * @param {string} id - Inquiry ID
 * @param {string} status - New status ("Inquiry" | "Contacted" | "Converted" | "Archived")
 * @returns {Promise<object>} Updated inquiry record
 */
export async function updateInquiryStatus(id, status, options = {}) {
  const updated = await api.patch(`/v1/inquiries/${encodeURIComponent(id)}/status`, {
    status,
    ...options,
  });
  return updated;
}

/**
 * Update fields of an existing inquiry.
 * @param {string} id - Inquiry ID
 * @param {object} patch - Updates
 * @returns {Promise<object>} Updated inquiry record
 */
export async function updateInquiry(id, patch) {
  const updated = await api.put(`/v1/inquiries/${encodeURIComponent(id)}`, patch);
  return updated;
}

/**
 * Permanently delete an inquiry record.
 * @param {string} id - Inquiry ID
 * @returns {Promise<boolean>} Success confirmation
 */
export async function deleteInquiry(id) {
  await api.delete(`/v1/inquiries/${encodeURIComponent(id)}`);
  return true;
}

/**
 * Soft-delete / archive an inquiry record.
 * @param {string} id - Inquiry ID
 * @returns {Promise<object>} Soft deleted inquiry record
 */
export async function softDeleteInquiry(id) {
  const deleted = await api.patch(`/v1/inquiries/${encodeURIComponent(id)}/soft-delete`);
  return deleted;
}

/**
 * Record interaction/contact details for an inquiry, advancing status to Contacted.
 * @param {string} id - Inquiry ID
 * @param {object} contactData - { contactMethod, contactNotes, contactedBy, contactedAt, outcome, followUpDate }
 * @returns {Promise<object>} Updated inquiry record
 */
export async function recordInquiryContact(id, contactData) {
  return api.post(`/v1/inquiries/${encodeURIComponent(id)}/contact`, contactData);
}

/**
 * Move an unconfirmed inquiry to Archived.
 * @param {string} id - Inquiry ID
 * @param {string} [reason] - Optional reason for archiving
 * @returns {Promise<object>} Updated inquiry record
 */
export async function archiveInquiry(id, reason = "") {
  return api.patch(`/v1/inquiries/${encodeURIComponent(id)}/archive`, { reason });
}

/**
 * Restore an archived inquiry record.
 * @param {string} id - Inquiry ID
 * @returns {Promise<object>} Restored inquiry record
 */
export async function restoreInquiry(id) {
  const restored = await api.patch(`/v1/inquiries/${encodeURIComponent(id)}/restore`);
  return restored;
}
