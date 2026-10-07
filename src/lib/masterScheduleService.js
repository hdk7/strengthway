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
  { classNumber: 1, subject: "Athletic Baseline & Dynamic Screening", message: "Initial screening of mobility, joint angles, and cardiovascular capacity." },
  { classNumber: 2, subject: "Linear Acceleration & Foot Strike Mechanics", message: "Wall drills, sprint starts, and posture during acceleration phase." },
  { classNumber: 3, subject: "Multi-Directional Agility & Deceleration", message: "Change of direction, 5-10-5 agility shuttle, and ankle stability." },
  { classNumber: 4, subject: "Barbell Power Cleans & Triple Extension", message: "Hip drive, rapid elbow turnover, and barbell catch positioning." },
  { classNumber: 5, subject: "Rotational Power & Med-Ball Throw Dynamics", message: "Transverse plane power, rotational slams, and core deceleration." },
  { classNumber: 6, subject: "Lactate Tolerance & High-Output Intervals", message: "SkiErg and Assault Bike pyramid intervals with short rest windows." },
  { classNumber: 7, subject: "Loaded Carries & Grip Endurance Challenge", message: "Trap bar carries, suitcase holds, and overhead waiter walks." },
  { classNumber: 8, subject: "Reactive Plyometrics & Ground Contact Speed", message: "Depth drops, reactive hurdle hops, and minimizing ground contact time." },
  { classNumber: 9, subject: "Heavy Barbell Complexes & Posterior Strength", message: "Snatch grip high pulls, zercher squats, and barbell hip thrusts." },
  { classNumber: 10, subject: "Combat Conditioning & Functional Stamina", message: "Heavy bag striking intervals, tire flips, and sprawl conditioning." },
  { classNumber: 11, subject: "Joint Decompression & Fascial Stretch Therapy", message: "Band-assisted joint distraction, hip capsule stretches, and soft tissue work." },
  { classNumber: 12, subject: "Athletic Gauntlet & Graduation Benchmark", message: "Comprehensive obstacle course challenge, final times recording, and badges award." },
];

export const BATCH_1_CURRICULUM = [
  { classNumber: 1, subject: "Movement Assessment & Baseline Mobility Screen", message: "Baseline movement screen, overhead squat assessment, thoracic spine mobility flows, and core activation protocols." },
  { classNumber: 2, subject: "Lower Body Mechanics & Goblet Squat Depth", message: "Foot tripod pressure, knee tracking alignment, goblet squat depth standards, and eccentric tempo control under moderate load." },
  { classNumber: 3, subject: "Horizontal Push/Pull & Scapular Stability", message: "Dumbbell bench press setups, chest-supported rows, serratus anterior activation, and rotator cuff stability protocols." },
  { classNumber: 4, subject: "Hip Hinge Patterning & Romanian Deadlifts", message: "Posterior chain engagement, Romanian deadlift bar path, hamstring tension without lumbar flexion, and glute squeeze." },
  { classNumber: 5, subject: "Unilateral Lunge Variations & Hip Stability", message: "Reverse lunges, split squat balance, pelvic leveling drills, and addressing side-to-side strength asymmetries." },
  { classNumber: 6, subject: "Core Bracing & Anti-Rotational Protocols", message: "Intra-abdominal pressure bracing, Pallof presses, suitcase carries, and plank with reaching taps." },
  { classNumber: 7, subject: "Barbell Back Squat Introduction & Walkout", message: "Barbell positioning across upper traps, rack safety pin heights, walkout cadence, and consistent depth calibration." },
  { classNumber: 8, subject: "Overhead Pressing Mechanics & Shoulder Health", message: "Standing strict dumbbell overhead press, active core lockout, rib flare prevention, and rear deltoid accessory work." },
  { classNumber: 9, subject: "Barbell Deadlift Setup & Tension Calibration", message: "Conventional deadlift setup, bar against shins, lat engagement to pack the bar, and explosive leg drive off the floor." },
  { classNumber: 10, subject: "Compound Super-Set Density & Work Capacity", message: "Pairing barbell squats with inverted bodyweight rows for cardiovascular demand and time-under-tension overload." },
  { classNumber: 11, subject: "Mobility Decompression & Fascial Recovery", message: "Active recovery flow, hip flexor release, latissimus dorsi foam rolling, and parasympathetic diaphragmatic breathing." },
  { classNumber: 12, subject: "Strength Benchmark Testing & PR Validation", message: "3-rep working max assessment across squat and deadlift, movement milestone celebration, and individual progression reviews." },
];

