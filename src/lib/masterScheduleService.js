/* eslint-disable max-lines */
import { getBatches } from "./batchesService";
import { getTrainers } from "./trainersService";

export const STORAGE_KEY_MASTER_SCHEDULES = "tsw-master-class-schedules";
export const STORAGE_KEY_MASTER_ITEMS = "tsw-master-class-items";
export const STORAGE_KEY_SESSIONS = "tsw-generated-sessions";
export const STORAGE_KEY_HOLIDAYS = "tsw-holidays";

// Default Coaches List matching prompt coaches
export const ALL_COACHES = [
  { id: "TRN-101", name: "Dolliee Ellens", shortName: "Dolliee", role: "Head Functional Coach" },
  {
    id: "TRN-102",
    name: "Ashwin Kumar",
    shortName: "Ashwin",
    role: "Strength & Conditioning Specialist",
  },
  {
    id: "TRN-103",
    name: "Robert Creflo",
    shortName: "Robert",
    role: "Senior Strength & Rehab Specialist",
  },
  {
    id: "TRN-104",
    name: "Bharath V",
    shortName: "Bharath",
    role: "Olympic Weightlifting & Power Specialist",
  },
  {
    id: "TRN-105",
    name: "Rengaraj M",
    shortName: "Rengaraj",
    role: "Conditioning & Mobility Specialist",
  },
  { id: "TRN-106", name: "F Coach", shortName: "F Coach", role: "Floor Master Coach" },
];

// 12-Class Standard Strength Curriculum Template
export const DEFAULT_12_CLASS_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Introduction to Training & Movement Assessment",
    message:
      "Welcome athletes! Foundational movement mechanics, baseline squat/hinge screening, core activation, and breath work.",
  },
  {
    classNumber: 2,
    subject: "Lower Body Foundational Mechanics (Squat & Lunge)",
    message:
      "Bilateral squat depth, knee tracking, hip mobility drill, and eccentric tempo control under moderate load.",
  },
  {
    classNumber: 3,
    subject: "Upper Body Press & Scapular Stability",
    message:
      "Overhead mechanics, push-up & bench setups, shoulder retraction, and rotator cuff stability protocols.",
  },
  {
    classNumber: 4,
    subject: "Posterior Chain Hinge & Deadlift Fundamentals",
    message:
      "Hip hinge pattern, Romanian deadlifts, hamstring flexibility, and maintaining spinal neutrality under tension.",
  },
  {
    classNumber: 5,
    subject: "Core Bracing & Anti-Rotational Strength",
    message:
      "Pallof presses, weighted plank progressions, farmer carries, and intra-abdominal pressure management.",
  },
  {
    classNumber: 6,
    subject: "Mid-Program Athletic Conditioning & Agility",
    message:
      "High-intensity sled pushes, battle ropes, lateral hurdle drills, and cardiovascular capacity benchmark.",
  },
  {
    classNumber: 7,
    subject: "Progressive Overload & Barbell Mechanics",
    message:
      "Barbell trajectory, grip techniques, incremental loading protocols, and technical bailout safety cues.",
  },
  {
    classNumber: 8,
    subject: "Unilateral Strength & Balance Optimization",
    message:
      "Bulgarian split squats, single-leg RDLs, dumbbell rows, and eliminating bilateral strength deficits.",
  },
  {
    classNumber: 9,
    subject: "Explosive Power & Plyometric Mechanics",
    message:
      "Plyo box jumps, kettlebell power swings, medicine ball slams, and kinetic chain energy transfer.",
  },
  {
    classNumber: 10,
    subject: "High-Intensity Metabolic Threshold Training",
    message:
      "AMRAP circuits, rowing intervals, lactate threshold pacing, and athletic endurance resilience.",
  },
  {
    classNumber: 11,
    subject: "Deload, Mobility & Joint Restoration",
    message:
      "Active recovery, fascial release, thoracic spine mobility drills, and parasympathetic recovery breathing.",
  },
  {
    classNumber: 12,
    subject: "Final Strength Benchmark & PR Assessment",
    message:
      "Culminating benchmark testing, personal record (PR) verification, certificate ceremony, and cycle review.",
  },
];

export const ALTERNATIVE_CURRICULUM_ATHLETIC = [
  {
    classNumber: 1,
    subject: "Athletic Baseline & Dynamic Screening",
    message: "Initial screening of mobility, joint angles, and cardiovascular capacity.",
  },
  {
    classNumber: 2,
    subject: "Linear Acceleration & Foot Strike Mechanics",
    message: "Wall drills, sprint starts, and posture during acceleration phase.",
  },
  {
    classNumber: 3,
    subject: "Multi-Directional Agility & Deceleration",
    message: "Change of direction, 5-10-5 agility shuttle, and ankle stability.",
  },
  {
    classNumber: 4,
    subject: "Barbell Power Cleans & Triple Extension",
    message: "Hip drive, rapid elbow turnover, and barbell catch positioning.",
  },
  {
    classNumber: 5,
    subject: "Rotational Power & Med-Ball Throw Dynamics",
    message: "Transverse plane power, rotational slams, and core deceleration.",
  },
  {
    classNumber: 6,
    subject: "Lactate Tolerance & High-Output Intervals",
    message: "SkiErg and Assault Bike pyramid intervals with short rest windows.",
  },
  {
    classNumber: 7,
    subject: "Loaded Carries & Grip Endurance Challenge",
    message: "Trap bar carries, suitcase holds, and overhead waiter walks.",
  },
  {
    classNumber: 8,
    subject: "Reactive Plyometrics & Ground Contact Speed",
    message: "Depth drops, reactive hurdle hops, and minimizing ground contact time.",
  },
  {
    classNumber: 9,
    subject: "Heavy Barbell Complexes & Posterior Strength",
    message: "Snatch grip high pulls, zercher squats, and barbell hip thrusts.",
  },
  {
    classNumber: 10,
    subject: "Combat Conditioning & Functional Stamina",
    message: "Heavy bag striking intervals, tire flips, and sprawl conditioning.",
  },
  {
    classNumber: 11,
    subject: "Joint Decompression & Fascial Stretch Therapy",
    message: "Band-assisted joint distraction, hip capsule stretches, and soft tissue work.",
  },
  {
    classNumber: 12,
    subject: "Athletic Gauntlet & Graduation Benchmark",
    message: "Comprehensive obstacle course challenge, final times recording, and badges award.",
  },
];

