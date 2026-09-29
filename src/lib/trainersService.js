/* eslint-disable max-lines */
import trainer3 from "@/assets/trainer-3.webp";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";
import trainer2 from "@/assets/trainer-2.jpg";
import portfolioPhoto1 from "@/assets/portfolio-photo-1.jpg";
import portfolioPhoto2 from "@/assets/portfolio-photo-2.jpg";
import portfolioPhoto5 from "@/assets/portfolio-photo-5.jpg";
import { STORAGE_KEYS } from "@/config/storageKeys";

export const TRAINER_PHOTOS = {
  "TRN-101": trainer3,
  "TRN-102": portfolioPhoto3,
  "TRN-103": trainer2,
  "TRN-104": portfolioPhoto1,
  "TRN-105": portfolioPhoto2,
  "TRN-106": portfolioPhoto5,
};

export const SEED_TRAINERS = [
  {
    id: "TRN-101",
    name: "Dolliee Ellens",
    gender: "Female",
    experience: "5 Years",
    phone: "+91 98200 11223",
    email: "dolliee.ellens@strengthway.com",
    shift: "Morning (06:00 - 14:00)",
    status: "Active",
    bio: "Certified CrossFit Level 2 trainer specializing in high-intensity functional movements, endurance, and mobility optimization. Committed to helping athletes move pain-free with maximum power.",
    photo: trainer3,
    certifications: [
      "CrossFit Level 2 Coach",
      "CSCS Specialist",
      "ACE Certified Personal Trainer",
      "Functional Movement Screen (FMS)",
    ],
    quote:
      "Consistency beats intensity every single day. Build the habits, and the results become inevitable.",
    programs: [
      "Functional Strength",
      "Animal Flow & Mobility",
      "Athletic Conditioning",
      "Kettlebell Mastery",
    ],
    stats: {
      clients: "250+",
      successRate: "98%",
      hours: "1,400+",
    },
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-102",
    name: "Ashwin Kumar",
    gender: "Male",
    experience: "7 Years",
    phone: "+91 98450 33445",
    email: "ashwin.kumar@strengthway.com",
    shift: "Evening (14:00 - 22:00)",
    status: "Active",
    bio: "CSCS certified strength and conditioning specialist. Trains competitive powerlifters and athletes in barbell mechanics, progressive overload, and athletic speed-strength development.",
    photo: portfolioPhoto3,
    certifications: [
      "CSCS (Certified Strength & Conditioning Specialist)",
      "USA Weightlifting (USAW-1)",
      "ISSA Elite Master Trainer",
      "Precision Nutrition Level 1",
    ],
    quote:
      "True strength is built from precision, patience, and unwavering discipline under the bar.",
    programs: [
      "Barbell Strength & Power",
      "Olympic Lifting Mechanics",
      "Speed & Explosive Power",
      "Hypertrophy Foundations",
    ],
    stats: {
      clients: "380+",
      successRate: "99%",
      hours: "2,200+",
    },
    joinedAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-103",
    name: "Robert Creflo",
    gender: "Male",
    experience: "6 Years",
    phone: "+91 97110 55667",
    email: "robert.creflo@strengthway.com",
    shift: "General (08:00 - 17:00)",
    status: "Active",
    bio: "Focuses on biomechanics, muscle hypertrophy, and post-injury athletic rehabilitation with custom resistance periodization. Helps trainees rebuild joint resilience and sculpt symmetrical muscle.",
    photo: trainer2,
    certifications: [
      "NASM Corrective Exercise Specialist (CES)",
      "EXOS Performance Specialist",
      "Sports Physical Therapy Associate",
      "TRX Suspension Master Coach",
    ],
    quote:
      "Rebuilding strength requires respect for anatomy and relentless focus on flawless form.",
    programs: [
      "Corrective Exercise & Rehab",
      "Hypertrophy Periodization",
      "Joint Mobility & Spine Health",
      "Metabolic Conditioning",
    ],
    stats: {
      clients: "290+",
      successRate: "97%",
      hours: "1,800+",
    },
    joinedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-104",
    name: "Bharath V",
    gender: "Male",
    experience: "8 Years",
    phone: "+91 98860 77889",
    email: "bharath.v@strengthway.com",
    shift: "Evening (18:30 - 21:00)",
    status: "Active",
    bio: "National-level weightlifter and strength specialist. Focuses on explosive triple extension, barbell snatch and clean & jerk mechanics, and maximum athletic power output.",
    photo: portfolioPhoto1,
    certifications: [
      "USAW Level 2 Weightlifting Coach",
      "CSCS Specialist",
      "Kettlebell Athletics Specialist",
    ],
    quote: "Precision under tension turns potential into pure explosive power.",
    programs: [
      "Olympic Snatch & Clean",
      "Barbell Power Progression",
      "Explosive Athlete Conditioning",
    ],
    stats: {
      clients: "220+",
      successRate: "98%",
      hours: "1,600+",
    },
    joinedAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-105",
    name: "Rengaraj M",
    gender: "Male",
    experience: "6 Years",
    phone: "+91 98451 88990",
    email: "rengaraj.m@strengthway.com",
    shift: "Morning & Night (06:00 - 09:00 & 20:00 - 21:00)",
    status: "Active",
    bio: "Specializes in multi-directional agility, metabolic conditioning, and joint fascial decompression. Champions fluid functional movement without compromising raw strength.",
    photo: portfolioPhoto2,
    certifications: [
      "FMS (Functional Movement Screen)",
      "ACE Certified Personal Trainer",
      "Animal Flow Master Instructor",
    ],
    quote: "Move well before you move fast; build resilient foundations that last.",
    programs: [
      "Metabolic Conditioning",
      "Fascial Mobility & Movement",
      "TTS Athletic Conditioning",
    ],
    stats: {
      clients: "190+",
      successRate: "96%",
      hours: "1,250+",
    },
    joinedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-106",
    name: "F Coach",
    gender: "Female",
    experience: "7 Years",
    phone: "+91 98210 99001",
    email: "fcoach@strengthway.com",
    shift: "Dual Shift (06:00 - 09:00 & 18:30 - 21:00)",
    status: "Active",
    bio: "Floor Master Coach orchestrating high-intensity functional classes, barbell posture alignment, and tactical metabolic workouts across morning and evening shifts.",
    photo: portfolioPhoto5,
    certifications: ["CrossFit Level 2 Trainer", "ISSA Master Coach", "Precision Nutrition L2"],
    quote: "Discipline on the gym floor translates to unbreakable resilience in life.",
    programs: [
      "Master Class Floor Supervision",
      "Functional Strength Foundations",
      "Lactate Threshold Circuits",
    ],
    stats: {
      clients: "310+",
      successRate: "99%",
      hours: "2,100+",
    },
    joinedAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getTrainerPhoto(trainer) {
  if (!trainer) return null;
  if (trainer.photo) return trainer.photo;
  return TRAINER_PHOTOS[trainer.id] || null;
}

function cleanseTrainer(trainer) {
  if (!trainer || typeof trainer !== "object") return trainer;
  const { specialization, floorZone, languages, rating, reviewsCount, ...rest } = trainer;
  let stats = rest.stats;
  if (stats && typeof stats === "object") {
    const { rating: _r, ...statsRest } = stats;
    stats = statsRest;
  }
  return { ...rest, stats };
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAINERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRAINERS, JSON.stringify(SEED_TRAINERS));
      return [...SEED_TRAINERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingIds = new Set(parsed.map((t) => t.id));
      const missingSeeds = SEED_TRAINERS.filter((s) => !existingIds.has(s.id));
      const merged = [
        ...parsed.map((trainer) => {
          const cleaned = cleanseTrainer(trainer);
          const seed = SEED_TRAINERS.find((s) => s.id === cleaned.id);
          if (seed) {
            return {
              ...seed,
              ...cleaned,
              photo: cleaned.photo || seed.photo,
              certifications: cleaned.certifications || seed.certifications,
              stats: cleaned.stats || seed.stats,
              programs: cleaned.programs || seed.programs,
              quote: cleaned.quote || seed.quote,
              gender: cleaned.gender || seed.gender,
            };
          }
          return cleaned;
        }),
        ...missingSeeds,
      ];
      localStorage.setItem(STORAGE_KEYS.TRAINERS, JSON.stringify(merged));
      return merged;
    }
    localStorage.setItem(STORAGE_KEYS.TRAINERS, JSON.stringify(SEED_TRAINERS));
    return [...SEED_TRAINERS];
  } catch {
    return [...SEED_TRAINERS];
  }
}

