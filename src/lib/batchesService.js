/* eslint-disable max-lines */
import { getTrainers, SEED_TRAINERS } from "./trainersService";
import { getMembers } from "./membersService";

export const STORAGE_KEY_BATCHES = "tsw-batches";
export const STORAGE_KEY_COACH_SHIFTS = "tsw-coach-shifts";
export const STORAGE_KEY_SCHEDULED_CLASSES = "tsw-scheduled-classes";

export const SHIFT_SLOTS = [
  { key: "6_00_am_mwf", label: "6.00 am MWF", batchId: "BATCH-01", time: "06:00 AM - 07:00 AM", days: "MWF" },
  { key: "8_00_am_mwf", label: "8.00am MWF", batchId: "BATCH-02", time: "08:00 AM - 09:00 AM", days: "MWF" },
  { key: "6_00_am_tts", label: "6 am TTS", batchId: "BATCH-04", time: "06:00 AM - 07:00 AM", days: "TTS" },
  { key: "8_00_am_tts", label: "8 AM TTS", batchId: "BATCH-05", time: "08:00 AM - 09:00 AM", days: "TTS" },
  { key: "6_30_pm_mwf", label: "6.30 PM MWF", batchId: "BATCH-03", time: "06:30 PM - 07:30 PM", days: "MWF" },
  { key: "8_00_pm_mwf", label: "8 00 PM MWF", batchId: "BATCH-06", time: "08:00 PM - 09:00 PM", days: "MWF" },
];

export const SEED_BATCHES = [
  {
    id: "BATCH-01",
    name: "BATCH 1",
    shortName: "Batch 1",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    timingLabel: "06:00 AM - 07:00 AM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    maxPax: 28,
    currentPax: 18,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-103"], // Dolliee & Robert
    slotKey: "6_00_am_mwf",
    description: "High-intensity morning functional fitness & barbell strength foundations.",
  },
  {
    id: "BATCH-02",
    name: "BATCH 2",
    shortName: "Batch 2",
    startTime: "08:00 AM",
    endTime: "09:00 AM",
    timingLabel: "08:00 AM - 09:00 AM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    maxPax: 28,
    currentPax: 21,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-103", "TRN-106"],
    slotKey: "8_00_am_mwf",
    description: "Mid-morning hypertrophy and athletic conditioning program.",
  },
  {
    id: "BATCH-03",
    name: "BATCH 3",
    shortName: "Batch 3",
    startTime: "06:30 PM",
    endTime: "07:30 PM",
    timingLabel: "06:30 PM - 07:30 PM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    maxPax: 28,
    currentPax: 25,
    status: "Active",
    trainerIds: ["TRN-103", "TRN-104", "TRN-106"],
    slotKey: "6_30_pm_mwf",
    description: "Prime-time evening strength, powerlifting, and interval burn.",
  },
  {
    id: "BATCH-04",
    name: "BATCH 4",
    shortName: "Batch 4",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    timingLabel: "06:00 AM - 07:00 AM",
    daysPattern: "TTS",
    daysLabel: "Tuesday • Thursday • Saturday",
    daysList: ["Tuesday", "Thursday", "Saturday"],
    maxPax: 28,
    currentPax: 15,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-105"],
    slotKey: "6_00_am_tts",
    description: "Early morning functional mobility, core endurance, and squat cycle.",
  },
  {
    id: "BATCH-05",
    name: "BATCH 5",
    shortName: "Batch 5",
    startTime: "08:00 AM",
    endTime: "09:00 AM",
    timingLabel: "08:00 AM - 09:00 AM",
    daysPattern: "TTS",
    daysLabel: "Tuesday • Thursday • Saturday",
    daysList: ["Tuesday", "Thursday", "Saturday"],
    maxPax: 28,
    currentPax: 23,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-103", "TRN-105"],
    slotKey: "8_00_am_tts",
    description: "Mid-morning full body kettlebell mastery and explosive power.",
  },
  {
    id: "BATCH-06",
    name: "BATCH 6",
    shortName: "Batch 6",
    startTime: "08:00 PM",
    endTime: "09:00 PM",
    timingLabel: "08:00 PM - 09:00 PM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    maxPax: 28,
    currentPax: 17,
    status: "Active",
    trainerIds: ["TRN-104", "TRN-105", "TRN-106"],
    slotKey: "8_00_pm_mwf",
    description: "Late evening metabolic conditioning and heavy lifting session.",
  },
];

