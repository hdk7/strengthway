/* eslint-disable max-lines */
import { getTrainers, SEED_TRAINERS } from "./trainersService";
import { getMembers } from "./membersService";

export const STORAGE_KEY_BATCHES = "tsw-batches";
export const STORAGE_KEY_COACH_SHIFTS = "tsw-coach-shifts";
export const STORAGE_KEY_SCHEDULED_CLASSES = "tsw-scheduled-classes";

export const SHIFT_SLOTS = [
  { key: "6_00_am_mwf", label: "6.00 am MWF", time: "06:00 AM - 07:00 AM", days: "MWF" },
  { key: "8_00_am_mwf", label: "8.00am MWF", time: "08:00 AM - 09:00 AM", days: "MWF" },
  { key: "6_00_am_tts", label: "6 am TTS", time: "06:00 AM - 07:00 AM", days: "TTS" },
  { key: "8_00_am_tts", label: "8 AM TTS", time: "08:00 AM - 09:00 AM", days: "TTS" },
  { key: "6_30_pm_mwf", label: "6.30 PM MWF", time: "06:30 PM - 07:30 PM", days: "MWF" },
  { key: "8_00_pm_mwf", label: "8 00 PM MWF", time: "08:00 PM - 09:00 PM", days: "MWF" },
];

export const SEED_BATCHES = [];

export const SEED_COACH_SHIFTS = [
  {
    coachId: "TRN-101",
    coachName: "Dolliee",
    fullName: "Dolliee Ellens",
    role: "Head Functional Coach",
    shifts: {},
  },
  {
    coachId: "TRN-102",
    coachName: "Ashwin",
    fullName: "Ashwin Kumar",
    role: "Strength and Conditioning Specialist",
    shifts: {},
  },
  {
    coachId: "TRN-103",
    coachName: "Robert",
    fullName: "Robert Creflo",
    role: "Senior Strength and Rehab Specialist",
    shifts: {},
  },
];

export const SEED_SCHEDULED_CLASSES = [];

// --- Storage Utilities ---

function readStorage(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return [...defaultData];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (key === STORAGE_KEY_BATCHES) {
        return parsed;
      }
      if (key === STORAGE_KEY_SCHEDULED_CLASSES) {
        return parsed;
      }
      if (key === STORAGE_KEY_COACH_SHIFTS) {
        const validCoachIds = ["TRN-101", "TRN-102", "TRN-103"];
        const sanitized = parsed.filter((c) => validCoachIds.includes(c.coachId));
        if (sanitized.length === 0) {
          localStorage.setItem(key, JSON.stringify(defaultData));
          return [...defaultData];
        }
        if (sanitized.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(sanitized));
        }
        return sanitized;
      }
      return parsed;
    }
    localStorage.setItem(key, JSON.stringify(defaultData));
    return [...defaultData];
  } catch {
    return [...defaultData];
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  } catch (err) {
    console.error("LocalStorage write failed:", err);
  }
}

// --- Batches CRUD ---

export function getBatches() {
  return readStorage(STORAGE_KEY_BATCHES, SEED_BATCHES);
}

export function getBatchById(id) {
  const batches = getBatches();
  return batches.find((b) => b.id === id || b.id.toLowerCase() === id?.toLowerCase());
}