function writeStorage(trainers) {
  try {
    const cleanedTrainers = Array.isArray(trainers) ? trainers.map(cleanseTrainer) : trainers;
    localStorage.setItem(STORAGE_KEYS.TRAINERS, JSON.stringify(cleanedTrainers));
  } catch {
    // ignore
  }
}

export function getTrainers() {
  return readStorage();
}

export function getTrainerById(id) {
  if (!id) return null;
  const all = readStorage();
  const cleanId = String(id).trim().toLowerCase();
  return (
    all.find(
      (t) =>
        t.id?.toLowerCase() === cleanId ||
        t.name?.toLowerCase().replace(/\s+/g, "-") === cleanId ||
        t.name?.toLowerCase() === cleanId,
    ) || null
  );
}

export function createTrainer(data) {
  const all = readStorage();
  const rawTrainer = {
    id: data.id || `TRN-${Date.now().toString().slice(-3)}`,
    name: data.name || "",
    gender: data.gender || "Male",
    experience: data.experience || "1 Year",
    phone: data.phone || "",
    email: data.email || "",
    shift: data.shift || "Morning (06:00 - 14:00)",
    status: data.status || "Active",
    quote: data.quote || "",
    programs: Array.isArray(data.programs)
      ? data.programs
      : data.programs
        ? data.programs
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["Functional Strength", "Athletic Conditioning"],
    bio: data.bio || "",
    photo: data.photo || null,
    joinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const newTrainer = cleanseTrainer(rawTrainer);
  const updated = [newTrainer, ...all];
  writeStorage(updated);
  return newTrainer;
}

export function updateTrainer(id, updates) {
  const all = readStorage();
  let updatedTrainer = null;
  const updated = all.map((t) => {
    if (t.id === id) {
      const formattedUpdates = { ...updates };
      delete formattedUpdates.specialization;
      delete formattedUpdates.floorZone;
      delete formattedUpdates.languages;
      delete formattedUpdates.rating;
      delete formattedUpdates.reviewsCount;
      if (typeof formattedUpdates.programs === "string") {
        formattedUpdates.programs = formattedUpdates.programs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      updatedTrainer = cleanseTrainer({
        ...t,
        ...formattedUpdates,
        updatedAt: new Date().toISOString(),
      });
      return updatedTrainer;
    }
    return t;
  });
  writeStorage(updated);
  return updatedTrainer;
}

export function deleteTrainer(id) {
  const all = readStorage();
  const updated = all.filter((t) => t.id !== id);
  writeStorage(updated);
  return true;
}

export function toggleTrainerStatus(id) {
  const all = readStorage();
  let toggled = null;
  const updated = all.map((t) => {
    if (t.id === id) {
      const nextStatus = t.status === "Active" ? "Inactive" : "Active";
      toggled = { ...t, status: nextStatus, updatedAt: new Date().toISOString() };
      return toggled;
    }
    return t;
  });
  writeStorage(updated);
  return toggled;
}
