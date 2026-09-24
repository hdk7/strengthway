export const STORAGE_KEY = "tsw-registered-members";

export const SEED_MEMBERS = [];

const LEGACY_MOCK_IDS = ["MEM-1001", "MEM-1002", "MEM-1003", "MEM-1004"];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = parsed.filter((m) => !LEGACY_MOCK_IDS.includes(m.id));
      if (sanitized.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch {
    return [];
  }
}

function writeStorage(members) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    // ignore storage write error in restricted env
  }
}

export function getMembers(includeDeleted = false) {
  const all = readStorage();
  if (includeDeleted) return all;
  return all.filter((m) => !m.isDeleted);
}

export function getMemberById(id) {
  const all = readStorage();
  return all.find((m) => m.id === id) || null;
}

export function createMember(data) {
  const all = readStorage();
  const newMember = {
    id: data.id || `MEM-${Date.now().toString().slice(-4)}`,
    ...data,
    status: data.status || "Active",
    isDeleted: false,
    deletedAt: null,
    registeredAt: data.registeredAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newMember, ...all];
  writeStorage(updated);
  return newMember;
}

export function updateMember(id, updates) {
  const all = readStorage();
  let updatedMember = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      updatedMember = {
        ...m,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedMember;
    }
    return m;
  });
  writeStorage(updated);
  return updatedMember;
}

/**
 * Soft delete: sets isDeleted = true, status = "Archived", preserves member data.
 */
export function softDeleteMember(id) {
  const all = readStorage();
  let deletedMember = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      deletedMember = {
        ...m,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        status: "Archived",
      };
      return deletedMember;
    }
    return m;
  });
  writeStorage(updated);
  return deletedMember;
}

/**
 * Restores a soft-deleted member back to Active status.
 */
export function restoreMember(id) {
  const all = readStorage();
  let restoredMember = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      restoredMember = {
        ...m,
        isDeleted: false,
        deletedAt: null,
        status: "Active",
      };
      return restoredMember;
    }
    return m;
  });
  writeStorage(updated);
  return restoredMember;
}

/**
 * Permanently removes a member record from storage.
 */
export function permanentDeleteMember(id) {
  const all = readStorage();
  const updated = all.filter((m) => m.id !== id);
  writeStorage(updated);
  return true;
}

export function toggleMemberStatus(id) {
  const all = readStorage();
  let toggled = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      const nextStatus = m.status === "Active" ? "Inactive" : "Active";
      toggled = { ...m, status: nextStatus, updatedAt: new Date().toISOString() };
      return toggled;
    }
    return m;
  });
  writeStorage(updated);
  return toggled;
}

/**
 * Converts a prospective Lead into a confirmed Active member with emergency contact,
 * fitness information, membership plan, and payment details.
 */
export function convertLeadToMember(id, additionalDetails = {}) {
  const all = readStorage();
  let converted = null;
  const updated = all.map((m) => {
    if (m.id === id) {
      converted = {
        ...m,
        ...additionalDetails,
        status: "Active",
        convertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return converted;
    }
    return m;
  });
  if (converted) {
    writeStorage(updated);
    return converted;
  }

  // If not found in members storage (e.g. from Inquiry), create directly as an active member:
  const newMember = {
    id: id?.startsWith("MEM-") ? id : `MEM-${Date.now().toString().slice(-4)}`,
    ...additionalDetails,
    status: "Active",
    isDeleted: false,
    convertedAt: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeStorage([newMember, ...all]);
  return newMember;
}