// Dedicated September 2026 (This Month) Hypertrophy Curriculum for Batch 3 (Coach Rengaraj M)
export const BATCH_3_SEPTEMBER_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Movement Screen & Upper Posterior Warmup",
    message:
      "Assessing overhead squat mobility, thoracic extension, scapular retraction, and setting baseline tempo for evening lifters.",
  },
  {
    classNumber: 2,
    subject: "Lower Body Quad Volume & Knee Tracking",
    message:
      "Front squats, Bulgarian split squats, and eccentric quad control with 3-second lowering tempo and hamstring counter-tension.",
  },
  {
    classNumber: 3,
    subject: "Horizontal Push/Pull Superset Mechanics",
    message:
      "Barbell bench press paired with chest-supported dumbbell rows for balanced upper-body tension and glenohumeral safety.",
  },
  {
    classNumber: 4,
    subject: "Posterior Chain Deadlift & Glute Activation",
    message:
      "Conventional and Romanian deadlift mechanics, hip hinging depth, and glute medius activation under progressive load.",
  },
  {
    classNumber: 5,
    subject: "Overhead Pressing Stability & Deltoid Volume",
    message:
      "Strict barbell overhead press, lateral raise mechanical dropsets, and rotator cuff integrity drills with light bands.",
  },
  {
    classNumber: 6,
    subject: "Mid-Program Conditioning Benchmark",
    message:
      "High-density metabolic circuit: SkiErg intervals, kettlebell clean & press, battle ropes, and 400m recovery pace.",
  },
  {
    classNumber: 7,
    subject: "Unilateral Leg Strength & Core Bracing",
    message:
      "Walking lunges with farmer carry hold, single-leg Romanian deadlifts, and anti-rotational Pallof holds.",
  },
  {
    classNumber: 8,
    subject: "Upper Body Hypertrophy & Arm Super-Pump",
    message:
      "Incline dumbbell pressing, weighted dips, incline bicep curls, and overhead tricep extensions to near muscular failure.",
  },
  {
    classNumber: 9,
    subject: "Explosive Hip Extension & Barbell Cleans",
    message:
      "Hang power cleans, kettlebell snatch progressions, and explosive hip drive mechanics with dynamic reset pauses.",
  },
  {
    classNumber: 10,
    subject: "High-Density Lactate Threshold Circuit",
    message:
      "Rowing sprints, wall-ball shots, box step-overs, and functional athletic endurance testing for maximum work capacity.",
  },
  {
    classNumber: 11,
    subject: "Restorative Mobility, Fascia & Deload",
    message:
      "Active myofascial release, hip capsule distraction, thoracic mobility flows, and recovery breath work prior to PR testing.",
  },
  {
    classNumber: 12,
    subject: "Final Benchmark PR Testing & Progression Review",
    message:
      "3-rep max testing on bench and squat, cycle PR celebration, individual feedback dossiers, and graduation into next phase.",
  },
];

export const SEED_HOLIDAYS = [
  {
    id: "HOL-NY-2026",
    name: "New Year",
    date: "2026-01-01",
    type: "Public Holiday",
    affectedBatches: "ALL",
    description: "New Year celebration. Gym premises closed for all batches.",
    status: "Active",
  },
  {
    id: "HOL-PG-2026",
    name: "Pongal",
    date: "2026-01-15",
    type: "Festival Holiday",
    affectedBatches: "ALL",
    description: "Harvest festival celebrations. All batch sessions suspended.",
    status: "Active",
  },
  {
    id: "HOL-RD-2026",
    name: "Republic Day",
    date: "2026-01-26",
    type: "National Holiday",
    affectedBatches: "ALL",
    description: "Republic Day of India. Gym premises closed for all shifts.",
    status: "Active",
  },
  {
    id: "HOL-RZ-2026",
    name: "Ramzan",
    date: "2026-03-20",
    type: "Festival Holiday",
    affectedBatches: "ALL",
    description: "Eid-ul-Fitr celebrations. Regular batch classes suspended.",
    status: "Active",
  },
  {
    id: "HOL-LD-2026",
    name: "Labour Day",
    date: "2026-05-01",
    type: "National Holiday",
    affectedBatches: "ALL",
    description: "International Workers' Day / May Day. Gym closed for all shifts.",
    status: "Active",
  },
  {
    id: "HOL-ID-2026",
    name: "Independence Day",
    date: "2026-08-15",
    type: "National Holiday",
    affectedBatches: "ALL",
    description: "Independence Day of India. Gym premises closed all shifts.",
    status: "Active",
  },
  {
    id: "HOL-VC-2026",
    name: "Vinayaka Chathurthi",
    date: "2026-09-14",
    type: "Festival Holiday",
    affectedBatches: "ALL",
    description: "Ganesh Chaturthi celebrations. Morning open gym only; regular batches suspended.",
    status: "Active",
  },
  {
    id: "HOL-GJ-2026",
    name: "Gandhi Jayanti",
    date: "2026-10-02",
    type: "National Holiday",
    affectedBatches: "ALL",
    description: "Mahatma Gandhi Jayanti. Gym premises closed all shifts.",
    status: "Active",
  },
  {
    id: "HOL-DW-2026",
    name: "Diwali",
    date: "2026-11-08",
    type: "Festival Holiday",
    affectedBatches: "ALL",
    description: "Festival of Lights & Deepavali. Morning open gym only; regular class batches suspended.",
    status: "Active",
  },
  {
    id: "HOL-XM-2026",
    name: "Christmas",
    date: "2026-12-25",
    type: "Festival Holiday",
    affectedBatches: "ALL",
    description: "Christmas celebrations. Holiday open mat session 08:00 AM - 12:00 PM only.",
    status: "Active",
  },
];