export const SEED_COACH_SHIFTS = [
  {
    coachId: "TRN-101",
    coachName: "Dolliee",
    fullName: "Dolliee Ellens",
    role: "Head Functional Coach",
    shifts: {
      "6_00_am_mwf": true,
      "8_00_am_mwf": true,
      "6_00_am_tts": true,
      "8_00_am_tts": true,
      "6_30_pm_mwf": false,
      "8_00_pm_mwf": false,
    },
  },
  {
    coachId: "TRN-103",
    coachName: "ROBERT",
    fullName: "Robert Creflo",
    role: "Senior Strength & Rehab Specialist",
    shifts: {
      "6_00_am_mwf": true,
      "8_00_am_mwf": true,
      "6_00_am_tts": false,
      "8_00_am_tts": true,
      "6_30_pm_mwf": true,
      "8_00_pm_mwf": false,
    },
  },
  {
    coachId: "TRN-104",
    coachName: "BHARATH",
    fullName: "Bharath Kumar",
    role: "Olympic Lifting & Power Coach",
    shifts: {
      "6_00_am_mwf": false,
      "8_00_am_mwf": false,
      "6_00_am_tts": false,
      "8_00_am_tts": false,
      "6_30_pm_mwf": true,
      "8_00_pm_mwf": true,
    },
  },
  {
    coachId: "TRN-105",
    coachName: "RENGARAJ",
    fullName: "Rengaraj Selvam",
    role: "CrossFit & Conditioning Specialist",
    shifts: {
      "6_00_am_mwf": false,
      "8_00_am_mwf": false,
      "6_00_am_tts": true,
      "8_00_am_tts": true,
      "6_30_pm_mwf": false,
      "8_00_pm_mwf": true,
    },
  },
  {
    coachId: "TRN-106",
    coachName: "F COACH",
    fullName: "Farah Al-Mansoor",
    role: "Aerobic & Functional Strength Coach",
    shifts: {
      "6_00_am_mwf": true,
      "8_00_am_mwf": true,
      "6_00_am_tts": false,
      "8_00_am_tts": false,
      "6_30_pm_mwf": true,
      "8_00_pm_mwf": true,
    },
  },
];

