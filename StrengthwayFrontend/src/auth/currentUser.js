import { STORAGE_KEYS } from "@/config/storageKeys";

const FALLBACK_ADMIN = {
  name: "StrengthWay Admin",
  role: "admin",
  displayRole: "Administrator",
  email: "admin@thestrengthway.com",
  trainerId: null,
  memberId: null,
};

/**
 * Normalizes any role string into one of the 3 supported system roles: 'admin' | 'trainer' | 'member'
 */
export function normalizeRole(roleStr) {
  if (!roleStr) return "admin";
  const r = String(roleStr).trim().toLowerCase();
  if (r.includes("admin")) return "admin";
  if (r.includes("trainer") || r.includes("coach")) return "trainer";
  if (r.includes("member") || r.includes("athlete")) return "member";
  return "member";
}

/**
 * Formats a normalized role into a display label.
 */
export function formatDisplayRole(role) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "trainer":
      return "Faculty Coach";
    case "member":
      return "Gym Athlete";
    default:
      return "Administrator";
  }
}

/**
 * Retrieves the currently logged-in user from the current tab's sessionStorage.
 * This guarantees that each browser tab maintains its own independent session.
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) {
      const user = JSON.parse(raw);
      let name = user.name;
      if (!name && user.email) {
        name = user.email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      const role = normalizeRole(user.role);
      const displayRole = formatDisplayRole(role);

      return {
        id: user.id || user._id,
        name: name || "StrengthWay",
        email: user.email || "user@thestrengthway.com",
        role,
        displayRole,
        trainerId: user.trainerId || null,
        memberId: user.memberId || null,
      };
    }
  } catch {
    // fallback
  }

  return isAuthenticated() ? FALLBACK_ADMIN : null;
}

/**
 * Checks whether an auth token exists in the current tab's sessionStorage.
 */
export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    const token = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return Boolean(token && token.trim().length > 0);
  } catch {
    return false;
  }
}

/**
 * Persists user session into the current tab's isolated sessionStorage.
 */
export function setAuthSession(token, user) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
    if (user) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    }
    // Clear localStorage credentials so tabs cannot bleed auth state
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch {
    // ignore
  }
}

/**
 * Clears authentication session for the current tab only.
 */
export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    sessionStorage.removeItem("strengthway_user_permissions");
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch {
    // ignore
  }
}

/**
 * Returns true if the current user possesses one of the allowed roles.
 */
export function hasRole(...allowedRoles) {
  if (!isAuthenticated()) return false;
  const user = getCurrentUser();
  if (!user) return false;
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  return normalizedAllowed.includes(user.role);
}

export function isAdmin() {
  return hasRole("admin");
}

export function isTrainer() {
  return hasRole("trainer");
}

export function isMember() {
  return hasRole("member");
}

/**
 * Returns the base URL path prefix according to user role ('/trainer', '/member', '/admin').
 */
export function getRoleBasePath(role) {
  const r = normalizeRole(role || getCurrentUser()?.role);
  if (r === "trainer") return "/trainer";
  if (r === "member") return "/member";
  return "/admin";
}

/**
 * Returns the primary landing dashboard route for the user.
 */
export function getDefaultRouteForUser(user) {
  const u = user || getCurrentUser();
  const r = normalizeRole(u?.role);
  if (r === "trainer") return "/trainer/dashboard";
  if (r === "member") return "/member/dashboard";
  return "/admin/dashboard";
}