export const BATCH_2_CURRICULUM = [
  { classNumber: 1, subject: "Hypertrophy Primer & Kinetic Chain Warmup", message: "Dynamic kinetic chain activation, motor unit recruitment drills, and establishing 3-second eccentric tempo baseline." },
  { classNumber: 2, subject: "Quad Hypertrophy & Front Squat Mechanics", message: "Front rack positioning, clean grip vs crossed arm setups, quad isolation, and high-volume goblet squat dropsets." },
  { classNumber: 3, subject: "Pectoral Hypertrophy & Incline Dumbbell Press", message: "Incline dumbbell bench pressing, 45-degree angle path, chest contraction squeeze at apex, and cable chest flyes." },
  { classNumber: 4, subject: "Hamstring Hypertrophy & Stiff-Leg Deadlifts", message: "Stiff-leg barbell deadlifts, hamstring stretch under load, seated leg curl control, and glute-ham tie-in development." },
  { classNumber: 5, subject: "Back Thickness & Barbell Bent-Over Rows", message: "Pendlay rows, lat pull-down squeeze techniques, scapular depression, and mid-trap hypertrophy volume." },
  { classNumber: 6, subject: "Deltoid Sculpting & Lateral Raise Mechanics", message: "Dumbbell lateral raise form, overhead push press, upright row variations, and rear deltoid fly volume." },
  { classNumber: 7, subject: "Arm Hypertrophy Superset Specialization", message: "Bicep barbell curls paired with tricep skull crushers, pump volume protocols, and forearm grip endurance." },
  { classNumber: 8, subject: "Bulgarian Split Squat & Glute Focus", message: "Rear foot elevated split squats, forward torso lean for glute recruitment, and walking lunges with dumbbells." },
  { classNumber: 9, subject: "Close-Grip Bench Press & Tricep Overload", message: "Close-grip barbell pressing for triceps and inner chest, dip progressions, and diamond pushup volume." },
  { classNumber: 10, subject: "Metabolic Hypertrophy Circuit (Giant Sets)", message: "4-station non-stop giant sets for maximum metabolic fatigue, glycogen depletion, and vascular pump." },
  { classNumber: 11, subject: "Fascial Stretch Therapy & Muscle Recovery", message: "Inter-muscular fascial stretching, soft tissue lacrosse ball release on traps and pecs, and recovery hydration." },
  { classNumber: 12, subject: "Hypertrophy Volume Assessment & PR Pump", message: "8-rep max benchmark challenges on primary lifts, body composition milestone tracking, and certificate awards." },
];

export const BATCH_3_CURRICULUM = [
  { classNumber: 1, subject: "Olympic Movement Screen & Ankle/Wrist Mobility", message: "Front rack wrist mobility, ankle dorsiflexion screening, PVC pipe snatch balance drills, and thoracic extension." },
  { classNumber: 2, subject: "Hang Power Clean Mechanics & Elbow Speed", message: "Triple extension from hang position, aggressive hip pop, rapid elbow turnover, and stable front rack catch." },
  { classNumber: 3, subject: "Heavy Barbell Back Squat & Core Stability", message: "Low bar vs high bar back squats, breathing into weight belt, driving out of the hole, and heavy 5x5 protocols." },
  { classNumber: 4, subject: "Snatch High Pull & Hip Contact Drills", message: "Snatch grip width measurement, brushing the hip crease, explosive vertical jump shrug, and bar path tracking." },
  { classNumber: 5, subject: "Push Press & Split Jerk Footwork Dynamics", message: "Dip and drive mechanics, vertical torso alignment, split footwork chalk drill, and catching with locked elbows." },
  { classNumber: 6, subject: "Deadlift Velocity & Deficit Pull Power", message: "1-inch deficit deadlifts, building explosive starting speed off floor, and heavy trap bar pulls for neural drive." },
  { classNumber: 7, subject: "Full Power Clean & Front Squat Complex", message: "Transitioning from power clean into full squat clean, catching in deep squat, and standing tall with composure." },
  { classNumber: 8, subject: "Overhead Squat Balance & Core Bracing", message: "Wide grip overhead squats, active shoulder push into the bar, maintaining balance over mid-foot, and bailout safety." },
  { classNumber: 9, subject: "Clean and Jerk Combination Execution", message: "Putting clean and jerk together, pacing between clean and dip-drive, mental focus under heavy barbell loads." },
  { classNumber: 10, subject: "Olympic Barbell Complex & High Power Output", message: "1 Clean + 1 Hang Clean + 1 Front Squat + 1 Jerk unbroken complexes for peak power endurance." },
  { classNumber: 11, subject: "Spinal Decompression & Barbell Deload Flow", message: "Hanging bar decompressions, hip capsule mobilization with monster bands, and central nervous system recovery." },
  { classNumber: 12, subject: "Olympic Lifting Max Testing & PR Celebration", message: "Testing 1RM/3RM Clean & Jerk and Snatch benchmarks, technical video analysis review, and ceremony." },
];
export const BATCH_3_SEPTEMBER_CURRICULUM = BATCH_3_CURRICULUM;

