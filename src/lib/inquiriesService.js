// Inquiries service with localStorage persistence
const INQUIRIES_STORAGE_KEY = "thestrengthway_inquiries_data_v1";

function readStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeStorage(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore storage write errors
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
    id: `INQ-${Date.now().toString().slice(-6)}`,
    name: data.name?.trim() || "",
    gender: data.gender || "",
    mobile: data.mobile?.trim() || "",
    email: data.email?.trim() || "",
    address: data.address?.trim() || "",
    subject: data.subject?.trim() || "General Inquiry",
    message: data.message?.trim() || "",
    status: data.status === "Lead" ? "Inquiry" : data.status || "Inquiry", // "Inquiry" | "Contacted" | "Converted" | "Archived"
    createdAt: new Date().toISOString(),
  };

  const updated = [newInquiry, ...all];
  writeStorage(updated);
  return newInquiry;
}

export function updateInquiryStatus(id, status) {
  const all = readStorage();
  let updatedInquiry = null;
  const updated = all.map((item) => {
    if (item.id === id) {
      updatedInquiry = { ...item, status, updatedAt: new Date().toISOString() };
      return updatedInquiry;
    }
    return item;
  });
  if (updatedInquiry) {
    writeStorage(updated);
  }
  return updatedInquiry;
}

export function updateInquiry(id, patch) {
  const all = readStorage();
  let updatedInquiry = null;
  const updated = all.map((item) => {
    if (item.id === id) {
      updatedInquiry = { ...item, ...patch, updatedAt: new Date().toISOString() };
      return updatedInquiry;
    }
    return item;
  });
  if (updatedInquiry) {
    writeStorage(updated);
  }
  return updatedInquiry;
}

export function deleteInquiry(id) {
  const all = readStorage();
  const filtered = all.filter((item) => item.id !== id);
  writeStorage(filtered);
  return true;
}
