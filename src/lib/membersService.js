export const STORAGE_KEY = "tsw-registered-members";

export const SEED_MEMBERS = [
  {
    id: "MEM-1001",
    firstName: "Vikram",
    lastName: "Sharma",
    dob: "1994-06-15",
    gender: "Male",
    mobile: "+91 98201 43210",
    email: "vikram.sharma@example.com",
    photo: null,
    address: "B-402, Lotus Heights, Andheri West",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400053",
    emergencyName: "Sunita Sharma",
    emergencyRelationship: "Spouse",
    emergencyNumber: "+91 98201 43299",
    height: "178",
    weight: "76",
    medicalDoc: "fitness_cert_vikram.pdf",
    medicalDocName: "fitness_cert_vikram.pdf",
    medicalDocSize: "1.2 MB",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    registeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "MEM-1002",
    firstName: "Ananya",
    lastName: "Patel",
    dob: "1998-03-22",
    gender: "Female",
    mobile: "+91 98450 12890",
    email: "ananya.patel@example.com",
    photo: null,
    address: "703, Cyber View Apts, HSR Layout",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    pincode: "560102",
    emergencyName: "Rajesh Patel",
    emergencyRelationship: "Parent",
    emergencyNumber: "+91 98450 12800",
    height: "164",
    weight: "58",
    medicalDoc: "medical_report.pdf",
    medicalDocName: "medical_report.pdf",
    medicalDocSize: "840 KB",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    registeredAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "MEM-1003",
    firstName: "Rohan",
    lastName: "Verma",
    dob: "1992-11-08",
    gender: "Male",
    mobile: "+91 97110 56432",
    email: "rohan.verma@example.com",
    photo: null,
    address: "Flat 12, Gulmohar Enclave",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    pincode: "110016",
    emergencyName: "Kavita Verma",
    emergencyRelationship: "Sibling",
    emergencyNumber: "+91 97110 56400",
    height: "182",
    weight: "84",
    medicalDoc: null,
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    registeredAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "MEM-1004",
    firstName: "Priya",
    lastName: "Nair",
    dob: "1996-09-30",
    gender: "Female",
    mobile: "+91 98950 78123",
    email: "priya.nair@example.com",
    photo: null,
    address: "Villa 8, Palm Meadows",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    pincode: "682024",
    emergencyName: "Deepak Nair",
    emergencyRelationship: "Parent",
    emergencyNumber: "+91 98950 78100",
    height: "168",
    weight: "62",
    medicalDoc: "health_clearance.pdf",
    medicalDocName: "health_clearance.pdf",
    medicalDocSize: "2.1 MB",
    status: "Active",
    isDeleted: false,
    deletedAt: null,
    registeredAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
      return [...SEED_MEMBERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
    return [...SEED_MEMBERS];
  } catch {
    return [...SEED_MEMBERS];
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
  writeStorage(updated);
  return converted;
}
