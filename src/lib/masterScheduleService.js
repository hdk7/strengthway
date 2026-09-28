/* eslint-disable max-lines */
import { getBatches } from "./batchesService";
import { STORAGE_KEYS } from "@/config/storageKeys";

export const STORAGE_KEY_MASTER_SCHEDULES = STORAGE_KEYS.MASTER_SCHEDULES;
export const STORAGE_KEY_MASTER_ITEMS = STORAGE_KEYS.MASTER_ITEMS;
export const STORAGE_KEY_SESSIONS = STORAGE_KEYS.SESSIONS;
export const STORAGE_KEY_HOLIDAYS = STORAGE_KEYS.HOLIDAYS;
export const STORAGE_KEY_CURRICULUM_VERSION = STORAGE_KEYS.CURRICULUM_VERSION;
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

// Dedicated Batch 1 Curriculum: Morning Functional Strength & Core Conditioning (06:00 AM - 07:00 AM MWF)
export const BATCH_1_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Movement Assessment & Baseline Mobility Screen",
    message:
      "Baseline movement screen, overhead squat assessment, thoracic spine mobility flows, and core activation protocols.",
  },
  {
    classNumber: 2,
    subject: "Lower Body Mechanics & Goblet Squat Depth",
    message:
      "Foot tripod pressure, knee tracking alignment, goblet squat depth standards, and eccentric tempo control under moderate load.",
  },
  {
    classNumber: 3,
    subject: "Horizontal Push/Pull & Scapular Stability",
    message:
      "Dumbbell bench press setups, chest-supported rows, serratus anterior activation, and rotator cuff stability protocols.",
  },
  {
    classNumber: 4,
    subject: "Hip Hinge Patterning & Romanian Deadlifts",
    message:
      "Posterior chain engagement, Romanian deadlift bar path, hamstring tension without lumbar flexion, and glute squeeze.",
  },
  {
    classNumber: 5,
    subject: "Unilateral Lunge Variations & Hip Stability",
    message:
      "Reverse lunges, split squat balance, pelvic leveling drills, and addressing side-to-side strength asymmetries.",
  },
  {
    classNumber: 6,
    subject: "Core Bracing & Anti-Rotational Protocols",
    message:
      "Intra-abdominal pressure bracing, Pallof presses, suitcase carries, and plank with reaching taps.",
  },
  {
    classNumber: 7,
    subject: "Barbell Back Squat Introduction & Walkout",
    message:
      "Barbell positioning across upper traps, rack safety pin heights, walkout cadence, and consistent depth calibration.",
  },
  {
    classNumber: 8,
    subject: "Overhead Pressing Mechanics & Shoulder Health",
    message:
      "Standing strict dumbbell overhead press, active core lockout, rib flare prevention, and rear deltoid accessory work.",
  },
  {
    classNumber: 9,
    subject: "Barbell Deadlift Setup & Tension Calibration",
    message:
      "Conventional deadlift setup, bar against shins, lat engagement to pack the bar, and explosive leg drive off the floor.",
  },
  {
    classNumber: 10,
    subject: "Compound Super-Set Density & Work Capacity",
    message:
      "Pairing barbell squats with inverted bodyweight rows for cardiovascular demand and time-under-tension overload.",
  },
  {
    classNumber: 11,
    subject: "Mobility Decompression & Fascial Recovery",
    message:
      "Active recovery flow, hip flexor release, latissimus dorsi foam rolling, and parasympathetic diaphragmatic breathing.",
  },
  {
    classNumber: 12,
    subject: "Strength Benchmark Testing & PR Validation",
    message:
      "3-rep working max assessment across squat and deadlift, movement milestone celebration, and individual progression reviews.",
  },
];

// Dedicated Batch 2 Curriculum: Hypertrophy & Barbell Fundamentals (08:00 AM - 09:00 AM MWF)
export const BATCH_2_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Hypertrophy Primer & Kinetic Chain Warmup",
    message:
      "Dynamic kinetic chain activation, motor unit recruitment drills, and establishing 3-second eccentric tempo baseline.",
  },
  {
    classNumber: 2,
    subject: "Quad Hypertrophy & Front Squat Mechanics",
    message:
      "Front rack positioning, clean grip vs crossed arm setups, quad isolation, and high-volume goblet squat dropsets.",
  },
  {
    classNumber: 3,
    subject: "Pectoral Hypertrophy & Incline Dumbbell Press",
    message:
      "Incline dumbbell bench pressing, 45-degree angle path, chest contraction squeeze at apex, and cable chest flyes.",
  },
  {
    classNumber: 4,
    subject: "Hamstring Hypertrophy & Stiff-Leg Deadlifts",
    message:
      "Stiff-leg barbell deadlifts, hamstring stretch under load, seated leg curl control, and glute-ham tie-in development.",
  },
  {
    classNumber: 5,
    subject: "Back Thickness & Barbell Bent-Over Rows",
    message:
      "Pendlay rows, lat pull-down squeeze techniques, scapular depression, and mid-trap hypertrophy volume.",
  },
  {
    classNumber: 6,
    subject: "Deltoid Sculpting & Lateral Raise Mechanics",
    message:
      "Dumbbell lateral raise form, overhead push press, upright row variations, and rear deltoid fly volume.",
  },
  {
    classNumber: 7,
    subject: "Arm Hypertrophy Superset Specialization",
    message:
      "Bicep barbell curls paired with tricep skull crushers, pump volume protocols, and forearm grip endurance.",
  },
  {
    classNumber: 8,
    subject: "Bulgarian Split Squat & Glute Focus",
    message:
      "Rear foot elevated split squats, forward torso lean for glute recruitment, and walking lunges with dumbbells.",
  },
  {
    classNumber: 9,
    subject: "Close-Grip Bench Press & Tricep Overload",
    message:
      "Close-grip barbell pressing for triceps and inner chest, dip progressions, and diamond pushup volume.",
  },
  {
    classNumber: 10,
    subject: "Metabolic Hypertrophy Circuit (Giant Sets)",
    message:
      "4-station non-stop giant sets for maximum metabolic fatigue, glycogen depletion, and vascular pump.",
  },
  {
    classNumber: 11,
    subject: "Fascial Stretch Therapy & Muscle Recovery",
    message:
      "Inter-muscular fascial stretching, soft tissue lacrosse ball release on traps and pecs, and recovery hydration.",
  },
  {
    classNumber: 12,
    subject: "Hypertrophy Volume Assessment & PR Pump",
    message:
      "8-rep max benchmark challenges on primary lifts, body composition milestone tracking, and certificate awards.",
  },
];

