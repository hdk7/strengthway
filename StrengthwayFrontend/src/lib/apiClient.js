/**
 * Strengthway API Client
 *
 * Centralized, authenticated fetch wrapper for all backend API calls.
 * - Reads JWT from localStorage (tsw-token) and injects Bearer header.
 * - Unwraps the backend { success, data, message } response envelope.
 * - Throws a structured ApiError on non-2xx responses.
 * - Redirects to /admin/login on 401 Unauthorized.
 */

import { STORAGE_KEYS } from "@/config/storageKeys";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

// ── Error class ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  /**
   * @param {string} message   Human-readable error message from the server.
   * @param {number} status    HTTP status code.
   * @param {object} [data]    Full error payload from the server.
   */
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ── Token helpers ──────────────────────────────────────────────────────────────

/** Read the stored JWT. Returns null if none is present. */
export function getAuthToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

/** Persist a new JWT to localStorage. */
export function setAuthToken(token) {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch {
    // Ignore quota / private-browsing errors
  }
}

/** Remove the JWT (called on logout or 401). */
export function clearAuthToken() {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch {
    // ignore
  }
}

// ── Core request ───────────────────────────────────────────────────────────────

/**
 * Make an authenticated HTTP request to the backend.
 *
 * @param {string} method        HTTP method (GET | POST | PUT | PATCH | DELETE)
 * @param {string} path          API path, e.g. "/v1/members" or "/v1/batches/BATCH-01"
 * @param {object} [body]        Request body (will be JSON-serialized).
 * @param {object} [options]     Additional fetch options (signal, headers, etc.)
 * @returns {Promise<any>}       Resolved with the `data` field from the response envelope.
 * @throws  {ApiError}           On any non-2xx HTTP response.
 */
async function request(method, path, body, options = {}) {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (networkError) {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
      null,
    );
  }

  // ── 401 Unauthorized — clear token and redirect to login ──────────────────
  if (response.status === 401) {
    clearAuthToken();
    // Only redirect if we are inside a browser and not already on the login page
    if (typeof window !== "undefined" && !window.location.pathname.includes("/admin/login")) {
      window.location.href = "/admin/login";
    }
    throw new ApiError("Session expired. Please sign in again.", 401, null);
  }

  // ── Parse JSON body ───────────────────────────────────────────────────────
  let json;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response (e.g. 204 No Content)
    if (!response.ok) {
      throw new ApiError(`Request failed: ${response.statusText}`, response.status, null);
    }
    return null;
  }

  // ── Non-2xx error ─────────────────────────────────────────────────────────
  if (!response.ok) {
    const message =
      json?.message ||
      json?.error ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, json);
  }

  // ── Unwrap backend envelope: { success, data, message } ──────────────────
  // If the response has a `data` key, return that; otherwise return the full object.
  return Object.prototype.hasOwnProperty.call(json, "data") ? json.data : json;
}

// ── Public API object ──────────────────────────────────────────────────────────

/**
 * Typed convenience wrappers around `request()`.
 *
 * Usage:
 *   import { api } from '@/lib/apiClient';
 *
 *   const members = await api.get('/v1/members');
 *   const created = await api.post('/v1/members', payload);
 *   const updated = await api.put('/v1/members/MEM-001', patch);
 *   await api.delete('/v1/members/MEM-001');
 */
export const api = {
  /** GET request — no body. */
  get(path, options) {
    return request("GET", path, undefined, options);
  },

  /** POST request — with JSON body. */
  post(path, body, options) {
    return request("POST", path, body, options);
  },

  /** PUT request — full replacement with JSON body. */
  put(path, body, options) {
    return request("PUT", path, body, options);
  },

  /** PATCH request — partial update with JSON body. */
  patch(path, body, options) {
    return request("PATCH", path, body, options);
  },

  /** DELETE request — with optional body or fetch options. */
  delete(path, bodyOrOptions, options) {
    if (bodyOrOptions && (bodyOrOptions.headers || bodyOrOptions.signal) && !options) {
      return request("DELETE", path, undefined, bodyOrOptions);
    }
    return request("DELETE", path, bodyOrOptions, options);
  },
};

export default api;
