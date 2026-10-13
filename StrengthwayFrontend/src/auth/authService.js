import { ApiError } from "@/lib/apiClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@strengthway.com", password: "Admin@2026" },
  { role: "trainer", label: "Trainer", email: "trainer@strengthway.com", password: "Trainer@2026" },
  { role: "member", label: "Member", email: "member@strengthway.com", password: "Member@2026" },
];
export const DEMO_CREDENTIALS = { email: "admin@strengthway.com", password: "Admin@2026" };
export const DEMO_MODE = true;

// Re-export ApiError under the legacy name so imports in LoginPage keep working.
export { ApiError as AuthError };

/**
 * Authenticate an admin user against the backend.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 * @throws {ApiError} on network failure or invalid credentials
 */
export async function loginAdmin({ email, password }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new ApiError("Unexpected server response. Please try again.", response.status);
  }

  if (!response.ok) {
    const msg =
      json?.message ||
      (response.status === 401
        ? "Incorrect email or password."
        : "Something went wrong. Please try again.");
    throw new ApiError(msg, response.status, json);
  }

  // Backend returns { success, data: { token, user }, message }
  return json.data ?? json;
}

/**
 * Request a password-reset link for the given email.
 *
 * @param {string} email
 * @returns {Promise<{ message: string }>}
 * @throws {ApiError}
 */
export async function forgotPassword(email) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new ApiError("Unexpected server response.", response.status);
  }

  if (!response.ok) {
    throw new ApiError(
      json?.message || "Something went wrong. Please try again.",
      response.status,
      json,
    );
  }

  return json.data ?? json;
}
