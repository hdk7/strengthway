/* eslint-disable max-lines */
import { api } from "@/lib/apiClient";

export const SEED_CURRICULUM_VERSION = "2026-v4-batch-distinct-curriculums";

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

// 15 Standard Reusable Class Programs Seed
export const REUSABLE_CLASSES_SEED = [
  {
    id: "CLS-001",
    name: "Push, Legs, Pull",
    beginnerWorkouts: "Not specified",
    intermediateWorkouts:
      "Push: Push ups 5–10 × 3; Dips 4–10 × 3; OH Press 6–10 × 3. Legs: GB Squats 8–10 × 3; Deadlift 6–10 × 3; Calf Raises 15–20 × 3; Step Ups 6–10 × 3. Pull: Hori Pulls 6–10 × 3; Lateral Pull down 6–8 × 3; Bent over rows 6–10 × 3.",
    status: "ACTIVE",
  },
  {
    id: "CLS-002",
    name: "EMOM",
    beginnerWorkouts:
      "8 mins: Pull-ups, Push ups, Deadlifts. E2MOM (10 mins): Elbow plank 30s/30s Rest; Hollow body 30s/30s Rest. Alternate bicep curls 10 × 3; OH Tricep Extensions 6–8 × 3.",
    intermediateWorkouts:
      "EMOM (10 mins each): Swings 15–20 + Farmer's Carry 30–40s; Pull ups 2–6 + Deadhang 30s; Squats 6–10 + Ape Hops 30s; Push ups/Dips 4–6 + Goblet Carry 30s.",
    status: "ACTIVE",
  },
  {
    id: "CLS-003",
    name: "5×5",
    beginnerWorkouts: "Not specified",
    intermediateWorkouts:
      "Push ups/Plate Press/OH Press; Squats; Deadlift; Pulls.",
    status: "ACTIVE",
  },
  {
    id: "CLS-004",
    name: "Circuit Training",
    beginnerWorkouts:
      "1 min Skipping; 1 min Elbow Plank; 10 Goblet Squats; 30s Ape Hops; 30s Lateral Bear Crawl; 60s Wall Sit; 10 Walking Burpees; × 3 sets. Additional circuit: Walking Burpees 5/7/9; Elbow plank 45s/60s/45s; Backward bear crawl 10m/15m/20m; GB Squats 10/8/6; Swings 15/20; Wall Sit 45s/60s/45s; Walking burpees 5/7/9; GB Carry hold 30s/45s/30s; × 3.",
    intermediateWorkouts:
      "100 Skips; 10 Squat Jumps; 10 Push ups; 1 min Elbow plank; 10 Burpees; 100 mts Farmer's Carry; × 5 sets.",
    status: "ACTIVE",
  },
  {
    id: "CLS-005",
    name: "Five-O/ Fiery 50",
    beginnerWorkouts: "Not specified",
    intermediateWorkouts:
      "50 Squats; 50 Pulls; 50 Hinges; 50 Push; 50mt Crawl; 500m Carry.",
    status: "ACTIVE",
  },
  {
    id: "CLS-006",
    name: "Super-sets",
    beginnerWorkouts:
      "Push-ups 4–8; Bear Crawl 10m × 3. GB Squats 10; Wall Sit 30–60s × 3. Deadlift 10; Elbow plank 30–60s × 3. Hori Pulls 6–8; Farmer's Carry 40m × 3.",
    intermediateWorkouts:
      "Push-ups 10; OH Press 10 × 3. GB Squats 10; Sumo Squat hold 30s × 3. Hori Pulls 8; Lat Pull down 10 × 3. Farmers March 30–45s; Inchworm 5 × 3. GB Swings 15; Step Ups 8/8 × 3.",
    status: "ACTIVE",
  },
  {
    id: "CLS-007",
    name: "Easy Strength",
    beginnerWorkouts:
      "Farmer's Carry 100m × 3; Bear Crawl 10m × 3; Push-ups 8 × 3; Deadhang 30–60s × 3; GB Squats 10 × 3; Hori Pulls 10 × 3; Wall Sit 45s × 3; Ape Hops 20m × 3.",
    intermediateWorkouts: "Not specified",
    status: "ACTIVE",
  },
  {
    id: "CLS-008",
    name: "4 Levels",
    beginnerWorkouts:
      "Hori Pulls 8; GB Swings 15; Bird Dog 8/8; Elbow plank 45–60s; × 3. Marching (w/weights) 1 min; Superman plank 30s; Push ups 3; GB Squats 8; Deadhang 40s; × 3.",
    intermediateWorkouts: "Not specified",
    status: "ACTIVE",
  },
  {
    id: "CLS-009",
    name: "Tri-sets",
    beginnerWorkouts: "Not specified",
    intermediateWorkouts:
      "Set 1: Hori Pulls 6; Deadhang shrugs 10; F.Carry hold 30–60s; × 2–3 sets. Set 2: Deadlift 5–8; Step Ups 8/8; Hip Bridge hold w/weight 30s; × 2–3 sets. Set 3: Push ups 4–6; OH press 5–8; High Plank 30s; × 2–3 sets. Set 4: Squats 8; Ape Hops 10m; Sumo Squat hold 30s; × 2–3 sets.",
    status: "ACTIVE",
  },
  {
    id: "CLS-010",
    name: "4321",
    beginnerWorkouts:
      "Push ups/Plate/Bench Press 5–10 × 4. Goblet Squats 8–12; TB Deadlift 5–8 × 3. Hori Pull 10; Pulls/Lat Pull down 2–6; Single Arm Rows 8/8 × 2. Wall Sit 100s; Elbow plank 60s; Deadhang 60s; Burpees 20.",
    intermediateWorkouts:
      "Push-ups 4–8 × 4. Lat Pull down 6–10; Bent over rows 6–8; F.Carry hold 30s × 3. Deadlift 5–8; Squats 6–10 × 2. Burpees 40; Mixed Crawls 3 mins; Calf/Toe Raises 50; Plank 3 mins × 1.",
    status: "ACTIVE",
  },
  {
    id: "CLS-011",
    name: "Pull,Push, Squats, Core",
    beginnerWorkouts:
      "3 sets each: Pulls — Hori Pulls 6–8, Single Arm rows 8/8. Push — Push-ups 6, Plate press 8. Squats — Step Ups 8/8, GB Squats 6–8, Trap Bar Deadlift 8. Core — Deadbug 10/10, Superman pulses 30s, Elbow plank 60s.",
    intermediateWorkouts: "Not specified",
    status: "ACTIVE",
  },
  {
    id: "CLS-012",
    name: "Double Trouble",
    beginnerWorkouts:
      "Push-ups 5; Rest 30s; Push ups 5. GB Squats 6–8; Rest 30s; GB Squats 6–8. Hori Pulls 6–8; Rest 30s; Hori Pulls 6–8. GB Swings 12–15; Rest 30s; GB Swings 12–15. Crawls 10m/30s; Rest 30s; Crawls 10m/30s. Carries 1–2 min; Rest 30s; Carries 1–2 min.",
    intermediateWorkouts: "Not specified",
    status: "ACTIVE",
  },
  {
    id: "CLS-013",
    name: "Farmer's Strength",
    beginnerWorkouts:
      "Get the Numbers; Stairs; Wall Sit; Carries; Crawl; Elbow plank; Squats; Pulls; Walking burpees.",
    intermediateWorkouts: "Not specified",
    status: "ACTIVE",
  },
  {
    id: "CLS-014",
    name: "250",
    beginnerWorkouts:
      "5 Push ups; 5 GB Squats; 5 Pulls; 5 Deadlift; 5 Walking Burpees; × 5 sets; and repeat. 125 reps – break – 125 reps.",
    intermediateWorkouts: "Not specified",
    status: "ACTIVE",
  },
  {
    id: "CLS-015",
    name: "Pull & Legs",
    beginnerWorkouts: "Not specified",
    intermediateWorkouts:
      "Pulls 2–5 × 3–5 sets; Bent over rows 8 × 3; Hori Pulls 8 × 3; Single Arm rows 8/8 × 3. Staggered Goblet Squat 8/8 × 3; Step Ups 8/8 × 3; Stationary Lunges 10/10 × 3; Wt Wall Sit 45s × 3.",
    status: "ACTIVE",
  },
];