export function resolveDaysDetails(daysPattern, customLabel, customList) {
  if (customLabel && customList && Array.isArray(customList) && customList.length > 0) {
    return {
      daysPattern: daysPattern || "CUSTOM",
      daysLabel: customLabel,
      daysList: customList,
    };
  }

  const p = (daysPattern || "MWF").trim();
  if (p === "MWF") {
    return {
      daysPattern: "MWF",
      daysLabel: "Monday • Wednesday • Friday",
      daysList: ["Monday", "Wednesday", "Friday"],
    };
  }
  if (p === "TTS") {
    return {
      daysPattern: "TTS",
      daysLabel: "Tuesday • Thursday • Saturday",
      daysList: ["Tuesday", "Thursday", "Saturday"],
    };
  }
  if (p === "Mon - Fri" || p === "WEEKDAYS") {
    return {
      daysPattern: "Mon - Fri",
      daysLabel: "Monday to Friday (Weekdays)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };
  }
  if (p === "Mon - Sat" || p === "6DAYS") {
    return {
      daysPattern: "Mon - Sat",
      daysLabel: "Monday to Saturday (6 Days)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    };
  }
  if (p === "Daily" || p === "DAILY") {
    return {
      daysPattern: "Daily",
      daysLabel: "Monday to Sunday (All 7 Days)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    };
  }
  if (p === "Weekend" || p === "WEEKEND") {
    return {
      daysPattern: "Weekend",
      daysLabel: "Saturday • Sunday (Weekend)",
      daysList: ["Saturday", "Sunday"],
    };
  }

  return {
    daysPattern: p,
    daysLabel: customLabel || p,
    daysList: customList && customList.length > 0 ? customList : [p],
  };
}

export function createBatch(data) {
  const batches = getBatches();
  const maxNum = batches.reduce((max, b) => {
    const match = b.id?.match(/BATCH-(\d+)/i);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const nextNumber = maxNum + 1;
  const newId = data.id || `BATCH-${String(nextNumber).padStart(2, "0")}`;
  const daysInfo = resolveDaysDetails(data.daysPattern, data.daysLabel, data.daysList);

  const newBatch = {
    id: newId,
    name: data.name?.toUpperCase() || `BATCH ${nextNumber}`,
    shortName: data.shortName || `Batch ${nextNumber}`,
    startTime: data.startTime || "06:00 AM",
    endTime: data.endTime || "07:00 AM",
    timingLabel: `${data.startTime || "06:00 AM"} - ${data.endTime || "07:00 AM"}`,
    daysPattern: daysInfo.daysPattern,
    daysLabel: daysInfo.daysLabel,
    daysList: daysInfo.daysList,
    maxPax: Number(data.maxPax) || 28,
    currentPax: Number(data.currentPax) || 0,
    status: data.status || "Active",
    trainerIds: data.trainerIds || [],
    description: data.description || "General fitness training batch.",
    memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
    createdAt: new Date().toISOString(),
  };

  const updated = [...batches, newBatch];
  writeStorage(STORAGE_KEY_BATCHES, updated);
  return newBatch;
}

export function updateBatch(id, updates) {
  const batches = getBatches();
  const index = batches.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = batches[index];
  const daysInfo =
    updates.daysPattern || updates.daysLabel || updates.daysList
      ? resolveDaysDetails(
          updates.daysPattern !== undefined ? updates.daysPattern : current.daysPattern,
          updates.daysLabel !== undefined ? updates.daysLabel : current.daysLabel,
          updates.daysList !== undefined ? updates.daysList : current.daysList,
        )
      : null;

  const updatedBatch = {
    ...current,
    ...updates,
    timingLabel:
      updates.startTime && updates.endTime
        ? `${updates.startTime} - ${updates.endTime}`
        : current.timingLabel,
    ...(daysInfo
      ? {
          daysPattern: daysInfo.daysPattern,
          daysLabel: daysInfo.daysLabel,
          daysList: daysInfo.daysList,
        }
      : {}),
  };

  batches[index] = updatedBatch;
  writeStorage(STORAGE_KEY_BATCHES, batches);
  return updatedBatch;
}

export function deleteBatch(id) {
  const batches = getBatches();
  const filtered = batches.filter((b) => b.id !== id);
  writeStorage(STORAGE_KEY_BATCHES, filtered);
  return true;
}

// --- Coach Shift Matrix Operations ---

export function getCoachShiftMatrix() {
  return readStorage(STORAGE_KEY_COACH_SHIFTS, SEED_COACH_SHIFTS);
}

export function toggleCoachSlot(coachId, slotKey) {
  const matrix = getCoachShiftMatrix();
  const coach = matrix.find((c) => c.coachId === coachId);
  if (!coach) return null;

  const currentVal = !!coach.shifts[slotKey];
  coach.shifts[slotKey] = !currentVal;

  writeStorage(STORAGE_KEY_COACH_SHIFTS, matrix);

  // Sync with batch trainerIds if applicable
  const slot = SHIFT_SLOTS.find((s) => s.key === slotKey);
  if (slot && slot.batchId) {
    const batches = getBatches();
    const batch = batches.find((b) => b.id === slot.batchId);
    if (batch) {
      if (!currentVal) {
        if (!batch.trainerIds.includes(coachId)) {
          batch.trainerIds.push(coachId);
        }
      } else {
        batch.trainerIds = batch.trainerIds.filter((t) => t !== coachId);
      }
      writeStorage(STORAGE_KEY_BATCHES, batches);
    }
  }

  return coach;
}

// --- Scheduled Classes Operations ---

export function getAllScheduledClasses() {
  return readStorage(STORAGE_KEY_SCHEDULED_CLASSES, SEED_SCHEDULED_CLASSES);
}

export function getScheduledClassesByBatch(batchId) {
  const classes = getAllScheduledClasses();
  return classes.filter((c) => c.batchId === batchId);
}

export function updateDayClass(classId, updates) {
  const classes = getAllScheduledClasses();
  const index = classes.findIndex((c) => c.id === classId);
  if (index === -1) return null;

  classes[index] = { ...classes[index], ...updates };
  writeStorage(STORAGE_KEY_SCHEDULED_CLASSES, classes);
  return classes[index];
}

export function createDayClass(classData) {
  const classes = getAllScheduledClasses();
  const newId = `CLS-${Date.now().toString().slice(-4)}`;
  const newClass = {
    id: newId,
    ...classData,
  };
  classes.push(newClass);
  writeStorage(STORAGE_KEY_SCHEDULED_CLASSES, classes);
  return newClass;
}

// --- Cross-Entity Helpers ---

export function getBatchTrainers(trainerIds = []) {
  try {
    const allTrainers = getTrainers();
    return allTrainers.filter((t) => trainerIds.includes(t.id));
  } catch {
    return SEED_TRAINERS.filter((t) => trainerIds.includes(t.id));
  }
}

export function getBatchMembers(batchId, maxCount = 18) {
  try {
    const members = getMembers();
    const assigned = members.filter(
      (m) =>
        !m.isDeleted &&
        (m.batchId === batchId ||
          m.schedule?.batchId === batchId ||
          m.batchTiming?.toLowerCase() === batchId.toLowerCase()),
    );
    if (assigned.length > 0) return assigned;
    return members.slice(0, maxCount);
  } catch {
    return [];
  }
}

export function enrollMemberInBatch(batchId, memberId) {
  if (!batchId) return null;
  const batches = getBatches();
  const index = batches.findIndex(
    (b) => b.id === batchId || b.id.toLowerCase() === batchId.toLowerCase(),
  );
  if (index === -1) return null;

  const batch = batches[index];
  const currentPax = Number(batch.currentPax) || 0;
  const maxPax = Number(batch.maxPax) || 28;
  const memberIds = Array.isArray(batch.memberIds) ? [...batch.memberIds] : [];
  if (memberId && !memberIds.includes(memberId)) {
    memberIds.push(memberId);
  }

  const updatedBatch = {
    ...batch,
    currentPax: Math.min(maxPax, Math.max(currentPax + 1, memberIds.length)),
    memberIds,
  };

  batches[index] = updatedBatch;
  writeStorage(STORAGE_KEY_BATCHES, batches);
  return updatedBatch;
}
