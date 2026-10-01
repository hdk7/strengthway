/**
 * Application Storage Keys Configuration
 *
 * Only client-side preference keys live here.
 * All business data (members, trainers, batches, plans, schedules, inquiries)
 * is persisted in the backend database — NOT in localStorage.
 */

export const STORAGE_KEYS = Object.freeze({
  /** UI colour theme ("light" | "dark" | "system") */
  THEME: import.meta.env.VITE_STORAGE_KEY_THEME ?? "theme",

  /** JWT returned by POST /api/v1/auth/login */
  AUTH_TOKEN: import.meta.env.VITE_STORAGE_KEY_AUTH_TOKEN ?? "tsw-token",

  /** Serialised user object { id, name, email, role } */
  AUTH_USER: import.meta.env.VITE_STORAGE_KEY_AUTH_USER ?? "tsw-user",
});

export default STORAGE_KEYS;