const buildCurriculum = (offset = 0) => {
  return Array.from({ length: 12 }, (_, i) => {
    const cls = REUSABLE_CLASSES_SEED[(i + offset) % REUSABLE_CLASSES_SEED.length];
    return {
      classNumber: i + 1,
      classId: cls.id,
      className: cls.name,
      subject: cls.name,
      message: `Beginner: ${cls.beginnerWorkouts}\nIntermediate: ${cls.intermediateWorkouts}`,
      beginnerWorkouts: cls.beginnerWorkouts,
      intermediateWorkouts: cls.intermediateWorkouts,
    };
  });
};

export const DEFAULT_12_CLASS_CURRICULUM = buildCurriculum(0);
export const ALTERNATIVE_CURRICULUM_ATHLETIC = buildCurriculum(1);

export const BATCH_1_CURRICULUM = buildCurriculum(0);
export const BATCH_2_CURRICULUM = buildCurriculum(1);
export const BATCH_3_CURRICULUM = buildCurriculum(2);
export const BATCH_3_SEPTEMBER_CURRICULUM = buildCurriculum(2);
export const BATCH_4_CURRICULUM = buildCurriculum(3);
export const BATCH_5_CURRICULUM = buildCurriculum(4);
export const BATCH_6_CURRICULUM = buildCurriculum(5);

