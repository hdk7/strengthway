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
 * Retrieves the currently logged-in user from localStorage.
 */
export function getCurrentUser() {
  if (typeof window === "undefined") return FALLBACK_ADMIN;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
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

  return FALLBACK_ADMIN;
}

/**
 * Checks whether an auth token exists in localStorage.
 */
export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return Boolean(token && token.trim().length > 0);
  } catch {
    return false;
  }
}

/**
 * Returns true if the current user possesses one of the allowed roles.
 */
export function hasRole(...allowedRoles) {
  const user = getCurrentUser();
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

