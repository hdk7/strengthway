/**
 * Portfolio API Service
 *
 * Handles all client-side communications for the Portfolio landing page
 * and the Portfolio Masters module in the Admin dashboard.
 */

import { api } from "./apiClient";

/**
 * Fetch all active portfolio items grouped by section (public unauthenticated).
 * @returns {Promise<{ sessions: Array, sessionClips: Array, feedbackQuotes: Array, feedbackVideos: Array, photos: Array, videos: Array }>}
 */
export async function getPublicPortfolio() {
  return api.get("/v1/portfolio/public");
}

/**
 * Fetch filtered & paginated portfolio items for the Admin Masters module.
 * @param {object} params
 * @param {string} [params.section] - Filter by section ("TRAINING_SESSION", "FEEDBACK_QUOTE", etc.)
 * @param {string} [params.status]  - Filter by status ("Active" | "Inactive" | "ALL")
 * @param {string} [params.search]  - Search term
 * @param {number} [params.page]    - 1-indexed page number
 * @param {number} [params.pageSize]- Items per page
 * @returns {Promise<any>}
 */
export async function getPortfolioItems({
  section = "ALL",
  status = "ALL",
  search = "",
  page = 1,
  pageSize = 50,
} = {}) {
  const params = new URLSearchParams();
  if (section && section !== "ALL") params.set("section", section);
  if (status && status !== "ALL") params.set("status", status);
  if (search && search.trim()) params.set("search", search.trim());
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));

  const queryStr = params.toString();
  return api.get(`/v1/portfolio${queryStr ? `?${queryStr}` : ""}`);
}

/**
 * Fetch a single portfolio item by unique ID.
 * @param {string} id
 */
export async function getPortfolioItemById(id) {
  return api.get(`/v1/portfolio/${id}`);
}

/**
 * Create a new portfolio item.
 * @param {object} data
 */
export async function createPortfolioItem(data) {
  return api.post("/v1/portfolio", data);
}

/**
 * Update an existing portfolio item.
 * @param {string} id
 * @param {object} data
 */
export async function updatePortfolioItem(id, data) {
  return api.put(`/v1/portfolio/${id}`, data);
}

/**
 * Toggle active/inactive status of a portfolio item.
 * @param {string} id
 */
export async function togglePortfolioItemStatus(id) {
  return api.patch(`/v1/portfolio/${id}/status`);
}

/**
 * Bulk reorder portfolio items.
 * @param {Array<{ id: string, order: number }>} items
 */
export async function reorderPortfolioItems(items) {
  return api.patch("/v1/portfolio/reorder", { items });
}

/**
 * Delete a portfolio item (soft-delete by default, or permanent).
 * @param {string} id
 * @param {boolean} [permanent=false]
 */
export async function deletePortfolioItem(id, permanent = false) {
  return api.delete(`/v1/portfolio/${id}${permanent ? "?permanent=true" : ""}`);
}

/**
 * Admin utility to trigger default database seeding.
 */
export async function seedPortfolioItems() {
  return api.post("/v1/portfolio/seed");
}

/**
 * Upload portfolio media (supports photo or video dynamically).
 * @param {File} file
 * @returns {Promise<{ url: string, publicId: string, format: string, resourceType: string, thumbnailUrl?: string }>}
 */
export async function uploadPortfolioMedia(file) {
  if (!file) throw new Error("No file selected.");
  const formData = new FormData();
  formData.append("media", file);
  return api.upload("/v1/uploads/portfolio-media", formData);
}

/**
 * Upload a video specifically to the video upload endpoint.
 * @param {File} file
 * @returns {Promise<{ url: string, thumbnailUrl: string, publicId: string, duration?: number }>}
 */
export async function uploadVideo(file) {
  if (!file) throw new Error("No video file selected.");
  const formData = new FormData();
  formData.append("video", file);
  return api.upload("/v1/uploads/video", formData);
}

/**
 * Upload a photo.
 * @param {File} file
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadPhoto(file) {
  if (!file) throw new Error("No photo selected.");
  const formData = new FormData();
  formData.append("photo", file);
  return api.upload("/v1/uploads/photo", formData);
}