// Dedicated Batch 3 Curriculum: Evening Prime Strength & Olympic Lifting (06:30 PM - 07:30 PM MWF)
export const BATCH_3_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Olympic Movement Screen & Ankle/Wrist Mobility",
    message:
      "Front rack wrist mobility, ankle dorsiflexion screening, PVC pipe snatch balance drills, and thoracic extension.",
  },
  {
    classNumber: 2,
    subject: "Hang Power Clean Mechanics & Elbow Speed",
    message:
      "Triple extension from hang position, aggressive hip pop, rapid elbow turnover, and stable front rack catch.",
  },
  {
    classNumber: 3,
    subject: "Heavy Barbell Back Squat & Core Stability",
    message:
      "Low bar vs high bar back squats, breathing into weight belt, driving out of the hole, and heavy 5x5 protocols.",
  },
  {
    classNumber: 4,
    subject: "Snatch High Pull & Hip Contact Drills",
    message:
      "Snatch grip width measurement, brushing the hip crease, explosive vertical jump shrug, and bar path tracking.",
  },
  {
    classNumber: 5,
    subject: "Push Press & Split Jerk Footwork Dynamics",
    message:
      "Dip and drive mechanics, vertical torso alignment, split footwork chalk drill, and catching with locked elbows.",
  },
  {
    classNumber: 6,
    subject: "Deadlift Velocity & Deficit Pull Power",
    message:
      "1-inch deficit deadlifts, building explosive starting speed off floor, and heavy trap bar pulls for neural drive.",
  },
  {
    classNumber: 7,
    subject: "Full Power Clean & Front Squat Complex",
    message:
      "Transitioning from power clean into full squat clean, catching in deep squat, and standing tall with composure.",
  },
  {
    classNumber: 8,
    subject: "Overhead Squat Balance & Core Bracing",
    message:
      "Wide grip overhead squats, active shoulder push into the bar, maintaining balance over mid-foot, and bailout safety.",
  },
  {
    classNumber: 9,
    subject: "Clean and Jerk Combination Execution",
    message:
      "Putting clean and jerk together, pacing between clean and dip-drive, mental focus under heavy barbell loads.",
  },
  {
    classNumber: 10,
    subject: "Olympic Barbell Complex & High Power Output",
    message:
      "1 Clean + 1 Hang Clean + 1 Front Squat + 1 Jerk unbroken complexes for peak power endurance.",
  },
  {
    classNumber: 11,
    subject: "Spinal Decompression & Barbell Deload Flow",
    message:
      "Hanging bar decompressions, hip capsule mobilization with monster bands, and central nervous system recovery.",
  },
  {
    classNumber: 12,
    subject: "Olympic Lifting Max Testing & PR Celebration",
    message:
      "Testing 1RM/3RM Clean & Jerk and Snatch benchmarks, technical video analysis review, and ceremony.",
  },
];
export const BATCH_3_SEPTEMBER_CURRICULUM = BATCH_3_CURRICULUM;

