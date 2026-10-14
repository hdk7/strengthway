import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, isAdmin } from "./currentUser";
import { getMyPermissions } from "@/lib/permissionsService";

const PERMISSIONS_STORAGE_KEY = "strengthway_user_permissions";

// In-memory cache
let inMemoryPermissions = null;

/**
 * Retrieves the stored permissions object from cache or sessionStorage
 */
export function getStoredPermissions() {
  if (inMemoryPermissions) return inMemoryPermissions;
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (raw) {
      inMemoryPermissions = JSON.parse(raw);
      return inMemoryPermissions;
    }
  } catch {
    // fallback
  }
  return {};
}

/**
 * Stores permissions in cache and sessionStorage
 */
export function setStoredPermissions(perms) {
  inMemoryPermissions = perms || {};
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(inMemoryPermissions));
      localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    } catch {
      // fallback
    }
  }
}

/**
 * Clears stored permissions from cache and sessionStorage
 */
export function clearStoredPermissions() {
  inMemoryPermissions = null;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(PERMISSIONS_STORAGE_KEY);
      localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    } catch {
      // fallback
    }
  }
}

/**
 * Core Permission Check Helper
 * ============================
 * Checks whether the current user has permission for a module and action.
 *
 * Rules:
 * - Admin always returns true.
 * - For Trainers & Members, inspects the active permission registry.
 *
 * @param {string} moduleName - Module identifier (e.g. 'members', 'attendance', 'payments')
 * @param {string} action - Action identifier (e.g. 'view', 'edit', 'mark_attendance')
 * @returns {boolean}
 */
export function can(moduleName, action) {
  // 1. Super-Admin bypass
  if (isAdmin()) return true;

  const user = getCurrentUser();
  if (!user) return false;

  const permissions = getStoredPermissions();
  const moduleActions = permissions[moduleName] || [];

  // Direct match
  if (moduleActions.includes(action)) return true;

  // Granular read variations:
  // If checking 'view', allow if user has 'view_assigned' or 'view_own'
  if (action === "view") {
    if (moduleActions.includes("view_assigned") || moduleActions.includes("view_own")) {
      return true;
    }
  }

  return false;
}

/**
 * Refetches current user permissions from the backend API
 */
export async function refreshUserPermissions() {
  if (isAdmin()) {
    return;
  }
  try {
    const res = await getMyPermissions();
    if (res?.permissions) {
      setStoredPermissions(res.permissions);
    }
  } catch {
    // Keep cached if offline
  }
}

/**
 * React Hook for Reactive Permission Checking
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState(() => getStoredPermissions());
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (isAdmin()) return;
    setLoading(true);
    try {
      const res = await getMyPermissions();
      if (res?.permissions) {
        setStoredPermissions(res.permissions);
        setPermissions(res.permissions);
      }
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const check = useCallback(
    (moduleName, action) => {
      if (isAdmin()) return true;
      const moduleActions = permissions[moduleName] || [];
      if (moduleActions.includes(action)) return true;
      if (action === "view") {
        if (moduleActions.includes("view_assigned") || moduleActions.includes("view_own")) {
          return true;
        }
      }
      return false;
    },
    [permissions]
  );

  return {
    permissions,
    loading,
    can: check,
    refresh: fetchPermissions,
  };
}