export const BATCH_4_CURRICULUM = [
  { classNumber: 1, subject: "Athletic Movement Screen & Dynamic Primer", message: "Linear dynamic warmup, A-skips, B-skips, ankle stiffness drills, and multi-planar joint preparation." },
  { classNumber: 2, subject: "Linear Acceleration & 10m Sprint Starts", message: "45-degree forward lean posture, positive shin angles, explosive first three steps, and wall acceleration drills." },
  { classNumber: 3, subject: "Multi-Directional Agility & Lateral Shuffle", message: "Lateral bounding, low center of gravity shuffles, cone drill reactions, and knee stabilization cues." },
  { classNumber: 4, subject: "Deceleration Mechanics & Landing Control", message: "Bilateral stick-and-land mechanics, shock absorption through ankles/knees/hips, and preventing valgus collapse." },
  { classNumber: 5, subject: "Box Jumps & Explosive Vertical Power", message: "Step-down plyometric box jumps, triple extension power, seated explosive jumps, and landing soft on balls of feet." },
  { classNumber: 6, subject: "Pro Agility (5-10-5 Shuttle) Benchmark", message: "Pro agility shuttle setup, touch-and-turn pivot mechanics, crossover steps, and timed sprint runs." },
  { classNumber: 7, subject: "Depth Jumps & Reactive Elastic Stiffness", message: "18-inch box depth drops, minimizing ground contact time, rebound vertical jumps, and Achilles tendon stiffness." },
  { classNumber: 8, subject: "Medicine Ball Rotational Throws & Core Power", message: "Rotational scoop throws against solid wall, transverse plane force transmission, and anti-flexion bracing." },
  { classNumber: 9, subject: "Agility Ladder Footwork & Coordination", message: "Ickey shuffle, in-out fast feet, reactive tennis ball drops, and spatial awareness under fatigue." },
  { classNumber: 10, subject: "Sled Pushes & Resisted Sprint Acceleration", message: "Heavy prowler sled push sprints, overcoming static inertia, leg drive turnover, and anaerobic power output." },
  { classNumber: 11, subject: "Joint Restoration, Ankle Mobility & Soft Tissue", message: "Calf and Achilles fascial release, band-assisted ankle mobilization, hamstring stretches, and mobility." },
  { classNumber: 12, subject: "Athletic Combine Benchmark & Graduation", message: "Official 10m sprint, vertical jump measurement, pro agility shuttle scores, and athletic graduation awards." },
];

