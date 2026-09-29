/* eslint-disable max-lines */
import { getTrainers, SEED_TRAINERS } from "./trainersService";
import { getMembers } from "./membersService";
import { STORAGE_KEYS } from "@/config/storageKeys";

export const SHIFT_SLOTS = [
  {
    key: "6_00_am_mwf",
    label: "6.00 am MWF",
    time: "06:00 AM - 07:00 AM",
    days: "MWF",
    batchId: "BATCH-01",
  },
  {
    key: "8_00_am_mwf",
    label: "8.00am MWF",
    time: "08:00 AM - 09:00 AM",
    days: "MWF",
    batchId: "BATCH-02",
  },
  {
    key: "6_00_am_tts",
    label: "6 am TTS",
    time: "06:00 AM - 07:00 AM",
    days: "TTS",
    batchId: "BATCH-04",
  },
  {
    key: "8_00_am_tts",
    label: "8 AM TTS",
    time: "08:00 AM - 09:00 AM",
    days: "TTS",
    batchId: "BATCH-05",
  },
  {
    key: "6_30_pm_mwf",
    label: "6.30 PM MWF",
    time: "06:30 PM - 07:30 PM",
    days: "MWF",
    batchId: "BATCH-03",
  },
  {
    key: "8_00_pm_mwf",
    label: "8 00 PM MWF",
    time: "08:00 PM - 09:00 PM",
    days: "MWF",
    batchId: "BATCH-06",
  },
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
    currentPax: 21,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-103", "TRN-106"],
    description: "Morning functional strength and athletic conditioning batch.",
    memberIds: [
      "MEM-2001",
      "MEM-2002",
      "MEM-2003",
      "MEM-2004",
      "MEM-2005",
      "MEM-2006",
      "MEM-2007",
      "MEM-2008",
      "MEM-2009",
      "MEM-2010",
      "MEM-2011",
      "MEM-2012",
      "MEM-2013",
      "MEM-2014",
      "MEM-2015",
      "MEM-2016",
      "MEM-2017",
      "MEM-2018",
      "MEM-2019",
      "MEM-2020",
      "MEM-2122",
    ],
    createdAt: "2026-01-01T06:00:00.000Z",
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
    currentPax: 23,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-103", "TRN-106"],
    description: "Mid-morning hypertrophy and barbell foundation batch.",
    memberIds: [
      "MEM-2021",
      "MEM-2022",
      "MEM-2023",
      "MEM-2024",
      "MEM-2025",
      "MEM-2026",
      "MEM-2027",
      "MEM-2028",
      "MEM-2029",
      "MEM-2030",
      "MEM-2031",
      "MEM-2032",
      "MEM-2033",
      "MEM-2034",
      "MEM-2035",
      "MEM-2036",
      "MEM-2037",
      "MEM-2038",
      "MEM-2039",
      "MEM-2040",
      "MEM-2041",
      "MEM-2042",
      "MEM-2123",
    ],
    createdAt: "2026-01-01T08:00:00.000Z",
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
    description: "Evening prime strength, Olympic lifting, and power conditioning program.",
    memberIds: [
      "MEM-2043",
      "MEM-2044",
      "MEM-2045",
      "MEM-2046",
      "MEM-2047",
      "MEM-2048",
      "MEM-2049",
      "MEM-2050",
      "MEM-2051",
      "MEM-2052",
      "MEM-2053",
      "MEM-2054",
      "MEM-2055",
      "MEM-2056",
      "MEM-2057",
      "MEM-2058",
      "MEM-2059",
      "MEM-2060",
      "MEM-2061",
      "MEM-2062",
      "MEM-2063",
      "MEM-2064",
      "MEM-2065",
      "MEM-2066",
      "MEM-2124",
    ],
    createdAt: "2026-01-01T18:30:00.000Z",
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
    currentPax: 19,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-105"],
    description: "Tuesday-Thursday-Saturday early athletic power and mobility track.",
    memberIds: [
      "MEM-2067",
      "MEM-2068",
      "MEM-2069",
      "MEM-2070",
      "MEM-2071",
      "MEM-2072",
      "MEM-2073",
      "MEM-2074",
      "MEM-2075",
      "MEM-2076",
      "MEM-2077",
      "MEM-2078",
      "MEM-2079",
      "MEM-2080",
      "MEM-2081",
      "MEM-2082",
      "MEM-2083",
      "MEM-2084",
      "MEM-2125",
    ],
    createdAt: "2026-01-01T06:00:00.000Z",
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
    currentPax: 21,
    status: "Active",
    trainerIds: ["TRN-101", "TRN-105"],
    description: "TTS mid-morning progressive overload, endurance, and conditioning.",
    memberIds: [
      "MEM-2085",
      "MEM-2086",
      "MEM-2087",
      "MEM-2088",
      "MEM-2089",
      "MEM-2090",
      "MEM-2091",
      "MEM-2092",
      "MEM-2093",
      "MEM-2094",
      "MEM-2095",
      "MEM-2096",
      "MEM-2097",
      "MEM-2098",
      "MEM-2099",
      "MEM-2100",
      "MEM-2101",
      "MEM-2102",
      "MEM-2103",
      "MEM-2104",
      "MEM-2105",
    ],
    createdAt: "2026-01-01T08:00:00.000Z",
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
    currentPax: 16,
    status: "Active",
    trainerIds: ["TRN-103", "TRN-104", "TRN-105", "TRN-106"],
    description: "Night shift athletic power, metabolic conditioning, and recovery session.",
    memberIds: [
      "MEM-2106",
      "MEM-2107",
      "MEM-2108",
      "MEM-2109",
      "MEM-2110",
      "MEM-2111",
      "MEM-2112",
      "MEM-2113",
      "MEM-2114",
      "MEM-2115",
      "MEM-2116",
      "MEM-2117",
      "MEM-2118",
      "MEM-2119",
      "MEM-2120",
      "MEM-2121",
    ],
    createdAt: "2026-01-01T20:00:00.000Z",
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
    coachName: "Robert",
    fullName: "Robert Creflo",
    role: "Senior Strength and Rehab Specialist",
    shifts: {
      "6_00_am_mwf": true,
      "8_00_am_mwf": true,
      "6_00_am_tts": false,
      "8_00_am_tts": false,
      "6_30_pm_mwf": true,
      "8_00_pm_mwf": true,
    },
  },
  {
    coachId: "TRN-104",
    coachName: "Bharath",
    fullName: "Bharath V",
    role: "Barbell & Strength Coach",
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
    coachName: "Rengaraj",
    fullName: "Rengaraj M",
    role: "High Performance Conditioning Coach",
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
    coachName: "F Coach",
    fullName: "F Coach",
    role: "Functional Movements & Kettlebell Specialist",
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
  // BATCH 1 Classes (MWF 06:00 AM)
  {
    id: "CLS-101",
    batchId: "BATCH-01",
    day: "Monday",
    title: "Squat Depth & Hip Drive Mechanics",
    category: "Strength & Hypertrophy",
    focus: "Bilateral back squat biomechanics, depth screening, and hip mobility",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Dolliee Ellens",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-102",
    batchId: "BATCH-01",
    day: "Wednesday",
    title: "Upper Body Press & Scapular Stability",
    category: "Strength & Hypertrophy",
    focus: "Barbell bench press, overhead dumbbell press, and scapular retraction",
    intensity: "High",
    room: "Olympic Bench Area",
    coachName: "Robert Creflo",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-103",
    batchId: "BATCH-01",
    day: "Friday",
    title: "Deadlift & Posterior Chain Conditioning",
    category: "Functional Fitness",
    focus: "Conventional deadlifts, Romanian deadlifts, and kettlebell swings",
    intensity: "High",
    room: "Deadlift Platforms",
    coachName: "F Coach",
    time: "06:00 AM - 07:00 AM",
  },

  // BATCH 2 Classes (MWF 08:00 AM)
  {
    id: "CLS-201",
    batchId: "BATCH-02",
    day: "Monday",
    title: "Olympic Barbell Technique & Speed",
    category: "Olympic Weightlifting",
    focus: "Power clean turnover, front rack positioning, and triple extension",
    intensity: "High",
    room: "Olympic Lifting Floor",
    coachName: "F Coach",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-202",
    batchId: "BATCH-02",
    day: "Wednesday",
    title: "Hypertrophy Push-Pull Supersets",
    category: "Strength & Hypertrophy",
    focus: "Incline dumbbell press superset with chest-supported rows",
    intensity: "Medium",
    room: "Free Weights Zone",
    coachName: "Dolliee Ellens",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-203",
    batchId: "BATCH-02",
    day: "Friday",
    title: "Conditioning, Agility & Sled Finisher",
    category: "Functional Fitness",
    focus: "Turf sled pushes, battle ropes, and shuttle intervals",
    intensity: "High",
    room: "Turf & Sled Track",
    coachName: "Robert Creflo",
    time: "08:00 AM - 09:00 AM",
  },

  // BATCH 3 Classes (MWF 06:30 PM)
  {
    id: "CLS-301",
    batchId: "BATCH-03",
    day: "Monday",
    title: "Olympic Clean & Jerk Progression",
    category: "Olympic Weightlifting",
    focus: "Split jerk footwork, elbow drive, and bar speed",
    intensity: "High",
    room: "Olympic Lifting Floor",
    coachName: "Bharath V",
    time: "06:30 PM - 07:30 PM",
  },
  {
    id: "CLS-302",
    batchId: "BATCH-03",
    day: "Wednesday",
    title: "Heavy Barbell Bench Press & Lockout",
    category: "Strength & Hypertrophy",
    focus: "Powerlifting arch setup, triceps lockout, and pause reps",
    intensity: "High",
    room: "Olympic Bench Area",
    coachName: "Robert Creflo",
    time: "06:30 PM - 07:30 PM",
  },
  {
    id: "CLS-303",
    batchId: "BATCH-03",
    day: "Friday",
    title: "Metabolic Conditioning & Strongman Carries",
    category: "Functional Fitness",
    focus: "Farmer carries, trap bar deadlift intervals, and core bracing",
    intensity: "High",
    room: "Turf & Sled Track",
    coachName: "F Coach",
    time: "06:30 PM - 07:30 PM",
  },

  // BATCH 4 Classes (TTS 06:00 AM)
  {
    id: "CLS-401",
    batchId: "BATCH-04",
    day: "Tuesday",
    title: "Dynamic Joint Mobility & Squatting",
    category: "Strength & Hypertrophy",
    focus: "Tempo squats, ankle mobility, and core stabilization",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Dolliee Ellens",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-402",
    batchId: "BATCH-04",
    day: "Thursday",
    title: "Overhead Press & Pull Stability",
    category: "Strength & Hypertrophy",
    focus: "Military barbell press, weighted pull-ups, and core bracing",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Rengaraj M",
    time: "06:00 AM - 07:00 AM",
  },
  {
    id: "CLS-403",
    batchId: "BATCH-04",
    day: "Saturday",
    title: "Full Body Barbell Complex Challenge",
    category: "Functional Fitness",
    focus: "Continuous multi-exercise barbell complex without resting between movements",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Rengaraj M",
    time: "06:00 AM - 07:00 AM",
  },

  // BATCH 5 Classes (TTS 08:00 AM)
  {
    id: "CLS-501",
    batchId: "BATCH-05",
    day: "Tuesday",
    title: "Front Squat Mechanics & Quad Drive",
    category: "Strength & Hypertrophy",
    focus: "Thoracic upright posture, front rack grip, and eccentric control",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Dolliee Ellens",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-502",
    batchId: "BATCH-05",
    day: "Thursday",
    title: "Snatch Technique & Overhead Squat Stability",
    category: "Olympic Weightlifting",
    focus: "Snatch balance, wide grip turnover, and shoulder girdle lock",
    intensity: "High",
    room: "Olympic Lifting Floor",
    coachName: "Rengaraj M",
    time: "08:00 AM - 09:00 AM",
  },
  {
    id: "CLS-503",
    batchId: "BATCH-05",
    day: "Saturday",
    title: "Team Conditioning & Turf Sled Gauntlet",
    category: "Functional Fitness",
    focus: "Partner sled pushes, assault bike sprints, and high-intensity interval ladders",
    intensity: "High",
    room: "Turf & Sled Track",
    coachName: "Dolliee Ellens",
    time: "08:00 AM - 09:00 AM",
  },

  // BATCH 6 Classes (MWF 08:00 PM)
  {
    id: "CLS-601",
    batchId: "BATCH-06",
    day: "Monday",
    title: "Late-Night Heavy Squat Complex",
    category: "Strength & Hypertrophy",
    focus: "Safety squat bar, paused box squats, and glute-ham tie-in",
    intensity: "High",
    room: "Main Rig & Platforms",
    coachName: "Robert Creflo",
    time: "08:00 PM - 09:00 PM",
  },
  {
    id: "CLS-602",
    batchId: "BATCH-06",
    day: "Wednesday",
    title: "Deadlift Variations & Spinal Neutrality",
    category: "Strength & Hypertrophy",
    focus: "Deficit deadlifts, barbell rows, and lat engagement",
    intensity: "High",
    room: "Deadlift Platforms",
    coachName: "Bharath V",
    time: "08:00 PM - 09:00 PM",
  },
  {
    id: "CLS-603",
    batchId: "BATCH-06",
    day: "Friday",
    title: "Full Body Functional Capacity & Sled Finisher",
    category: "Functional Fitness",
    focus: "Kettlebell clean & press, sandbag carries, and metabolic flush",
    intensity: "High",
    room: "Turf & Sled Track",
    coachName: "F Coach",
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
    if (Array.isArray(parsed)) {
      if (key === STORAGE_KEYS.BATCHES) {
        if (parsed.length === 0) {
          localStorage.setItem(key, JSON.stringify(defaultData));
          return [...defaultData];
        }
        const needsSync = parsed.some(
          (b) =>
            b.maxPax !== 28 ||
            !Array.isArray(b.memberIds) ||
            b.memberIds.length < 15 ||
            !Array.isArray(b.trainerIds),
        );
        if (needsSync && defaultData && defaultData.length > 0) {
          const merged = defaultData.map((seedBatch) => {
            const existing = parsed.find((b) => b.id === seedBatch.id);
            if (!existing) return seedBatch;
            return {
              ...existing,
              name: seedBatch.name,
              shortName: seedBatch.shortName,
              startTime: seedBatch.startTime,
              endTime: seedBatch.endTime,
              timingLabel: seedBatch.timingLabel,
              daysPattern: seedBatch.daysPattern,
              daysLabel: seedBatch.daysLabel,
              daysList: seedBatch.daysList,
              maxPax: 28,
              currentPax: seedBatch.memberIds?.length || existing.currentPax || 0,
              trainerIds: Array.isArray(existing.trainerIds) && existing.trainerIds.length > 0
                ? existing.trainerIds
                : seedBatch.trainerIds,
              memberIds: seedBatch.memberIds,
            };
          });
          localStorage.setItem(key, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      if (key === STORAGE_KEYS.SCHEDULED_CLASSES) {
        if (parsed.length === 0 || parsed.length < defaultData.length) {
          localStorage.setItem(key, JSON.stringify(defaultData));
          return [...defaultData];
        }
        return parsed;
      }
      if (key === STORAGE_KEYS.COACH_SHIFTS) {
        const expectedCoachIds = ["TRN-101", "TRN-103", "TRN-104", "TRN-105", "TRN-106"];
        const hasAllCoaches = expectedCoachIds.every((id) => parsed.some((c) => c.coachId === id));
        if (!hasAllCoaches || parsed.length !== expectedCoachIds.length) {
          localStorage.setItem(key, JSON.stringify(defaultData));
          return [...defaultData];
        }
        return parsed;
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
  return readStorage(STORAGE_KEYS.BATCHES, SEED_BATCHES);
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
  writeStorage(STORAGE_KEYS.BATCHES, updated);
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
  writeStorage(STORAGE_KEYS.BATCHES, batches);
  return updatedBatch;
}

export function deleteBatch(id) {
  const batches = getBatches();
  const filtered = batches.filter((b) => b.id !== id);
  writeStorage(STORAGE_KEYS.BATCHES, filtered);
  return true;
}

// --- Coach Shift Matrix Operations ---

export function getCoachShiftMatrix() {
  return readStorage(STORAGE_KEYS.COACH_SHIFTS, SEED_COACH_SHIFTS);
}

export function toggleCoachSlot(coachId, slotKey) {
  const matrix = getCoachShiftMatrix();
  const coach = matrix.find((c) => c.coachId === coachId);
  if (!coach) return null;

  const currentVal = !!coach.shifts[slotKey];
  coach.shifts[slotKey] = !currentVal;

  writeStorage(STORAGE_KEYS.COACH_SHIFTS, matrix);

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
      writeStorage(STORAGE_KEYS.BATCHES, batches);
    }
  }

  return coach;
}

// --- Scheduled Classes Operations ---

export function getAllScheduledClasses() {
  return readStorage(STORAGE_KEYS.SCHEDULED_CLASSES, SEED_SCHEDULED_CLASSES);
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
  writeStorage(STORAGE_KEYS.SCHEDULED_CLASSES, classes);
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
  writeStorage(STORAGE_KEYS.SCHEDULED_CLASSES, classes);
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
  writeStorage(STORAGE_KEYS.BATCHES, batches);
  return updatedBatch;
}

/**
 * Returns an array of batch IDs that the given trainer is currently assigned to.
 */
export function getTrainerBatchIds(trainerId) {
  if (!trainerId) return [];
  const batches = getBatches();
  return batches
    .filter((b) => Array.isArray(b.trainerIds) && b.trainerIds.includes(trainerId))
    .map((b) => b.id);
}

/**
 * Synchronizes batch assignments for a specific trainer across all batches and coach shifts.
 * Any batch ID in selectedBatchIds will include trainerId; any batch ID not in selectedBatchIds will remove trainerId.
 */
export function syncTrainerBatches(trainerId, selectedBatchIds = []) {
  if (!trainerId) return [];
  const batches = getBatches();
  const targetBatchIds = Array.isArray(selectedBatchIds) ? selectedBatchIds : [];
  let batchesChanged = false;

  const updatedBatches = batches.map((batch) => {
    const isSelected = targetBatchIds.includes(batch.id);
    const currentTrainers = Array.isArray(batch.trainerIds) ? [...batch.trainerIds] : [];
    const hasTrainer = currentTrainers.includes(trainerId);

    if (isSelected && !hasTrainer) {
      batchesChanged = true;
      return {
        ...batch,
        trainerIds: [...currentTrainers, trainerId],
      };
    } else if (!isSelected && hasTrainer) {
      batchesChanged = true;
      return {
        ...batch,
        trainerIds: currentTrainers.filter((id) => id !== trainerId),
      };
    }
    return batch;
  });

  if (batchesChanged) {
    writeStorage(STORAGE_KEYS.BATCHES, updatedBatches);
  }

  // Also sync coach shift matrix if coach exists in shift matrix
  try {
    const matrix = getCoachShiftMatrix();
    const coach = matrix.find(
      (c) => c.coachId === trainerId || c.fullName?.toLowerCase() === trainerId?.toLowerCase(),
    );
    if (coach && coach.shifts) {
      let shiftChanged = false;
      SHIFT_SLOTS.forEach((slot) => {
        if (slot.batchId) {
          const shouldBeActive = targetBatchIds.includes(slot.batchId);
          if (coach.shifts[slot.key] !== shouldBeActive) {
            coach.shifts[slot.key] = shouldBeActive;
            shiftChanged = true;
          }
        }
      });
      if (shiftChanged) {
        writeStorage(STORAGE_KEYS.COACH_SHIFTS, matrix);
      }
    }
  } catch (err) {
    console.error("Failed to sync coach shifts:", err);
  }

  return updatedBatches;
}

