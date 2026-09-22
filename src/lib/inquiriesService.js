export const STORAGE_KEY = "tsw-inquiries";

export const SEED_INQUIRIES = [
  {
    id: "INQ-501",
    name: "Arjun Kapoor",
    email: "arjun.kapoor@example.com",
    subject: "Personal Training & Nutrition Guidance",
    message:
      "Hi, I am looking for a 1-on-1 personal trainer for strength training and body recomposition. Could you please share trainer availability and pricing packages?",
    status: "New", // 'New' | 'In Progress' | 'Resolved'
    notes: "",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "INQ-502",
    name: "Meera Sen",
    email: "meera.sen@example.com",
    subject: "Corporate Membership Inquiry",
    message:
      "Hello! We are looking to sponsor gym memberships for a team of 25 engineers located in Bandra Kurla Complex. Do you offer corporate packages?",
    status: "In Progress",
    notes: "Followed up with corporate brochure on Sept 20.",
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "INQ-503",
    name: "Siddharth Rao",
    email: "sid.rao@example.com",
    subject: "Early Morning Slot Timing",
    message:
      "Is the gym open at 5:30 AM for functional training sessions? Also interested in the weekend batches.",
    status: "Resolved",
    notes: "Informed regarding 5:00 AM opening time and morning batches.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INQUIRIES));
      return [...SEED_INQUIRIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_INQUIRIES));
    return [...SEED_INQUIRIES];
  } catch {
    return [...SEED_INQUIRIES];
  }
}

function writeStorage(inquiries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
  } catch {
    // ignore
  }
}

export function getInquiries() {
  return readStorage();
}

export function getInquiryById(id) {
  const all = readStorage();
  return all.find((item) => item.id === id) || null;
}

export function createInquiry(data) {
  const all = readStorage();
  const newInquiry = {
    id: data.id || `INQ-${Date.now().toString().slice(-4)}`,
    name: data.name || "",
    email: data.email || "",
    subject: data.subject || "General Inquiry",
    message: data.message || "",
    status: data.status || "New",
    notes: data.notes || "",
    createdAt: new Date().toISOString(),
  };
  const updated = [newInquiry, ...all];
  writeStorage(updated);
  return newInquiry;
}

export function updateInquiry(id, updates) {
  const all = readStorage();
  let updatedInquiry = null;
  const updated = all.map((item) => {
    if (item.id === id) {
      updatedInquiry = {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return updatedInquiry;
    }
    return item;
  });
  writeStorage(updated);
  return updatedInquiry;
}

export function deleteInquiry(id) {
  const all = readStorage();
  const updated = all.filter((item) => item.id !== id);
  writeStorage(updated);
  return true;
}