// Dedicated Batch 4 Curriculum: Early Athletic Speed, Agility & Plyometrics (06:00 AM - 07:00 AM TTS)
export const BATCH_4_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Athletic Movement Screen & Dynamic Primer",
    message:
      "Linear dynamic warmup, A-skips, B-skips, ankle stiffness drills, and multi-planar joint preparation.",
  },
  {
    classNumber: 2,
    subject: "Linear Acceleration & 10m Sprint Starts",
    message:
      "45-degree forward lean posture, positive shin angles, explosive first three steps, and wall acceleration drills.",
  },
  {
    classNumber: 3,
    subject: "Multi-Directional Agility & Lateral Shuffle",
    message:
      "Lateral bounding, low center of gravity shuffles, cone drill reactions, and knee stabilization cues.",
  },
  {
    classNumber: 4,
    subject: "Deceleration Mechanics & Landing Control",
    message:
      "Bilateral stick-and-land mechanics, shock absorption through ankles/knees/hips, and preventing valgus collapse.",
  },
  {
    classNumber: 5,
    subject: "Box Jumps & Explosive Vertical Power",
    message:
      "Step-down plyometric box jumps, triple extension power, seated explosive jumps, and landing soft on balls of feet.",
  },
  {
    classNumber: 6,
    subject: "Pro Agility (5-10-5 Shuttle) Benchmark",
    message:
      "Pro agility shuttle setup, touch-and-turn pivot mechanics, crossover steps, and timed sprint runs.",
  },
  {
    classNumber: 7,
    subject: "Depth Jumps & Reactive Elastic Stiffness",
    message:
      "18-inch box depth drops, minimizing ground contact time, rebound vertical jumps, and Achilles tendon stiffness.",
  },
  {
    classNumber: 8,
    subject: "Medicine Ball Rotational Throws & Core Power",
    message:
      "Rotational scoop throws against solid wall, transverse plane force transmission, and anti-flexion bracing.",
  },
  {
    classNumber: 9,
    subject: "Agility Ladder Footwork & Coordination",
    message:
      "Ickey shuffle, in-out fast feet, reactive tennis ball drops, and spatial awareness under fatigue.",
  },
  {
    classNumber: 10,
    subject: "Sled Pushes & Resisted Sprint Acceleration",
    message:
      "Heavy prowler sled push sprints, overcoming static inertia, leg drive turnover, and anaerobic power output.",
  },
  {
    classNumber: 11,
    subject: "Joint Restoration, Ankle Mobility & Soft Tissue",
    message:
      "Calf and Achilles fascial release, band-assisted ankle mobilization, hamstring stretches, and mobility.",
  },
  {
    classNumber: 12,
    subject: "Athletic Combine Benchmark & Graduation",
    message:
      "Official 10m sprint, vertical jump measurement, pro agility shuttle scores, and athletic graduation awards.",
  },
];

// Dedicated Batch 5 Curriculum: Tactical Conditioning & Metabolic Stamina (08:00 AM - 09:00 AM TTS)
export const BATCH_5_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Metabolic Conditioning Baseline & Pacing Test",
    message:
      "500m rowing sprint benchmark, breathing rhythm, lactate threshold awareness, and heart rate recovery rate.",
  },
  {
    classNumber: 2,
    subject: "Kettlebell Swing Mechanics & Hip Snap",
    message:
      "Russian vs American kettlebell swings, posterior hinge snap, avoiding shoulder elevation, and continuous rhythm.",
  },
  {
    classNumber: 3,
    subject: "Tactical Sandbag Carries & Core Endurance",
    message:
      "Front bear-hug sandbag carries, shoulder carries, pacing under heavy unstable load, and grip endurance.",
  },
  {
    classNumber: 4,
    subject: "EMOM Aerobic Conditioning (SkiErg & Burpees)",
    message:
      "16-minute Every Minute on the Minute (EMOM): alternating SkiErg calories with chest-to-floor burpees.",
  },
  {
    classNumber: 5,
    subject: "Kettlebell Clean & Push Press Density",
    message:
      "Double kettlebell cleans, rack hold breathing, push press dip-drive, and building upper-body stamina.",
  },
  {
    classNumber: 6,
    subject: "Assault Bike Sprint Ladders & Mental Resilience",
    message:
      "10-20-30 second calorie sprint ladders on Assault AirBike with active recovery intervals.",
  },
  {
    classNumber: 7,
    subject: "Battle Rope Waves & Rotational Slams",
    message:
      "Alternating waves, double slams, lateral wave lunges, and sustained upper extremity anaerobic capacity.",
  },
  {
    classNumber: 8,
    subject: "Farmer Walk Grip Gauntlet & Trap Stamina",
    message:
      "Heavy trap bar farmer walks for distance, suitcase carries, dead hangs from pullup bar, and pinch grip hold.",
  },
  {
    classNumber: 9,
    subject: "Cross-Training AMRAP Circuit (Chippers)",
    message:
      "20-minute As Many Rounds As Possible: wall balls, kettlebell snatches, box jump-overs, and rowing.",
  },
  {
    classNumber: 10,
    subject: "Tactical Obstacle Course & Work Capacity",
    message:
      "Heavy tire flips, sled drags, sandbag clean-over-shoulder, and continuous pacing under metabolic fatigue.",
  },
  {
    classNumber: 11,
    subject: "Diaphragmatic Recovery & Heat Regulation",
    message:
      "Parasympathetic recovery drills, controlled nasal breathing, hip opener flows, and spinal mobility.",
  },
  {
    classNumber: 12,
    subject: "Grand Metabolic Gauntlet & Cycle Certification",
    message:
      "The ultimate 12-minute work capacity test, milestone badges, performance score recording, and celebration.",
  },
];