export const SEED_SCHEDULED_CLASSES = [
  // BATCH 1 (MWF 06:00 AM - 07:00 AM)
  {
    id: "CLS-101",
    batchId: "BATCH-01",
    day: "Monday",
    title: "Barbell Foundations & Upper Strength",
    category: "Strength & Hypertrophy",
    focus: "Overhead Press, Bench Dynamics & Pull-up progression",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-102",
    batchId: "BATCH-01",
    day: "Wednesday",
    title: "Functional HIIT & Aerobic Engine",
    category: "Cardio & Engine",
    focus: "Rowing sprints, SkiErg intervals & kettlebell flow",
    intensity: "Peak",
    room: "Turf Track & Rig Zone",
    coachId: "TRN-103",
    coachName: "Robert Creflo",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-103",
    batchId: "BATCH-01",
    day: "Friday",
    title: "Olympic Lifting & Power Deadlifts",
    category: "Powerlifting",
    focus: "Snatch drill, clean & jerk complex and deadlift singles",
    intensity: "High",
    room: "Olympic Platform 1-4",
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    time: "06:00 AM - 07:00 AM",
  },

  // BATCH 2 (MWF 08:00 AM - 09:00 AM)
  {
    id: "CLS-201",
    batchId: "BATCH-02",
    day: "Monday",
    title: "Full Body Functional Hypertrophy",
    category: "Hypertrophy",
    focus: "Incline dumbbell press, barbell rows & core supersets",
    intensity: "Medium",
    room: "Main Rig Zone",
    coachId: "TRN-103",
    coachName: "Robert Creflo",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-202",
    batchId: "BATCH-02",
    day: "Wednesday",
    title: "Metabolic Threshold & Core Circuit",
    category: "Conditioning",
    focus: "AirBike intervals, medicine ball slams & plank progressions",
    intensity: "Peak",
    room: "Turf Zone",
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-203",
    batchId: "BATCH-02",
    day: "Friday",
    title: "Lower Body Explosive Power",
    category: "Strength",
    focus: "Back squats, Romanian deadlifts & box jumps",
    intensity: "High",
    room: "Olympic Platforms",
    coachId: "TRN-106",
    coachName: "Farah Al-Mansoor",
    time: "08:00 AM - 09:00 AM",
  },

  // BATCH 3 (MWF 06:30 PM - 07:30 PM)
  {
    id: "CLS-301",
    batchId: "BATCH-03",
    day: "Monday",
    title: "Heavy Barbell Bench & Back Mechanics",
    category: "Powerlifting",
    focus: "Pause bench press, barbell pendlay rows & tricep lockouts",
    intensity: "High",
    room: "Power Racks 1-6",
    coachId: "TRN-104",
    coachName: "Bharath Kumar",
    time: "06:30 PM - 07:30 PM",
  },
  {
    id: "CLS-302",
    batchId: "BATCH-03",
    day: "Wednesday",
    title: "Cross-Training High Velocity EMOM",
    category: "Functional HIIT",
    focus: "Every minute on the minute kettlebell thrusters & burpees",
    intensity: "Peak",
    room: "Functional Turf",
    coachId: "TRN-106",
    coachName: "Farah Al-Mansoor",
    time: "06:30 PM - 07:30 PM",
  },
  {
    id: "CLS-303",
    batchId: "BATCH-03",
    day: "Friday",
    title: "Max Effort Squats & Posterior Chain",
    category: "Strength",
    focus: "Progressive wave load squats & glute-ham development",
    intensity: "High",
    room: "Olympic Platforms",
    coachId: "TRN-103",
    coachName: "Robert Creflo",
    time: "06:30 PM - 07:30 PM",
  },

  // BATCH 4 (TTS 06:00 AM - 07:00 AM)
  {
    id: "CLS-401",
    batchId: "BATCH-04",
    day: "Tuesday",
    title: "Squat Depth Progression & Hip Mobility",
    category: "Strength & Mobility",
    focus: "Front squat technique, ankle dorsiflexion & pause squats",
    intensity: "High",
    room: "Olympic Platforms",
    coachId: "TRN-105",
    coachName: "Rengaraj Selvam",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-402",
    batchId: "BATCH-04",
    day: "Thursday",
    title: "Kettlebell Flow & Core Stability",
    category: "Conditioning",
    focus: "Turkish get-ups, single-arm swings & overhead carries",
    intensity: "Medium",
    room: "Turf Track",
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-403",
    batchId: "BATCH-04",
    day: "Saturday",
    title: "Team Strongman & Gauntlet Challenge",
    category: "Team Conditioning",
    focus: "Sled push-pulls, farmer carries & partner tire flips",
    intensity: "Peak",
    room: "Outdoor Turf & Rig",
    coachId: "TRN-105",
    coachName: "Rengaraj Selvam",
    time: "06:00 AM - 07:00 AM",
  },

  // BATCH 5 (TTS 08:00 AM - 09:00 AM)
  {
    id: "CLS-501",
    batchId: "BATCH-05",
    day: "Tuesday",
    title: "Athletic Conditioning & Agility Drills",
    category: "Athletic Performance",
    focus: "Cone agility, acceleration mechanics & plyometrics",
    intensity: "High",
    room: "Sprint Track",
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-502",
    batchId: "BATCH-05",
    day: "Thursday",
    title: "Hypertrophy Volume & Shoulder Sculpt",
    category: "Hypertrophy",
    focus: "Dumbbell lateral raise clusters, rear delt flyes & dips",
    intensity: "Medium",
    room: "Main Rig Zone",
    coachId: "TRN-103",
    coachName: "Robert Creflo",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-503",
    batchId: "BATCH-05",
    day: "Saturday",
    title: "Weekend Endurance Partner WOD",
    category: "Functional HIIT",
    focus: "Rowing + box jump overs + wall ball team workout",
    intensity: "Peak",
    room: "Rig & Turf Zone",
    coachId: "TRN-105",
    coachName: "Rengaraj Selvam",
    time: "08:00 AM - 09:00 AM",
  },

  // BATCH 6 (MWF 08:00 PM - 09:00 PM)
  {
    id: "CLS-601",
    batchId: "BATCH-06",
    day: "Monday",
    title: "Night Owl Barbell Heavy Reps",
    category: "Strength",
    focus: "Deadlift clusters & heavy barbell rows",
    intensity: "High",
    room: "Olympic Platforms",
    coachId: "TRN-104",
    coachName: "Bharath Kumar",
    time: "08:00 PM - 09:00 PM",
  },
  {
    id: "CLS-602",
    batchId: "BATCH-06",
    day: "Wednesday",
    title: "Metabolic Sweat & Core Flush",
    category: "Conditioning",
    focus: "Kettlebell complexes, battle ropes & hollow holds",
    intensity: "High",
    room: "Turf Zone",
    coachId: "TRN-106",
    coachName: "Farah Al-Mansoor",
    time: "08:00 PM - 09:00 PM",
  },
  {
    id: "CLS-603",
    batchId: "BATCH-06",
    day: "Friday",
    title: "Friday PR Lift & Team High Fives",
    category: "Powerlifting",
    focus: "Personal record attempt session & cooldown stretch",
    intensity: "Peak",
    room: "Main Rig Zone",
    coachId: "TRN-105",
    coachName: "Rengaraj Selvam",
    time: "08:00 PM - 09:00 PM",
  },
];