// Helper: Calculate Sequential Mapping for 12 classes against batch recurring days
export function calculateSequentialMapping(daysList, totalClasses = 12, startDateStr) {
  const cleanDays =
    Array.isArray(daysList) && daysList.length > 0 ? daysList : ["Monday", "Wednesday", "Friday"];

  // Establish base start date
  let start = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(start.getTime())) {
    start = new Date();
  }
  start.setHours(0, 0, 0, 0);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysLower = cleanDays.map((d) => d.toLowerCase());

  const items = [];
  let currentDate = new Date(start);
  let count = 0;
  let safety = 0;

  while (count < totalClasses && safety < 120) {
    const dayName = dayNames[currentDate.getDay()];
    if (daysLower.includes(dayName.toLowerCase())) {
      const classNum = count + 1;
      const weekNum = Math.floor(count / cleanDays.length) + 1;
      const dayIndex = count % cleanDays.length;
      const mappedDayName = cleanDays[dayIndex];

      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      items.push({
        classNumber: classNum,
        weekNumber: weekNum,
        dayOfWeek: mappedDayName,
        sessionNumber: classNum,
        date: dateStr,
        displayDate: currentDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    safety++;
  }

  // Fallback if needed
  while (items.length < totalClasses) {
    const classNum = items.length + 1;
    const weekNum = Math.floor((classNum - 1) / cleanDays.length) + 1;
    const dayIndex = (classNum - 1) % cleanDays.length;
    items.push({
      classNumber: classNum,
      weekNumber: weekNum,
      dayOfWeek: cleanDays[dayIndex] || "Monday",
      sessionNumber: classNum,
      date: "",
      displayDate: `Week ${weekNum} • ${cleanDays[dayIndex] || "Monday"}`,
    });
  }

  return items;
}

// Generate Initial Mock Data for Master Schedules
function createSeedMasterSchedules() {
  const initialDate = "2026-10-05"; // Next Monday

  // 1. MWF Morning Program (Batch 1, Dolliee)
  const mcs1 = {
    id: "mcs_001",
    name: "MWF Morning Program",
    batchId: "BATCH-01",
    batchName: "BATCH 1",
    shift: "06:00 AM",
    timing: "06:00 AM - 07:00 AM",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-09-02", // September 2026 (Active Operational Month)
    description: "Primary 12-class functional strength curriculum for 6:00 AM morning athletes.",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. MWF 8 AM Program (Batch 2, Ashwin)
  const mcs2 = {
    id: "mcs_002",
    name: "MWF 8 AM Program",
    batchId: "BATCH-02",
    batchName: "BATCH 2",
    shift: "08:00 AM",
    timing: "08:00 AM - 09:00 AM",
    startTime: "08:00 AM",
    endTime: "09:00 AM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    coachId: "TRN-102",
    coachName: "Ashwin Kumar",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-09-02", // September 2026 (Active Operational Month)
    description: "Barbell hypertrophy, progressive compound lifts, and core reinforcement.",
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 3. TTS Morning Strength (Batch 4, Robert)
  const mcs3 = {
    id: "mcs_003",
    name: "TTS Morning Strength",
    batchId: "BATCH-04",
    batchName: "BATCH 4",
    shift: "06:00 AM",
    timing: "06:00 AM - 07:00 AM",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    daysPattern: "TTS",
    daysLabel: "Tuesday • Thursday • Saturday",
    daysList: ["Tuesday", "Thursday", "Saturday"],
    coachId: "TRN-103",
    coachName: "Robert Creflo",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-10-06",
    description:
      "Biomechanical focus, joint safety, and progressive overload on Tuesday, Thursday, Saturday.",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4. MWF Evening Hypertrophy (Batch 3, Rengaraj) - SEPTEMBER 2026 (THIS MONTH)
  const mcs4 = {
    id: "mcs_004",
    name: "MWF Evening Hypertrophy",
    batchId: "BATCH-03",
    batchName: "BATCH 3",
    shift: "06:30 PM",
    timing: "06:30 PM - 07:30 PM",
    startTime: "06:30 PM",
    endTime: "07:30 PM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    coachId: "TRN-105",
    coachName: "Rengaraj M",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-09-02", // September 2026 (This Month)
    description: "High-volume evening strength training for working professionals and athletes.",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 5. TTS 8 AM Conditioning (Batch 5, Bharath)
  const mcs5 = {
    id: "mcs_005",
    name: "TTS 8 AM Conditioning",
    batchId: "BATCH-05",
    batchName: "BATCH 5",
    shift: "08:00 AM",
    timing: "08:00 AM - 09:00 AM",
    startTime: "08:00 AM",
    endTime: "09:00 AM",
    daysPattern: "TTS",
    daysLabel: "Tuesday • Thursday • Saturday",
    daysList: ["Tuesday", "Thursday", "Saturday"],
    coachId: "TRN-104",
    coachName: "Bharath V",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-10-06",
    description: "Olympic weightlifting fundamentals, power endurance, and explosive strength.",
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 6. TTS Evening Prime (Batch 6, F Coach)
  const mcs6 = {
    id: "mcs_006",
    name: "TTS Evening Prime",
    batchId: "BATCH-06",
    batchName: "BATCH 6",
    shift: "06:30 PM",
    timing: "06:30 PM - 07:30 PM",
    startTime: "06:30 PM",
    endTime: "07:30 PM",
    daysPattern: "TTS",
    daysLabel: "Tuesday • Thursday • Saturday",
    daysList: ["Tuesday", "Thursday", "Saturday"],
    coachId: "TRN-106",
    coachName: "F Coach",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-10-06",
    description: "Floor masterclass, metabolic intervals, and athletic durability.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return [mcs1, mcs2, mcs3, mcs4, mcs5, mcs6];
}

// Generate Items for a Master Schedule
function createItemsForSchedule(schedule, curriculum = null) {
  let activeCurriculum = curriculum;
  if (!activeCurriculum) {
    if (schedule.batchId === "BATCH-03" || schedule.id === "mcs_004") {
      activeCurriculum = BATCH_3_SEPTEMBER_CURRICULUM;
    } else {
      activeCurriculum = DEFAULT_12_CLASS_CURRICULUM;
    }
  }
  const mapping = calculateSequentialMapping(
    schedule.daysList,
    schedule.totalClasses || 12,
    schedule.startDate,
  );

  return mapping.map((m, idx) => {
    const curr = activeCurriculum[idx] || {
      subject: `Class ${m.classNumber}: Functional Strength Phase ${m.weekNumber}`,
      message: `Detailed workout instruction for session ${m.sessionNumber}.`,
    };
    return {
      id: `item_${schedule.id}_${String(m.classNumber).padStart(2, "0")}`,
      masterScheduleId: schedule.id,
      classNumber: m.classNumber,
      weekNumber: m.weekNumber,
      dayOfWeek: m.dayOfWeek,
      subject: curr.subject,
      message: curr.message,
      sessionDate: m.date,
      displayDate: m.displayDate,
      status: "ACTIVE",
    };
  });
}

// Generate Sessions from Schedule and Items
export function generateSessionsForSchedule(schedule, items) {
  const mapping = calculateSequentialMapping(
    schedule.daysList,
    schedule.totalClasses || 12,
    schedule.startDate,
  );

  return items.map((item, idx) => {
    const map = mapping[idx] || {};
    const dateStr = item.sessionDate || map.date || "";

    // Status logic: if date is in past -> COMPLETED, if today -> TODAY, else SCHEDULED
    const today = new Date().toISOString().slice(0, 10);
    let sessionStatus = "SCHEDULED";
    if (dateStr) {
      if (dateStr < today) {
        sessionStatus = "COMPLETED";
      } else if (dateStr === today) {
        sessionStatus = "TODAY";
      }
    }

    return {
      id: `SES-${schedule.id}-${String(item.classNumber).padStart(2, "0")}`,
      masterScheduleId: schedule.id,
      masterScheduleName: schedule.name,
      masterClassItemId: item.id,
      classNumber: item.classNumber,
      weekNumber: item.weekNumber || map.weekNumber || 1,
      dayOfWeek: item.dayOfWeek || map.dayOfWeek || "Monday",
      batchId: schedule.batchId,
      batchName: schedule.batchName,
      coachId: schedule.coachId,
      coachName: schedule.coachName,
      sessionDate: dateStr,
      displayDate: item.displayDate || map.displayDate || "",
      startTime: schedule.startTime || "06:00 AM",
      endTime: schedule.endTime || "07:00 AM",
      timing:
        schedule.timing ||
        `${schedule.startTime || "06:00 AM"} - ${schedule.endTime || "07:00 AM"}`,
      subject: item.subject,
      message: item.message,
      status: sessionStatus,
      notes: "",
      capacity: schedule.capacity || 28,
      createdAt: new Date().toISOString(),
    };
  });
}

// Storage Helpers
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  } catch (err) {
    console.error(`Failed to write to ${key}:`, err);
  }
}

// --- MASTER CLASS SCHEDULES API ---

export function getMasterSchedules() {
  const seedSchedules = createSeedMasterSchedules();
  let schedules = readStorage(STORAGE_KEY_MASTER_SCHEDULES, seedSchedules);

  // Ensure all seed batches are present (merge missing seeds)
  const existingIds = new Set(schedules.map((s) => s.id));
  const missingSeeds = seedSchedules.filter((s) => !existingIds.has(s.id));
  if (missingSeeds.length > 0) {
    schedules = [...schedules, ...missingSeeds];
    writeStorage(STORAGE_KEY_MASTER_SCHEDULES, schedules);
  }

  // Ensure Batch 1 (mcs_001) has September 2026 operational schedule (so Class 11 is Today)
  const b1Schedule = schedules.find((s) => s.id === "mcs_001" || s.batchId === "BATCH-01");
  let b1NeedsUpdate = false;
  if (b1Schedule && b1Schedule.startDate !== "2026-09-02") {
    b1Schedule.startDate = "2026-09-02";
    b1NeedsUpdate = true;
  }

  // Ensure Batch 2 (mcs_002) has September 2026 operational schedule
  const b2Schedule = schedules.find((s) => s.id === "mcs_002" || s.batchId === "BATCH-02");
  let b2NeedsUpdate = false;
  if (b2Schedule && b2Schedule.startDate !== "2026-09-02") {
    b2Schedule.startDate = "2026-09-02";
    b2NeedsUpdate = true;
  }

  // Ensure Batch 3 (mcs_004) has September 2026 mock data
  const b3Schedule = schedules.find((s) => s.id === "mcs_004" || s.batchId === "BATCH-03");
  let b3NeedsUpdate = false;
  if (b3Schedule && b3Schedule.startDate !== "2026-09-02") {
    b3Schedule.startDate = "2026-09-02";
    b3NeedsUpdate = true;
  }

  if (b1NeedsUpdate || b2NeedsUpdate || b3NeedsUpdate) {
    writeStorage(STORAGE_KEY_MASTER_SCHEDULES, schedules);
  }

  // Ensure items and sessions exist for all schedules
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    let allItems = rawItems ? JSON.parse(rawItems) : [];
    if (!Array.isArray(allItems)) allItems = [];

    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    let allSessions = rawSessions ? JSON.parse(rawSessions) : [];
    if (!Array.isArray(allSessions)) allSessions = [];

    let itemsUpdated = false;
    let sessionsUpdated = false;

    // If Batch 1 was updated or stored items don't reflect September 2026, regenerate
    if (
      b1Schedule &&
      (b1NeedsUpdate ||
        !allItems.some(
          (i) => i.masterScheduleId === b1Schedule.id && i.sessionDate === "2026-09-02",
        ))
    ) {
      const b1Items = createItemsForSchedule(b1Schedule, DEFAULT_12_CLASS_CURRICULUM);
      allItems = allItems.filter((i) => i.masterScheduleId !== b1Schedule.id);
      allItems = [...allItems, ...b1Items];
      itemsUpdated = true;

      const b1Sessions = generateSessionsForSchedule(b1Schedule, b1Items);
      allSessions = allSessions.filter((s) => s.masterScheduleId !== b1Schedule.id);
      allSessions = [...allSessions, ...b1Sessions];
      sessionsUpdated = true;
    }

    // If Batch 2 was updated or stored items don't reflect September 2026, regenerate
    if (
      b2Schedule &&
      (b2NeedsUpdate ||
        !allItems.some(
          (i) => i.masterScheduleId === b2Schedule.id && i.sessionDate === "2026-09-02",
        ))
    ) {
      const b2Items = createItemsForSchedule(b2Schedule, DEFAULT_12_CLASS_CURRICULUM);
      allItems = allItems.filter((i) => i.masterScheduleId !== b2Schedule.id);
      allItems = [...allItems, ...b2Items];
      itemsUpdated = true;

      const b2Sessions = generateSessionsForSchedule(b2Schedule, b2Items);
      allSessions = allSessions.filter((s) => s.masterScheduleId !== b2Schedule.id);
      allSessions = [...allSessions, ...b2Sessions];
      sessionsUpdated = true;
    }

    // If Batch 3 was updated or stored items don't reflect September 2026, regenerate
    if (
      b3Schedule &&
      (b3NeedsUpdate ||
        !allItems.some(
          (i) => i.masterScheduleId === b3Schedule.id && i.sessionDate === "2026-09-02",
        ))
    ) {
      const b3Items = createItemsForSchedule(b3Schedule, BATCH_3_SEPTEMBER_CURRICULUM);
      allItems = allItems.filter((i) => i.masterScheduleId !== b3Schedule.id);
      allItems = [...allItems, ...b3Items];
      itemsUpdated = true;

      const b3Sessions = generateSessionsForSchedule(b3Schedule, b3Items);
      allSessions = allSessions.filter((s) => s.masterScheduleId !== b3Schedule.id);
      allSessions = [...allSessions, ...b3Sessions];
      sessionsUpdated = true;
    }

    schedules.forEach((sch) => {
      const scheduleItems = allItems.filter((i) => i.masterScheduleId === sch.id);
      if (scheduleItems.length === 0) {
        const items = createItemsForSchedule(sch);
        allItems = [...allItems, ...items];
        itemsUpdated = true;

        const sessions = generateSessionsForSchedule(sch, items);
        allSessions = [...allSessions, ...sessions];
        sessionsUpdated = true;
      }
    });

    if (itemsUpdated) {
      writeStorage(STORAGE_KEY_MASTER_ITEMS, allItems);
    }
    if (sessionsUpdated) {
      writeStorage(STORAGE_KEY_SESSIONS, allSessions);
    }
  } catch (err) {
    console.error("Error synchronizing master schedule items/sessions:", err);
  }

  return schedules;
}

export function getMasterScheduleById(id) {
  const all = getMasterSchedules();
  return all.find((s) => s.id === id) || null;
}

export function getMasterScheduleByBatchId(batchId) {
  const all = getMasterSchedules();
  return all.find((s) => s.batchId === batchId) || null;
}

export function getScheduleItems(masterScheduleId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return Array.isArray(all) ? all.filter((i) => i.masterScheduleId === masterScheduleId) : [];
  } catch {
    return [];
  }
}

export function updateMasterClassItem(itemId, updates) {
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    if (!rawItems) return null;
    const items = JSON.parse(rawItems);
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    writeStorage(STORAGE_KEY_MASTER_ITEMS, items);

    // Also synchronize generated sessions for this class item
    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (rawSessions) {
      const sessions = JSON.parse(rawSessions);
      const updatedSessions = sessions.map((s) => {
        if (s.masterClassItemId === itemId) {
          return {
            ...s,
            subject: updates.subject !== undefined ? updates.subject : s.subject,
            message: updates.message !== undefined ? updates.message : s.message,
          };
        }
        return s;
      });
      writeStorage(STORAGE_KEY_SESSIONS, updatedSessions);
    }
    return items[idx];
  } catch (e) {
    console.error("Failed to update master class item:", e);
    return null;
  }
}

export function addMasterClassItem(masterScheduleId, itemData = {}) {
  const schedule = getMasterScheduleById(masterScheduleId);
  if (!schedule) return null;

  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    let allItems = rawItems ? JSON.parse(rawItems) : [];
    if (!Array.isArray(allItems)) allItems = [];

    const currentScheduleItems = allItems.filter((i) => i.masterScheduleId === masterScheduleId);
    const nextClassNum = currentScheduleItems.length + 1;
    const cleanDays =
      schedule.daysList && schedule.daysList.length > 0
        ? schedule.daysList
        : ["Monday", "Wednesday", "Friday"];
    const weekNum = Math.floor((nextClassNum - 1) / cleanDays.length) + 1;
    const dayIndex = (nextClassNum - 1) % cleanDays.length;
    const dayOfWeek = cleanDays[dayIndex] || "Monday";

    const mapping = calculateSequentialMapping(cleanDays, nextClassNum, schedule.startDate);
    const lastMap = mapping[mapping.length - 1] || {};

    const newItem = {
      id: `item_${masterScheduleId}_${String(nextClassNum).padStart(2, "0")}_${Date.now().toString(36)}`,
      masterScheduleId,
      classNumber: nextClassNum,
      weekNumber: weekNum,
      dayOfWeek,
      subject: itemData.subject || `Class ${nextClassNum}: Modular Progression`,
      message:
        itemData.message ||
        `Coaching instructions and movement drills for session ${nextClassNum}.`,
      sessionDate: lastMap.date || "",
      displayDate: lastMap.displayDate || `Week ${weekNum} • ${dayOfWeek}`,
      status: "ACTIVE",
    };

    const updatedItems = [...allItems, newItem];
    writeStorage(STORAGE_KEY_MASTER_ITEMS, updatedItems);

    // Update totalClasses on schedule
    updateMasterSchedule(masterScheduleId, { totalClasses: nextClassNum });

    // Generate and append session
    const singleSession = generateSessionsForSchedule(schedule, [newItem])[0];
    if (singleSession) {
      const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const allSessions = rawSessions ? JSON.parse(rawSessions) : [];
      writeStorage(STORAGE_KEY_SESSIONS, [...allSessions, singleSession]);
    }

    return newItem;
  } catch (err) {
    console.error("Failed to add master class item:", err);
    return null;
  }
}

export function deleteMasterClassItem(itemId) {
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    if (!rawItems) return false;
    let allItems = JSON.parse(rawItems);
    if (!Array.isArray(allItems)) return false;

    const target = allItems.find((i) => i.id === itemId);
    if (!target) return false;

    const masterScheduleId = target.masterScheduleId;
    const schedule = getMasterScheduleById(masterScheduleId);

    const remainingForSchedule = allItems
      .filter((i) => i.masterScheduleId === masterScheduleId && i.id !== itemId)
      .sort((a, b) => a.classNumber - b.classNumber);

    const cleanDays =
      schedule?.daysList && schedule.daysList.length > 0
        ? schedule.daysList
        : ["Monday", "Wednesday", "Friday"];
    const mapping = calculateSequentialMapping(
      cleanDays,
      remainingForSchedule.length,
      schedule?.startDate,
    );

    const renumbered = remainingForSchedule.map((item, idx) => {
      const classNum = idx + 1;
      const map = mapping[idx] || {};
      return {
        ...item,
        classNumber: classNum,
        weekNumber: map.weekNumber || Math.floor((classNum - 1) / cleanDays.length) + 1,
        dayOfWeek: map.dayOfWeek || item.dayOfWeek,
        sessionDate: map.date || item.sessionDate,
        displayDate: map.displayDate || item.displayDate,
      };
    });

    const otherItems = allItems.filter((i) => i.masterScheduleId !== masterScheduleId);
    writeStorage(STORAGE_KEY_MASTER_ITEMS, [...otherItems, ...renumbered]);

    if (schedule) {
      updateMasterSchedule(masterScheduleId, { totalClasses: renumbered.length });
    }

    // Synchronize sessions
    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (rawSessions) {
      const allSessions = JSON.parse(rawSessions);
      const filteredSessions = allSessions.filter((s) => s.masterClassItemId !== itemId);
      writeStorage(STORAGE_KEY_SESSIONS, filteredSessions);
    }

    return true;
  } catch (err) {
    console.error("Failed to delete master class item:", err);
    return false;
  }
}

export function createMasterSchedule(data, itemsData = []) {
  const schedules = getMasterSchedules();
  const newId = `mcs_${String(schedules.length + 1).padStart(3, "0")}`;

  // Resolve batch details to prevent manual re-entry
  const batches = getBatches();
  const selectedBatch = batches.find((b) => b.id === data.batchId) || {};

  const timing =
    selectedBatch.timingLabel ||
    (selectedBatch.startTime && selectedBatch.endTime
      ? `${selectedBatch.startTime} - ${selectedBatch.endTime}`
      : data.timing || "06:00 AM - 07:00 AM");
  const daysList =
    selectedBatch.daysList ||
    (data.daysList && data.daysList.length > 0 ? data.daysList : ["Monday", "Wednesday", "Friday"]);
  const daysLabel = selectedBatch.daysLabel || data.daysLabel || daysList.join(" • ");
  const daysPattern = selectedBatch.daysPattern || data.daysPattern || "MWF";

  const newSchedule = {
    id: newId,
    name: data.name || `${selectedBatch.shortName || selectedBatch.name || "Batch"} Program`,
    batchId: data.batchId || selectedBatch.id,
    batchName: selectedBatch.name || selectedBatch.shortName || data.batchName || "Batch",
    shift: selectedBatch.startTime || data.shift || "06:00 AM",
    startTime: selectedBatch.startTime || data.startTime || "06:00 AM",
    endTime: selectedBatch.endTime || data.endTime || "07:00 AM",
    timing,
    daysPattern,
    daysLabel,
    daysList,
    coachId: data.coachId || "TRN-101",
    coachName: data.coachName || "Dolliee Ellens",
    totalClasses: 12,
    capacity: selectedBatch.maxPax || data.capacity || 28,
    status: data.status || "Active",
    startDate: data.startDate || new Date().toISOString().slice(0, 10),
    description: data.description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Build items
  const totalClassesToGenerate = itemsData.length > 0 ? itemsData.length : data.totalClasses || 12;
  const mapping = calculateSequentialMapping(
    daysList,
    totalClassesToGenerate,
    newSchedule.startDate,
  );
  const items = mapping.map((m, idx) => {
    const userItem = itemsData[idx] || {};
    const defaultCurr = DEFAULT_12_CLASS_CURRICULUM[idx] || {};
    return {
      id: `item_${newId}_${String(m.classNumber).padStart(2, "0")}`,
      masterScheduleId: newId,
      classNumber: m.classNumber,
      weekNumber: m.weekNumber,
      dayOfWeek: m.dayOfWeek,
      subject: userItem.subject || defaultCurr.subject || `Class ${m.classNumber}`,
      message:
        userItem.message ||
        defaultCurr.message ||
        `Curriculum guidance for session ${m.classNumber}.`,
      sessionDate: m.date,
      displayDate: m.displayDate,
      status: "ACTIVE",
    };
  });

  // Save Schedule
  const updatedSchedules = [newSchedule, ...schedules];
  writeStorage(STORAGE_KEY_MASTER_SCHEDULES, updatedSchedules);

  // Save Items
  let allItems = [];
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    allItems = rawItems ? JSON.parse(rawItems) : [];
  } catch {
    allItems = [];
  }
  writeStorage(STORAGE_KEY_MASTER_ITEMS, [...allItems, ...items]);

  // Generate Sessions
  const generatedSessions = generateSessionsForSchedule(newSchedule, items);
  let allSessions = [];
  try {
    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    allSessions = rawSessions ? JSON.parse(rawSessions) : [];
  } catch {
    allSessions = [];
  }
  writeStorage(STORAGE_KEY_SESSIONS, [...generatedSessions, ...allSessions]);

  return { schedule: newSchedule, items, sessions: generatedSessions };
}

export function updateMasterSchedule(id, updates, itemsData) {
  const schedules = getMasterSchedules();
  const index = schedules.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const current = schedules[index];
  const batches = getBatches();
  const selectedBatch = batches.find((b) => b.id === (updates.batchId || current.batchId)) || {};

  const daysList = selectedBatch.daysList || updates.daysList || current.daysList;
  const startDate = updates.startDate || current.startDate;
  const totalClasses =
    itemsData && itemsData.length > 0
      ? itemsData.length
      : updates.totalClasses || current.totalClasses || 12;

  const updatedSchedule = {
    ...current,
    ...updates,
    totalClasses,
    batchName:
      selectedBatch.name || selectedBatch.shortName || updates.batchName || current.batchName,
    shift: selectedBatch.startTime || updates.startTime || current.startTime,
    startTime: selectedBatch.startTime || updates.startTime || current.startTime,
    endTime: selectedBatch.endTime || updates.endTime || current.endTime,
    timing: selectedBatch.timingLabel || current.timing,
    daysPattern: selectedBatch.daysPattern || updates.daysPattern || current.daysPattern,
    daysLabel: selectedBatch.daysLabel || updates.daysLabel || current.daysLabel,
    daysList,
    capacity: selectedBatch.maxPax || updates.capacity || current.capacity,
    updatedAt: new Date().toISOString(),
  };

  schedules[index] = updatedSchedule;
  writeStorage(STORAGE_KEY_MASTER_SCHEDULES, schedules);

  // Update Items if provided
  let newItems = [];
  if (itemsData && Array.isArray(itemsData) && itemsData.length > 0) {
    const mapping = calculateSequentialMapping(daysList, itemsData.length, startDate);
    newItems = mapping.map((m, idx) => {
      const userItem = itemsData[idx] || {};
      return {
        id: userItem.id || `item_${id}_${String(m.classNumber).padStart(2, "0")}`,
        masterScheduleId: id,
        classNumber: m.classNumber,
        weekNumber: m.weekNumber,
        dayOfWeek: m.dayOfWeek,
        subject: userItem.subject || `Class ${m.classNumber}`,
        message: userItem.message || "",
        sessionDate: m.date,
        displayDate: m.displayDate,
        status: userItem.status || "ACTIVE",
      };
    });

    try {
      const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
      const existingItems = rawItems ? JSON.parse(rawItems) : [];
      const filtered = existingItems.filter((i) => i.masterScheduleId !== id);
      writeStorage(STORAGE_KEY_MASTER_ITEMS, [...filtered, ...newItems]);
    } catch (e) {
      console.error(e);
    }

    // Regenerate Sessions
    const sessions = generateSessionsForSchedule(updatedSchedule, newItems);
    try {
      const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const existingSessions = rawSessions ? JSON.parse(rawSessions) : [];
      const filteredSessions = existingSessions.filter((s) => s.masterScheduleId !== id);
      writeStorage(STORAGE_KEY_SESSIONS, [...sessions, ...filteredSessions]);
    } catch (e) {
      console.error(e);
    }
  }

  return updatedSchedule;
}

export function duplicateMasterSchedule(id) {
  const original = getMasterScheduleById(id);
  if (!original) return null;
  const originalItems = getScheduleItems(id);

  const duplicateData = {
    ...original,
    name: `${original.name} (Copy)`,
  };
  delete duplicateData.id;

  return createMasterSchedule(duplicateData, originalItems);
}

export function toggleMasterScheduleStatus(id) {
  const schedules = getMasterSchedules();
  const schedule = schedules.find((s) => s.id === id);
  if (!schedule) return null;

  schedule.status = schedule.status === "Active" ? "Inactive" : "Active";
  writeStorage(STORAGE_KEY_MASTER_SCHEDULES, schedules);
  return schedule;
}

export function deleteMasterSchedule(id) {
  const schedules = getMasterSchedules();
  const filtered = schedules.filter((s) => s.id !== id);
  writeStorage(STORAGE_KEY_MASTER_SCHEDULES, filtered);

  // Remove related items
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    if (rawItems) {
      const items = JSON.parse(rawItems);
      writeStorage(
        STORAGE_KEY_MASTER_ITEMS,
        items.filter((i) => i.masterScheduleId !== id),
      );
    }
  } catch {
    // ignore
  }

  // Remove related sessions
  try {
    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (rawSessions) {
      const sessions = JSON.parse(rawSessions);
      writeStorage(
        STORAGE_KEY_SESSIONS,
        sessions.filter((s) => s.masterScheduleId !== id),
      );
    }
  } catch {
    // ignore
  }

  return true;
}