// Dedicated Batch 6 Curriculum: Night Shift Power & Athletic Durability (08:00 PM - 09:00 PM MWF)
export const BATCH_6_CURRICULUM = [
  {
    classNumber: 1,
    subject: "Postural Decompression & Evening Warmup Flow",
    message:
      "Reversing desk posture, thoracic extension with foam rollers, glute activation, and evening joint prep.",
  },
  {
    classNumber: 2,
    subject: "Lower Body Bilateral Power & Trap Bar Deadlifts",
    message:
      "Trap bar high handle deadlifts, vertical torso alignment, quadriceps and glute drive, and sub-maximal loading.",
  },
  {
    classNumber: 3,
    subject: "Upper Body Posterior Chain & Face Pull Dynamics",
    message:
      "Banded and cable face pulls, chest-supported dumbbell rows, external shoulder rotation, and posture building.",
  },
  {
    classNumber: 4,
    subject: "Core Bracing & Anti-Extension Stability",
    message:
      "Ab wheel rollouts, dead bugs with kettlebell counterbalance, hollow body holds, and lumbar protection.",
  },
  {
    classNumber: 5,
    subject: "Kettlebell Snatch Progressions & Hip Snap",
    message:
      "Single-arm kettlebell high pulls to snatches, punch-through at lockout, and explosive posterior hip snap.",
  },
  {
    classNumber: 6,
    subject: "Evening Metabolic Density & Controlled Pace",
    message:
      "Dumbbell thrusters, rowing steady-state intervals, jump rope double-unders, and aerobic tempo maintenance.",
  },
  {
    classNumber: 7,
    subject: "Unilateral Strength & Step-Up Overload",
    message:
      "High box dumbbell step-ups, single-leg calf raises, balance stability under fatigue, and hip stabilizer work.",
  },
  {
    classNumber: 8,
    subject: "Overhead Dumbbell Push Press & Core Lockout",
    message:
      "Neutral-grip dumbbell overhead pressing, slight leg dip, strict overhead finish, and tricep pushdown burnout.",
  },
  {
    classNumber: 9,
    subject: "Loaded Heavy Carries & Evening Grit",
    message:
      "Dual dumbbell farmer walks, zercher barbell carry, core anti-lateral flexion, and forearm grip stamina.",
  },
  {
    classNumber: 10,
    subject: "Full-Body Functional Strength Circuit",
    message:
      "Kettlebell renegade rows, pushups, goblet squats, and sled pushes for total-body athletic durability.",
  },
  {
    classNumber: 11,
    subject: "Fascial Release & Parasympathetic Sleep Prep",
    message:
      "Deep tissue release, hamstring contract-relax stretching, guided down-regulation breathing for restful sleep.",
  },
  {
    classNumber: 12,
    subject: "Final Durability Assessment & Milestone PRs",
    message:
      "Functional movement re-test, strength benchmark verification, awards presentation, and graduation toast.",
  },
];

// Map of all batch-specific curricula
export const BATCH_CURRICULUMS = {
  "BATCH-01": BATCH_1_CURRICULUM,
  "BATCH-02": BATCH_2_CURRICULUM,
  "BATCH-03": BATCH_3_CURRICULUM,
  "BATCH-04": BATCH_4_CURRICULUM,
  "BATCH-05": BATCH_5_CURRICULUM,
  "BATCH-06": BATCH_6_CURRICULUM,
};

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
    description:
      "Festival of Lights & Deepavali. Morning open gym only; regular class batches suspended.",
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

// Resolve assigned batch objects with full metadata
export function resolveAssignedBatches(batchIds = []) {
  if (!Array.isArray(batchIds) || batchIds.length === 0) return [];
  const batches = getBatches();
  return batchIds.map((id) => batches.find((b) => b.id === id)).filter(Boolean);
}

// Resolve assigned batch names string (e.g. "BATCH 1 • BATCH 2")
export function resolveBatchNames(batchIds = []) {
  const list = resolveAssignedBatches(batchIds);
  if (list.length === 0) return "Reusable Template (Unassigned)";
  return list.map((b) => b.shortName || b.name || b.id).join(" • ");
}