// --- Storage Utilities ---

function readStorage(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return [...defaultData];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
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

export function createBatch(data) {
  const batches = getBatches();
  const nextNumber = batches.length + 1;
  const newId = `BATCH-${String(nextNumber).padStart(2, "0")}`;
  const newBatch = {
    id: newId,
    name: data.name?.toUpperCase() || `BATCH ${nextNumber}`,
    shortName: data.shortName || `Batch ${nextNumber}`,
    startTime: data.startTime || "06:00 AM",
    endTime: data.endTime || "07:00 AM",
    timingLabel: `${data.startTime || "06:00 AM"} - ${data.endTime || "07:00 AM"}`,
    daysPattern: data.daysPattern || "MWF",
    daysLabel:
      data.daysPattern === "TTS"
        ? "Tuesday • Thursday • Saturday"
        : "Monday • Wednesday • Friday",
    daysList:
      data.daysPattern === "TTS"
        ? ["Tuesday", "Thursday", "Saturday"]
        : ["Monday", "Wednesday", "Friday"],
    maxPax: Number(data.maxPax) || 28,
    currentPax: Number(data.currentPax) || 0,
    status: data.status || "Active",
    trainerIds: data.trainerIds || [],
    description: data.description || "General fitness training batch.",
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
  const updatedBatch = {
    ...current,
    ...updates,
    timingLabel:
      updates.startTime && updates.endTime
        ? `${updates.startTime} - ${updates.endTime}`
        : current.timingLabel,
    daysLabel:
      updates.daysPattern === "TTS"
        ? "Tuesday • Thursday • Saturday"
        : updates.daysPattern === "MWF"
          ? "Monday • Wednesday • Friday"
          : current.daysLabel,
    daysList:
      updates.daysPattern === "TTS"
        ? ["Tuesday", "Thursday", "Saturday"]
        : updates.daysPattern === "MWF"
          ? ["Monday", "Wednesday", "Friday"]
          : current.daysList,
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
    return members.slice(0, maxCount);
  } catch {
    return [];
  }
}