// --- SESSIONS API ---

export function getSessions() {
  // Ensure master schedules are loaded first so sessions get seeded if needed
  getMasterSchedules();
  const sessions = readStorage(STORAGE_KEY_SESSIONS, []);

  // Synchronize status with current date (today -> TODAY, past -> COMPLETED, future -> SCHEDULED)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayUtc = now.toISOString().slice(0, 10);

  let updated = false;
  const synchronizedSessions = sessions.map((s) => {
    if (s.status === "CANCELLED" || s.status === "COMPLETED") return s;
    if (s.sessionDate === today || s.sessionDate === todayUtc) {
      if (s.status !== "TODAY") {
        updated = true;
        return { ...s, status: "TODAY" };
      }
    } else if (s.sessionDate && s.sessionDate < today && s.sessionDate < todayUtc) {
      if (s.status !== "COMPLETED") {
        updated = true;
        return { ...s, status: "COMPLETED" };
      }
    }
    return s;
  });

  if (updated) {
    writeStorage(STORAGE_KEY_SESSIONS, synchronizedSessions);
    return synchronizedSessions;
  }

  return sessions;
}

export function updateSessionStatus(sessionId, newStatus) {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index === -1) return null;

  sessions[index].status = newStatus;
  writeStorage(STORAGE_KEY_SESSIONS, sessions);
  return sessions[index];
}