// Generate Initial Mock Data for Master Scheduled Class Programs (Reusable Programs with Batch-Specific Curricula)
function createSeedMasterSchedules() {
  // 1. Batch 1 Program: Morning Functional Strength & Core Conditioning (Assigned to BATCH 1)
  const mcs1 = {
    id: "mcs_001",
    name: "12-Class Functional Strength & Core Conditioning",
    batchIds: ["BATCH-01"],
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
    startDate: "2026-08-31", // Aligned to Monday
    description:
      "Early morning foundational strength curriculum targeting movement assessment, bilateral squatting mechanics, posterior chain activation, core bracing, and progressive barbell overload.",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. Batch 2 Program: Hypertrophy & Barbell Fundamentals (Assigned to BATCH 2)
  const mcs2 = {
    id: "mcs_002",
    name: "12-Class Hypertrophy & Barbell Fundamentals",
    batchIds: ["BATCH-02"],
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
    startDate: "2026-08-31", // Aligned to Monday
    description:
      "Mid-morning hypertrophy and barbell mastery program designed to build lean muscle mass, strict movement tempo, and upper/lower body symmetry.",
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 3. Batch 3 Program: Prime Strength & Olympic Lifting (Assigned to BATCH 3)
  const mcs3 = {
    id: "mcs_003",
    name: "12-Class Prime Strength & Olympic Lifting",
    batchIds: ["BATCH-03"],
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
    startDate: "2026-08-31", // Aligned to Monday
    description:
      "High-intensity evening strength and Olympic lifting program focusing on power cleans, snatches, explosive triple extension, and maximum force generation.",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4. Batch 4 Program: Early Athletic Speed, Agility & Plyometrics (Assigned to BATCH 4)
  const mcs4 = {
    id: "mcs_004",
    name: "12-Class Athletic Speed, Agility & Plyometrics",
    batchIds: ["BATCH-04"],
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
    startDate: "2026-09-01", // Aligned to Tuesday
    description:
      "Early morning TTS athletic program focusing on sprint acceleration, multi-directional footwork, deceleration control, and reactive plyometric power.",
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 5. Batch 5 Program: Tactical Conditioning & Metabolic Stamina (Assigned to BATCH 5)
  const mcs5 = {
    id: "mcs_005",
    name: "12-Class Tactical Conditioning & Metabolic Stamina",
    batchIds: ["BATCH-05"],
    batchId: "BATCH-05",
    batchName: "BATCH 5",
    shift: "08:00 AM",
    timing: "08:00 AM - 09:00 AM",
    startTime: "08:00 AM",
    endTime: "09:00 AM",
    daysPattern: "TTS",
    daysLabel: "Tuesday • Thursday • Saturday",
    daysList: ["Tuesday", "Thursday", "Saturday"],
    coachId: "TRN-101",
    coachName: "Dolliee Ellens",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-09-01", // Aligned to Tuesday
    description:
      "TTS mid-morning endurance, high-density kettlebell complexes, tactical conditioning, and cardiovascular resilience for functional stamina.",
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 6. Batch 6 Program: Night Shift Power & Athletic Durability (Assigned to BATCH 6)
  const mcs6 = {
    id: "mcs_006",
    name: "12-Class Night Shift Power & Athletic Durability",
    batchIds: ["BATCH-06"],
    batchId: "BATCH-06",
    batchName: "BATCH 6",
    shift: "08:00 PM",
    timing: "08:00 PM - 09:00 PM",
    startTime: "08:00 PM",
    endTime: "09:00 PM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    coachId: "TRN-106",
    coachName: "F Coach",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-08-31", // Aligned to Monday
    description:
      "Late evening power, functional stamina, postural realignment, and athletic durability tailored for evening athletes and working professionals.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 7. Standalone Reusable Program Template (Unassigned, ready to assign to any batch)
  const mcs7 = {
    id: "mcs_007",
    name: "12-Class Functional Movement Essentials (Template)",
    batchIds: [],
    batchId: "",
    batchName: "Reusable Template (Unassigned)",
    shift: "06:00 AM",
    timing: "Flexible Shift",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    daysPattern: "MWF",
    daysLabel: "Monday • Wednesday • Friday",
    daysList: ["Monday", "Wednesday", "Friday"],
    coachId: "TRN-104",
    coachName: "Bharath V",
    totalClasses: 12,
    capacity: 28,
    status: "Active",
    startDate: "2026-10-05",
    description:
      "Modular movement prep, hinge, squat, pull, press, and mobility foundation program. Ready to assign to new batches or custom cycles.",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return [mcs1, mcs2, mcs3, mcs4, mcs5, mcs6, mcs7];
}

// Generate Items for a Master Schedule with Batch-Specific Curricula
function createItemsForSchedule(schedule, curriculum = null) {
  let activeCurriculum = curriculum;
  if (!activeCurriculum) {
    const assignedBatchId =
      Array.isArray(schedule.batchIds) && schedule.batchIds.length > 0
        ? schedule.batchIds[0]
        : schedule.batchId;

    if (assignedBatchId && BATCH_CURRICULUMS[assignedBatchId]) {
      activeCurriculum = BATCH_CURRICULUMS[assignedBatchId];
    } else if (schedule.id === "mcs_001") {
      activeCurriculum = BATCH_1_CURRICULUM;
    } else if (schedule.id === "mcs_002") {
      activeCurriculum = BATCH_2_CURRICULUM;
    } else if (schedule.id === "mcs_003") {
      activeCurriculum = BATCH_3_CURRICULUM;
    } else if (schedule.id === "mcs_004") {
      activeCurriculum = BATCH_4_CURRICULUM;
    } else if (schedule.id === "mcs_005") {
      activeCurriculum = BATCH_5_CURRICULUM;
    } else if (schedule.id === "mcs_006") {
      activeCurriculum = BATCH_6_CURRICULUM;
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

// Generate Sessions from Schedule and Items (supporting multiple batches with independent tracking)
export function generateSessionsForSchedule(schedule, items, targetBatchId = null) {
  const batches = getBatches();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let batchIdsToProcess = [];
  if (targetBatchId) {
    batchIdsToProcess = [targetBatchId];
  } else if (Array.isArray(schedule.batchIds) && schedule.batchIds.length > 0) {
    batchIdsToProcess = schedule.batchIds;
  } else if (schedule.batchId) {
    batchIdsToProcess = [schedule.batchId];
  }

  // If unassigned reusable template, no floor sessions generated yet
  if (batchIdsToProcess.length === 0) {
    return [];
  }

  const allGeneratedSessions = [];

  batchIdsToProcess.forEach((bId) => {
    const selectedBatch = batches.find((b) => b.id === bId) || {};
    const batchDays =
      selectedBatch.daysList && selectedBatch.daysList.length > 0
        ? selectedBatch.daysList
        : schedule.daysList && schedule.daysList.length > 0
          ? schedule.daysList
          : ["Monday", "Wednesday", "Friday"];

    const mapping = calculateSequentialMapping(
      batchDays,
      items.length || schedule.totalClasses || 12,
      schedule.startDate,
    );

    const batchName = selectedBatch.name || selectedBatch.shortName || bId;
    const startTime = selectedBatch.startTime || schedule.startTime || "06:00 AM";
    const endTime = selectedBatch.endTime || schedule.endTime || "07:00 AM";
    const timing =
      selectedBatch.timingLabel ||
      (selectedBatch.startTime && selectedBatch.endTime
        ? `${selectedBatch.startTime} - ${selectedBatch.endTime}`
        : `${startTime} - ${endTime}`);
    const capacity = selectedBatch.maxPax || schedule.capacity || 28;

    items.forEach((item, idx) => {
      const map = mapping[idx] || {};
      const dateStr = map.date || item.sessionDate || "";

      let sessionStatus = "SCHEDULED";
      if (dateStr) {
        if (dateStr < today && dateStr < todayLocal) {
          sessionStatus = "COMPLETED";
        } else if (dateStr === today || dateStr === todayLocal) {
          sessionStatus = "TODAY";
        }
      }

      allGeneratedSessions.push({
        id: `SES-${schedule.id}-${bId}-${String(item.classNumber).padStart(2, "0")}`,
        masterScheduleId: schedule.id,
        masterScheduleName: schedule.name,
        masterClassItemId: item.id,
        classNumber: item.classNumber,
        weekNumber: item.weekNumber || map.weekNumber || 1,
        dayOfWeek: map.dayOfWeek || item.dayOfWeek || "Monday",
        batchId: bId,
        batchName,
        coachId: selectedBatch.trainerIds?.[0] || schedule.coachId || "TRN-101",
        coachName: schedule.coachName || "Assigned Coach",
        sessionDate: dateStr,
        displayDate: map.displayDate || item.displayDate || "",
        startTime,
        endTime,
        timing,
        subject: item.subject,
        message: item.message,
        status: sessionStatus,
        notes: "",
        capacity,
        createdAt: new Date().toISOString(),
      });
    });
  });

  return allGeneratedSessions;
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

  // Version-based auto-migration to initialize batch-distinct curricula
  try {
    const currentVersion = localStorage.getItem(STORAGE_KEY_CURRICULUM_VERSION);
    if (currentVersion !== SEED_CURRICULUM_VERSION) {
      writeStorage(STORAGE_KEY_MASTER_SCHEDULES, seedSchedules);

      const allItems = [];
      const allSessions = [];
      seedSchedules.forEach((sch) => {
        const items = createItemsForSchedule(sch);
        allItems.push(...items);
        const sessions = generateSessionsForSchedule(sch, items);
        allSessions.push(...sessions);
      });

      writeStorage(STORAGE_KEY_MASTER_ITEMS, allItems);
      writeStorage(STORAGE_KEY_SESSIONS, allSessions);
      localStorage.setItem(STORAGE_KEY_CURRICULUM_VERSION, SEED_CURRICULUM_VERSION);
    }
  } catch (err) {
    console.error("Curriculum migration error:", err);
  }

  let schedules = readStorage(STORAGE_KEY_MASTER_SCHEDULES, seedSchedules);
  let needsSync = false;

  // Normalize all schedules to have batchIds array and resolved batchName
  schedules = schedules.map((s) => {
    let updated = { ...s };
    if (!Array.isArray(updated.batchIds)) {
      updated.batchIds = updated.batchId ? [updated.batchId] : [];
      needsSync = true;
    }
    if (!updated.batchId && updated.batchIds.length > 0) {
      updated.batchId = updated.batchIds[0];
      needsSync = true;
    }
    const currentResolvedName = resolveBatchNames(updated.batchIds);
    if (updated.batchName !== currentResolvedName && updated.batchIds.length > 0) {
      updated.batchName = currentResolvedName;
      needsSync = true;
    }
    return updated;
  });

  if (needsSync) {
    writeStorage(STORAGE_KEY_MASTER_SCHEDULES, schedules);
  }

  // Ensure curriculum items and batch sessions exist
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    let allItems = rawItems ? JSON.parse(rawItems) : [];
    if (!Array.isArray(allItems)) allItems = [];

    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    let allSessions = rawSessions ? JSON.parse(rawSessions) : [];
    if (!Array.isArray(allSessions)) allSessions = [];

    let itemsUpdated = false;
    let sessionsUpdated = false;

    schedules.forEach((sch) => {
      let scheduleItems = allItems.filter((i) => i.masterScheduleId === sch.id);
      if (scheduleItems.length === 0) {
        scheduleItems = createItemsForSchedule(sch);
        allItems = [...allItems, ...scheduleItems];
        itemsUpdated = true;
      }

      // Check sessions for each assigned batch
      const assignedBatches = Array.isArray(sch.batchIds)
        ? sch.batchIds
        : sch.batchId
          ? [sch.batchId]
          : [];

      assignedBatches.forEach((bId) => {
        const batchSessions = allSessions.filter(
          (s) => s.masterScheduleId === sch.id && s.batchId === bId,
        );
        if (batchSessions.length === 0) {
          const generated = generateSessionsForSchedule(sch, scheduleItems, bId);
          allSessions = [...allSessions, ...generated];
          sessionsUpdated = true;
        }
      });
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
  return (
    all.find(
      (s) => (Array.isArray(s.batchIds) && s.batchIds.includes(batchId)) || s.batchId === batchId,
    ) || null
  );
}

export function getMasterSchedulesByBatchId(batchId) {
  const all = getMasterSchedules();
  return all.filter(
    (s) => (Array.isArray(s.batchIds) && s.batchIds.includes(batchId)) || s.batchId === batchId,
  );
}

export function getScheduleItems(masterScheduleId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
    if (!raw) {
      getMasterSchedules();
      const updatedRaw = localStorage.getItem(STORAGE_KEY_MASTER_ITEMS);
      if (!updatedRaw) return [];
      const all = JSON.parse(updatedRaw);
      return Array.isArray(all) ? all.filter((i) => i.masterScheduleId === masterScheduleId) : [];
    }
    const all = JSON.parse(raw);
    let items = Array.isArray(all) ? all.filter((i) => i.masterScheduleId === masterScheduleId) : [];
    if (items.length === 0) {
      const schedule = getMasterScheduleById(masterScheduleId);
      if (schedule) {
        items = createItemsForSchedule(schedule);
        writeStorage(STORAGE_KEY_MASTER_ITEMS, [...all, ...items]);
      }
    }
    return items;
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

    // Also synchronize generated sessions for this class item across all batches
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

    // Generate sessions for all assigned batches
    const assignedBatches = Array.isArray(schedule.batchIds)
      ? schedule.batchIds
      : schedule.batchId
        ? [schedule.batchId]
        : [];
    if (assignedBatches.length > 0) {
      const generatedSessions = generateSessionsForSchedule(schedule, [newItem]);
      const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const allSessions = rawSessions ? JSON.parse(rawSessions) : [];
      writeStorage(STORAGE_KEY_SESSIONS, [...allSessions, ...generatedSessions]);
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

  const batches = getBatches();
  const batchIds = Array.isArray(data.batchIds)
    ? data.batchIds
    : data.batchId
      ? [data.batchId]
      : [];

  const firstBatch = batches.find((b) => b.id === batchIds[0]) || {};

  const daysList =
    data.daysList && data.daysList.length > 0
      ? data.daysList
      : firstBatch.daysList || ["Monday", "Wednesday", "Friday"];
  const daysLabel = data.daysLabel || firstBatch.daysLabel || daysList.join(" • ");
  const daysPattern = data.daysPattern || firstBatch.daysPattern || "MWF";

  const newSchedule = {
    id: newId,
    name: data.name || "New Scheduled Class Program",
    batchIds,
    batchId: batchIds[0] || "",
    batchName: resolveBatchNames(batchIds),
    shift: firstBatch.startTime || data.shift || "06:00 AM",
    startTime: firstBatch.startTime || data.startTime || "06:00 AM",
    endTime: firstBatch.endTime || data.endTime || "07:00 AM",
    timing: firstBatch.timingLabel || data.timing || "06:00 AM - 07:00 AM",
    daysPattern,
    daysLabel,
    daysList,
    coachId: data.coachId || "TRN-101",
    coachName: data.coachName || "Dolliee Ellens",
    totalClasses: 12,
    capacity: firstBatch.maxPax || data.capacity || 28,
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

  // Generate Sessions across all assigned batches
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

  let batchIds = current.batchIds || (current.batchId ? [current.batchId] : []);
  if (updates.batchIds !== undefined) {
    batchIds = Array.isArray(updates.batchIds) ? updates.batchIds : [];
  } else if (updates.batchId !== undefined) {
    batchIds = updates.batchId ? [updates.batchId] : [];
  }

  const firstBatch = batches.find((b) => b.id === batchIds[0]) || {};
  const daysList = updates.daysList || current.daysList || firstBatch.daysList;
  const startDate = updates.startDate || current.startDate;
  const totalClasses =
    itemsData && itemsData.length > 0
      ? itemsData.length
      : updates.totalClasses || current.totalClasses || 12;

  const updatedSchedule = {
    ...current,
    ...updates,
    batchIds,
    batchId: batchIds[0] || "",
    batchName: resolveBatchNames(batchIds),
    totalClasses,
    daysList,
    daysPattern: updates.daysPattern || current.daysPattern || firstBatch.daysPattern || "MWF",
    daysLabel:
      updates.daysLabel || current.daysLabel || firstBatch.daysLabel || daysList.join(" • "),
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
  } else {
    newItems = getScheduleItems(id);
  }

  // Regenerate Sessions for all assigned batches
  if (newItems.length > 0) {
    const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const existingSessions = rawSessions ? JSON.parse(rawSessions) : [];
    // Keep existing session statuses if already present
    const existingStatusMap = new Map();
    existingSessions.forEach((s) => {
      if (s.masterScheduleId === id) {
        existingStatusMap.set(`${s.batchId}_${s.classNumber}`, {
          status: s.status,
          notes: s.notes,
        });
      }
    });

    const newSessions = generateSessionsForSchedule(updatedSchedule, newItems).map((s) => {
      const key = `${s.batchId}_${s.classNumber}`;
      if (existingStatusMap.has(key)) {
        const prev = existingStatusMap.get(key);
        return { ...s, status: prev.status || s.status, notes: prev.notes || s.notes };
      }
      return s;
    });

    const otherSessions = existingSessions.filter((s) => s.masterScheduleId !== id);
    writeStorage(STORAGE_KEY_SESSIONS, [...newSessions, ...otherSessions]);
  }

  return updatedSchedule;
}

// Assign or unassign multiple batches to a scheduled class program
export function assignBatchesToProgram(programId, batchIds) {
  const schedules = getMasterSchedules();
  const schedule = schedules.find((s) => s.id === programId);
  if (!schedule) return null;

  const oldBatchIds = Array.isArray(schedule.batchIds)
    ? schedule.batchIds
    : schedule.batchId
      ? [schedule.batchId]
      : [];
  const cleanBatchIds = Array.isArray(batchIds) ? batchIds : [];

  schedule.batchIds = cleanBatchIds;
  schedule.batchId = cleanBatchIds[0] || "";
  schedule.batchName = resolveBatchNames(cleanBatchIds);
  schedule.updatedAt = new Date().toISOString();

  const addedBatches = cleanBatchIds.filter((bId) => !oldBatchIds.includes(bId));
  const removedBatches = oldBatchIds.filter((bId) => !cleanBatchIds.includes(bId));

  writeStorage(STORAGE_KEY_MASTER_SCHEDULES, schedules);

  const items = getScheduleItems(programId);
  const rawSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
  let allSessions = rawSessions ? JSON.parse(rawSessions) : [];

  // Remove sessions for batches that are no longer assigned
  if (removedBatches.length > 0) {
    allSessions = allSessions.filter(
      (s) => !(s.masterScheduleId === programId && removedBatches.includes(s.batchId)),
    );
  }

  // Generate sessions for newly added batches
  if (addedBatches.length > 0 && items.length > 0) {
    addedBatches.forEach((bId) => {
      const newBatchSessions = generateSessionsForSchedule(schedule, items, bId);
      allSessions = [...newBatchSessions, ...allSessions];
    });
  }

  writeStorage(STORAGE_KEY_SESSIONS, allSessions);
  return schedule;
}

// Return separate tracking metrics for each batch assigned to a program
export function getBatchTrackingSummary(programId) {
  const schedule = getMasterScheduleById(programId);
  if (!schedule) return [];

  const batches = getBatches();
  const allSessions = getSessions();
  const assignedBatchIds = Array.isArray(schedule.batchIds)
    ? schedule.batchIds
    : schedule.batchId
      ? [schedule.batchId]
      : [];

  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayUtc = now.toISOString().slice(0, 10);

  return assignedBatchIds.map((bId) => {
    const batchObj = batches.find((b) => b.id === bId) || { id: bId, name: bId };
    const batchSessions = allSessions
      .filter((s) => s.masterScheduleId === programId && s.batchId === bId)
      .sort((a, b) => a.classNumber - b.classNumber);

    let completed = 0;
    let today = 0;
    let scheduled = 0;
    let cancelled = 0;

    batchSessions.forEach((s) => {
      if (s.status === "CANCELLED") {
        cancelled++;
      } else if (s.status === "COMPLETED") {
        completed++;
      } else if (
        s.status === "TODAY" ||
        s.sessionDate === todayLocal ||
        s.sessionDate === todayUtc
      ) {
        today++;
      } else {
        scheduled++;
      }
    });

    const total = batchSessions.length || schedule.totalClasses || 12;
    const percentComplete = Math.min(100, Math.round((completed / (total || 1)) * 100));

    const nextSession =
      batchSessions.find((s) => s.status === "TODAY") ||
      batchSessions.find((s) => s.status === "SCHEDULED") ||
      null;

    return {
      batchId: bId,
      batchName: batchObj.name || batchObj.shortName || bId,
      startTime: batchObj.startTime || schedule.startTime || "06:00 AM",
      endTime: batchObj.endTime || schedule.endTime || "07:00 AM",
      timing:
        batchObj.timingLabel ||
        `${batchObj.startTime || "06:00 AM"} - ${batchObj.endTime || "07:00 AM"}`,
      daysPattern: batchObj.daysPattern || schedule.daysPattern || "MWF",
      daysLabel: batchObj.daysLabel || schedule.daysLabel || "Monday • Wednesday • Friday",
      currentPax: batchObj.currentPax || 0,
      maxPax: batchObj.maxPax || 28,
      totalSessions: total,
      completed,
      today,
      scheduled,
      cancelled,
      percentComplete,
      nextSession,
      sessions: batchSessions,
    };
  });
}

export function duplicateMasterSchedule(id) {
  const original = getMasterScheduleById(id);
  if (!original) return null;
  const originalItems = getScheduleItems(id);

  const duplicateData = {
    ...original,
    name: `${original.name} (Copy)`,
    batchIds: [], // Clone starts as unassigned reusable program
    batchId: "",
    batchName: "Reusable Template (Unassigned)",
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
    (h) => !h.name?.toLowerCase().includes("annual strength games"),
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
        seedName.includes(h.name?.toLowerCase().trim()),
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
      holidayData.description !== undefined ? holidayData.description : holidays[index].description,
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