export const BATCH_CURRICULUMS = {
  "BATCH-01": BATCH_1_CURRICULUM,
  "BATCH-02": BATCH_2_CURRICULUM,
  "BATCH-03": BATCH_3_CURRICULUM,
  "BATCH-04": BATCH_4_CURRICULUM,
  "BATCH-05": BATCH_5_CURRICULUM,
  "BATCH-06": BATCH_6_CURRICULUM,
};

export const SEED_HOLIDAYS = [
  { id: "HOL-NY-2026", name: "New Year", date: "2026-01-01", type: "Public Holiday", affectedBatches: "ALL", description: "New Year celebration. Gym premises closed for all batches.", status: "Active" },
  { id: "HOL-PG-2026", name: "Pongal", date: "2026-01-15", type: "Festival Holiday", affectedBatches: "ALL", description: "Harvest festival celebrations. All batch sessions suspended.", status: "Active" },
  { id: "HOL-RD-2026", name: "Republic Day", date: "2026-01-26", type: "National Holiday", affectedBatches: "ALL", description: "Republic Day of India. Gym premises closed for all shifts.", status: "Active" },
  { id: "HOL-RZ-2026", name: "Ramzan", date: "2026-03-20", type: "Festival Holiday", affectedBatches: "ALL", description: "Eid-ul-Fitr celebrations. Regular batch classes suspended.", status: "Active" },
  { id: "HOL-LD-2026", name: "Labour Day", date: "2026-05-01", type: "National Holiday", affectedBatches: "ALL", description: "International Workers' Day / May Day. Gym closed for all shifts.", status: "Active" },
  { id: "HOL-ID-2026", name: "Independence Day", date: "2026-08-15", type: "National Holiday", affectedBatches: "ALL", description: "Independence Day of India. Gym premises closed all shifts.", status: "Active" },
  { id: "HOL-VC-2026", name: "Vinayaka Chathurthi", date: "2026-09-14", type: "Festival Holiday", affectedBatches: "ALL", description: "Ganesh Chaturthi celebrations. Morning open gym only; regular batches suspended.", status: "Active" },
  { id: "HOL-GJ-2026", name: "Gandhi Jayanti", date: "2026-10-02", type: "National Holiday", affectedBatches: "ALL", description: "Mahatma Gandhi Jayanti. Gym premises closed all shifts.", status: "Active" },
  { id: "HOL-DW-2026", name: "Diwali", date: "2026-11-08", type: "Festival Holiday", affectedBatches: "ALL", description: "Festival of Lights & Deepavali. Morning open gym only; regular class batches suspended.", status: "Active" },
  { id: "HOL-XM-2026", name: "Christmas", date: "2026-12-25", type: "Festival Holiday", affectedBatches: "ALL", description: "Christmas celebrations. Holiday open mat session 08:00 AM - 12:00 PM only.", status: "Active" },
];

// Helper: Calculate Sequential Mapping for 12 classes against batch recurring days
export function calculateSequentialMapping(daysList, totalClasses = 12, startDateStr) {
  const cleanDays =
    Array.isArray(daysList) && daysList.length > 0 ? daysList : ["Monday", "Wednesday", "Friday"];

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
      const mappedDayName = dayName;

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

// Resolve assigned batch objects
export function resolveAssignedBatches(batchIds = [], allBatches = []) {
  if (!Array.isArray(batchIds) || batchIds.length === 0) return [];
  return batchIds.map((id) => (allBatches || []).find((b) => b.id === id)).filter(Boolean);
}

// Resolve assigned batch names string (e.g. "BATCH 1 • BATCH 2")
export function resolveBatchNames(batchIds = [], allBatches = []) {
  const list = resolveAssignedBatches(batchIds, allBatches);
  if (list.length === 0) return "Reusable Template (Unassigned)";
  return list.map((b) => b.shortName || b.name || b.id).join(" • ");
}

// ─── MASTER SCHEDULES API ────────────────────────────────────────────────────────

export async function getMasterSchedules(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.batchId) query.set("batchId", params.batchId);
  if (params.search) query.set("search", params.search);
  const qs = query.toString();
  return api.get(`/v1/schedules${qs ? `?${qs}` : ""}`);
}