export function updateSession(sessionId, updates) {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index === -1) return null;

  sessions[index] = { ...sessions[index], ...updates };
  writeStorage(STORAGE_KEY_SESSIONS, sessions);
  return sessions[index];
}

// --- HOLIDAYS API ---

export function getHolidays() {
  let holidays = readStorage(STORAGE_KEY_HOLIDAYS, SEED_HOLIDAYS);
  let needsSync = false;

  // Clean out legacy placeholder entries like "Annual Strength Games"
  const cleanedHolidays = holidays.filter(
    (h) => !h.name?.toLowerCase().includes("annual strength games")
  );
  if (cleanedHolidays.length !== holidays.length) {
    holidays = cleanedHolidays;
    needsSync = true;
  }

  // Ensure all seed holidays exist in the list
  SEED_HOLIDAYS.forEach((seed) => {
    const seedName = seed.name.toLowerCase().trim();
    const exists = holidays.some(
      (h) =>
        h.name?.toLowerCase().trim() === seedName ||
        h.name?.toLowerCase().includes(seedName) ||
        seedName.includes(h.name?.toLowerCase().trim())
    );
    if (!exists) {
      holidays.push(seed);
      needsSync = true;
    }
  });

  if (needsSync) {
    holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
    writeStorage(STORAGE_KEY_HOLIDAYS, holidays);
  }

  return holidays;
}