export const BATCH_5_CURRICULUM = [
  { classNumber: 1, subject: "Metabolic Conditioning Baseline & Pacing Test", message: "500m rowing sprint benchmark, breathing rhythm, lactate threshold awareness, and heart rate recovery rate." },
  { classNumber: 2, subject: "Kettlebell Swing Mechanics & Hip Snap", message: "Russian vs American kettlebell swings, posterior hinge snap, avoiding shoulder elevation, and continuous rhythm." },
  { classNumber: 3, subject: "Tactical Sandbag Carries & Core Endurance", message: "Front bear-hug sandbag carries, shoulder carries, pacing under heavy unstable load, and grip endurance." },
  { classNumber: 4, subject: "EMOM Aerobic Conditioning (SkiErg & Burpees)", message: "16-minute Every Minute on the Minute (EMOM): alternating SkiErg calories with chest-to-floor burpees." },
  { classNumber: 5, subject: "Kettlebell Clean & Push Press Density", message: "Double kettlebell cleans, rack hold breathing, push press dip-drive, and building upper-body stamina." },
  { classNumber: 6, subject: "Assault Bike Sprint Ladders & Mental Resilience", message: "10-20-30 second calorie sprint ladders on Assault AirBike with active recovery intervals." },
  { classNumber: 7, subject: "Battle Rope Waves & Rotational Slams", message: "Alternating waves, double slams, lateral wave lunges, and sustained upper extremity anaerobic capacity." },
  { classNumber: 8, subject: "Farmer Walk Grip Gauntlet & Trap Stamina", message: "Heavy trap bar farmer walks for distance, suitcase carries, dead hangs from pullup bar, and pinch grip hold." },
  { classNumber: 9, subject: "Cross-Training AMRAP Circuit (Chippers)", message: "20-minute As Many Rounds As Possible: wall balls, kettlebell snatches, box jump-overs, and rowing." },
  { classNumber: 10, subject: "Tactical Obstacle Course & Work Capacity", message: "Heavy tire flips, sled drags, sandbag clean-over-shoulder, and continuous pacing under metabolic fatigue." },
  { classNumber: 11, subject: "Diaphragmatic Recovery & Heat Regulation", message: "Parasympathetic recovery drills, controlled nasal breathing, hip opener flows, and spinal mobility." },
  { classNumber: 12, subject: "Grand Metabolic Gauntlet & Cycle Certification", message: "The ultimate 12-minute work capacity test, milestone badges, performance score recording, and celebration." },
];

export const BATCH_6_CURRICULUM = [
  { classNumber: 1, subject: "Postural Decompression & Evening Warmup Flow", message: "Reversing desk posture, thoracic extension with foam rollers, glute activation, and evening joint prep." },
  { classNumber: 2, subject: "Lower Body Bilateral Power & Trap Bar Deadlifts", message: "Trap bar high handle deadlifts, vertical torso alignment, quadriceps and glute drive, and sub-maximal loading." },
  { classNumber: 3, subject: "Upper Body Posterior Chain & Face Pull Dynamics", message: "Banded and cable face pulls, chest-supported dumbbell rows, external shoulder rotation, and posture building." },
  { classNumber: 4, subject: "Core Bracing & Anti-Extension Stability", message: "Ab wheel rollouts, dead bugs with kettlebell counterbalance, hollow body holds, and lumbar protection." },
  { classNumber: 5, subject: "Kettlebell Snatch Progressions & Hip Snap", message: "Single-arm kettlebell high pulls to snatches, punch-through at lockout, and explosive posterior hip snap." },
  { classNumber: 6, subject: "Evening Metabolic Density & Controlled Pace", message: "Dumbbell thrusters, rowing steady-state intervals, jump rope double-unders, and aerobic tempo maintenance." },
  { classNumber: 7, subject: "Unilateral Strength & Step-Up Overload", message: "High box dumbbell step-ups, single-leg calf raises, balance stability under fatigue, and hip stabilizer work." },
  { classNumber: 8, subject: "Overhead Dumbbell Push Press & Core Lockout", message: "Neutral-grip dumbbell overhead pressing, slight leg dip, strict overhead finish, and tricep pushdown burnout." },
  { classNumber: 9, subject: "Loaded Heavy Carries & Evening Grit", message: "Dual dumbbell farmer walks, zercher barbell carry, core anti-lateral flexion, and forearm grip stamina." },
  { classNumber: 10, subject: "Full-Body Functional Strength Circuit", message: "Kettlebell renegade rows, pushups, goblet squats, and sled pushes for total-body athletic durability." },
  { classNumber: 11, subject: "Fascial Release & Parasympathetic Sleep Prep", message: "Deep tissue release, hamstring contract-relax stretching, guided down-regulation breathing for restful sleep." },
  { classNumber: 12, subject: "Final Durability Assessment & Milestone PRs", message: "Functional movement re-test, strength benchmark verification, awards presentation, and graduation toast." },
];

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

