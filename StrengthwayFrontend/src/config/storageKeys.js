/**
 * Application Storage Keys Configuration
 *
 * Theme preference is stored in localStorage across browser windows.
 * Authentication session keys (AUTH_TOKEN, AUTH_USER) are stored in sessionStorage
 * to ensure tab-isolated authentication sessions and prevent role bleed across tabs.
 */

export const STORAGE_KEYS = Object.freeze({
  /** UI colour theme ("light" | "dark" | "system") — persistent in localStorage */
  THEME: import.meta.env.VITE_STORAGE_KEY_THEME ?? "theme",

  /** JWT returned by auth login — tab-isolated in sessionStorage */
  AUTH_TOKEN: import.meta.env.VITE_STORAGE_KEY_AUTH_TOKEN ?? "tsw-token",

  /** Serialised user object { id, name, email, role } — tab-isolated in sessionStorage */
  AUTH_USER: import.meta.env.VITE_STORAGE_KEY_AUTH_USER ?? "tsw-user",
});

export default STORAGE_KEYS;