export function addHoliday(holidayData) {
  const holidays = getHolidays();
  const newId = `HOL-${String(Date.now()).slice(-4)}`;
  const newHoliday = {
    id: newId,
    name: holidayData.name,
    date: holidayData.date,
    type: holidayData.type || "Public Holiday",
    affectedBatches: holidayData.affectedBatches || "ALL",
    description: holidayData.description || "",
    status: "Active",
    createdAt: new Date().toISOString(),
  };

  const updated = [...holidays, newHoliday].sort((a, b) => new Date(a.date) - new Date(b.date));
  writeStorage(STORAGE_KEY_HOLIDAYS, updated);
  return newHoliday;
}

export function updateHoliday(id, holidayData) {
  const holidays = getHolidays();
  const index = holidays.findIndex((h) => h.id === id);
  if (index === -1) return null;

  holidays[index] = {
    ...holidays[index],
    name: holidayData.name !== undefined ? holidayData.name : holidays[index].name,
    date: holidayData.date !== undefined ? holidayData.date : holidays[index].date,
    type: holidayData.type !== undefined ? holidayData.type : holidays[index].type,
    affectedBatches:
      holidayData.affectedBatches !== undefined
        ? holidayData.affectedBatches
        : holidays[index].affectedBatches,
    description:
      holidayData.description !== undefined
        ? holidayData.description
        : holidays[index].description,
    status: holidayData.status !== undefined ? holidayData.status : holidays[index].status,
    updatedAt: new Date().toISOString(),
  };

  const sorted = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  writeStorage(STORAGE_KEY_HOLIDAYS, sorted);
  return holidays[index];
}

export function deleteHoliday(id) {
  const holidays = getHolidays();
  const filtered = holidays.filter((h) => h.id !== id);
  writeStorage(STORAGE_KEY_HOLIDAYS, filtered);
  return true;
}