export async function getMasterScheduleById(id) {
  if (!id) return null;
  return api.get(`/v1/schedules/${encodeURIComponent(id)}`);
}

export async function getMasterScheduleByBatchId(batchId) {
  if (!batchId) return null;
  const list = await api.get(`/v1/schedules?batchId=${encodeURIComponent(batchId)}`);
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
}

export async function getMasterSchedulesByBatchId(batchId) {
  if (!batchId) return [];
  return api.get(`/v1/schedules?batchId=${encodeURIComponent(batchId)}`);
}

export async function createMasterSchedule(data, itemsData) {
  return api.post("/v1/schedules", {
    ...data,
    ...(itemsData !== undefined ? { items: itemsData } : {}),
  });
}

export async function updateMasterSchedule(id, updates, itemsData) {
  return api.put(`/v1/schedules/${encodeURIComponent(id)}`, {
    ...updates,
    ...(itemsData !== undefined ? { items: itemsData } : {}),
  });
}

export async function deleteMasterSchedule(id) {
  return api.delete(`/v1/schedules/${encodeURIComponent(id)}`);
}

export async function toggleMasterScheduleStatus(id) {
  return api.patch(`/v1/schedules/${encodeURIComponent(id)}/toggle-status`);
}

export async function assignBatchesToProgram(programId, batchIds = []) {
  return api.patch(`/v1/schedules/${encodeURIComponent(programId)}/assign-batches`, {
    batchIds,
  });
}

export async function duplicateMasterSchedule(id) {
  return api.post(`/v1/schedules/${encodeURIComponent(id)}/duplicate`);
}

export async function getBatchTrackingSummary(programId) {
  if (!programId) return [];
  return api.get(`/v1/schedules/${encodeURIComponent(programId)}/tracking`);
}

// ─── CURRICULUM ITEMS API ────────────────────────────────────────────────────────

export async function getScheduleItems(scheduleId) {
  if (!scheduleId) return [];
  return api.get(`/v1/schedules/${encodeURIComponent(scheduleId)}/items`);
}

export async function addMasterClassItem(scheduleId, itemData = {}) {
  return api.post(`/v1/schedules/${encodeURIComponent(scheduleId)}/items`, itemData);
}

export async function updateMasterClassItem(itemId, updates) {
  return api.put(`/v1/schedules/items/${encodeURIComponent(itemId)}`, updates);
}

export async function deleteMasterClassItem(itemId) {
  return api.delete(`/v1/schedules/items/${encodeURIComponent(itemId)}`);
}

// ─── SESSIONS API ────────────────────────────────────────────────────────────────

export async function getSessions(scheduleId, batchId) {
  const params = new URLSearchParams();
  if (scheduleId) params.set("scheduleId", scheduleId);
  if (batchId) params.set("batchId", batchId);
  const qs = params.toString();
  return api.get(`/v1/sessions${qs ? `?${qs}` : ""}`);
}

export async function updateSessionStatus(sessionId, newStatus) {
  return api.patch(`/v1/sessions/${encodeURIComponent(sessionId)}/status`, {
    status: newStatus,
  });
}

export async function updateSession(sessionId, updates) {
  return api.put(`/v1/sessions/${encodeURIComponent(sessionId)}`, updates);
}

// ─── HOLIDAYS API ────────────────────────────────────────────────────────────────

export async function getHolidays(search) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get(`/v1/holidays${qs}`);
}

export async function addHoliday(holidayData) {
  return api.post("/v1/holidays", holidayData);
}

export async function updateHoliday(id, holidayData) {
  return api.put(`/v1/holidays/${encodeURIComponent(id)}`, holidayData);
}

export async function deleteHoliday(id) {
  return api.delete(`/v1/holidays/${encodeURIComponent(id)}`);
}

// ─── TRAINER LEAVE POLICY API ──────────────────────────────────────────────────

export async function getTrainerLeavePolicy() {
  return api.get("/v1/attendance/leave-policy");
}

export async function saveTrainerLeavePolicy(policyData) {
  return api.put("/v1/attendance/leave-policy", policyData);
}

export async function validateTrainerLeaveNotice(payload) {
  return api.post("/v1/attendance/leave-policy/validate", payload);
}

