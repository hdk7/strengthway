/**
 * Portfolio Service — Client API Wrapper
 *
 * Provides authenticated and public API operations for managing
 * the Portfolio Master module and hydrating public portfolio sections.
 */

import { api } from "@/lib/apiClient";

export const PORTFOLIO_CATEGORIES = Object.freeze({
  ALL: "ALL",
  PHOTO: "PHOTO",
  MOVEMENT_VIDEO: "MOVEMENT_VIDEO",
  SESSION_CLIP: "SESSION_CLIP",
  SESSION_DISCIPLINE: "SESSION_DISCIPLINE",
  FEEDBACK_STORY: "FEEDBACK_STORY",
});

export const CATEGORY_LABELS = Object.freeze({
  PHOTO: "Floor Photos",
  MOVEMENT_VIDEO: "Movement Videos",
  SESSION_CLIP: "Training Session Clips",
  SESSION_DISCIPLINE: "Session Disciplines",
  FEEDBACK_STORY: "Member Feedback & Stories",
});

export const PORTFOLIO_STATUSES = Object.freeze({
  ACTIVE: "Active",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
});

export const ASPECT_RATIOS = Object.freeze([
  "4:5",
  "16:9",
  "9:16",
  "1:1",
  "3:4",
]);

/**
 * Fetch public portfolio content grouped by category.
 * Used for fast rendering of Landing Page and Portfolio Page.
 */
export async function getPublicPortfolio() {
  try {
    const data = await api.get("/v1/portfolio/public");
    return data || null;
  } catch (err) {
    console.error("Failed to fetch public portfolio:", err);
    throw err;
  }
}

/**
 * Fetch paginated portfolio items with category, status, and search filters for Admin.
 */
export async function getPortfolioItems({
  category = "ALL",
  status = "ALL",
  search = "",
  includeDeleted = false,
  page = 1,
  pageSize = 12,
} = {}) {
  try {
    const params = new URLSearchParams();
    if (category && category !== "ALL") params.append("category", category);
    if (status && status !== "ALL") params.append("status", status);
    if (search && search.trim()) params.append("search", search.trim());
    if (includeDeleted) params.append("includeDeleted", "true");
    if (page) params.append("page", String(page));
    if (pageSize) params.append("pageSize", String(pageSize));

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get(`/v1/portfolio${queryStr}`);
    return response || { items: [], pagination: { total: 0, page: 1, totalPages: 1 }, stats: {} };
  } catch (err) {
    console.error("Failed to fetch portfolio items:", err);
    throw err;
  }
}

/**
 * Fetch a single portfolio item by ID.
 */
export async function getPortfolioItemById(id) {
  if (!id) return null;
  try {
    return await api.get(`/v1/portfolio/${encodeURIComponent(id)}`);
  } catch (err) {
    console.error(`Failed to fetch portfolio item ${id}:`, err);
    throw err;
  }
}

/**
 * Create a new portfolio item.
 */
export async function createPortfolioItem(data) {
  try {
    return await api.post("/v1/portfolio", data);
  } catch (err) {
    console.error("Failed to create portfolio item:", err);
    throw err;
  }
}

/**
 * Update an existing portfolio item.
 */
export async function updatePortfolioItem(id, data) {
  try {
    return await api.put(`/v1/portfolio/${encodeURIComponent(id)}`, data);
  } catch (err) {
    console.error(`Failed to update portfolio item ${id}:`, err);
    throw err;
  }
}

/**
 * Toggle an item's status between Active and Draft.
 */
export async function togglePortfolioItemStatus(id) {
  try {
    return await api.patch(`/v1/portfolio/${encodeURIComponent(id)}/toggle-status`);
  } catch (err) {
    console.error(`Failed to toggle status for portfolio item ${id}:`, err);
    throw err;
  }
}

/**
 * Batch reorder items by providing an array of { id, displayOrder }.
 */
export async function reorderPortfolioItems(items) {
  try {
    return await api.patch("/v1/portfolio/reorder", { items });
  } catch (err) {
    console.error("Failed to reorder portfolio items:", err);
    throw err;
  }
}

/**
 * Soft-delete an item (moves to archived status).
 */
export async function softDeletePortfolioItem(id) {
  try {
    return await api.patch(`/v1/portfolio/${encodeURIComponent(id)}/soft-delete`);
  } catch (err) {
    console.error(`Failed to archive portfolio item ${id}:`, err);
    throw err;
  }
}

/**
 * Restore an archived item.
 */
export async function restorePortfolioItem(id) {
  try {
    return await api.patch(`/v1/portfolio/${encodeURIComponent(id)}/restore`);
  } catch (err) {
    console.error(`Failed to restore portfolio item ${id}:`, err);
    throw err;
  }
}

/**
 * Permanently delete a portfolio item from the database.
 */
export async function permanentDeletePortfolioItem(id) {
  try {
    return await api.delete(`/v1/portfolio/${encodeURIComponent(id)}/permanent`);
  } catch (err) {
    console.error(`Failed to permanently delete portfolio item ${id}:`, err);
    throw err;
  }
}
