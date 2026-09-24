/* eslint-disable max-lines */
import trainer3 from "@/assets/trainer-3.webp";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";
import trainer2 from "@/assets/trainer-2.jpg";

export const STORAGE_KEY = "tsw-trainers";

export const TRAINER_PHOTOS = {
  "TRN-101": trainer3,
  "TRN-102": portfolioPhoto3,
  "TRN-103": trainer2,
};

export const SEED_TRAINERS = [
  {
    id: "TRN-101",
    name: "Dolliee Ellens",
    gender: "Female",
    specialization: "Functional Fitness",
    experience: "5 Years",
    phone: "+91 98200 11223",
    email: "dolliee.ellens@strengthway.com",
    shift: "Morning (06:00 - 14:00)",
    status: "Active",
    bio: "Certified CrossFit Level 2 trainer specializing in high-intensity functional movements, endurance, and mobility optimization. Committed to helping athletes move pain-free with maximum power.",
    photo: trainer3,
    floorZone: "Ground Floor Turf & Rig Zone",
    certifications: [
      "CrossFit Level 2 Coach",
      "CSCS Specialist",
      "ACE Certified Personal Trainer",
      "Functional Movement Screen (FMS)",
    ],
    languages: ["English", "Hindi"],
    rating: 4.9,
    reviewsCount: 84,
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
      rating: "4.9",
    },
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-102",
    name: "Ashwin Kumar",
    gender: "Male",
    specialization: "Strength & Conditioning",
    experience: "7 Years",
    phone: "+91 98450 33445",
    email: "ashwin.kumar@strengthway.com",
    shift: "Evening (14:00 - 22:00)",
    status: "Active",
    bio: "CSCS certified strength and conditioning specialist. Trains competitive powerlifters and athletes in barbell mechanics, progressive overload, and athletic speed-strength development.",
    photo: portfolioPhoto3,
    floorZone: "Heavy Iron & Olympic Platforms",
    certifications: [
      "CSCS (Certified Strength & Conditioning Specialist)",
      "USA Weightlifting (USAW-1)",
      "ISSA Elite Master Trainer",
      "Precision Nutrition Level 1",
    ],
    languages: ["English", "Hindi", "Tamil"],
    rating: 4.95,
    reviewsCount: 112,
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
      rating: "5.0",
    },
    joinedAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "TRN-103",
    name: "Robert Creflo",
    gender: "Male",
    specialization: "Hypertrophy & Rehabilitation",
    experience: "6 Years",
    phone: "+91 97110 55667",
    email: "robert.creflo@strengthway.com",
    shift: "General (08:00 - 17:00)",
    status: "Active",
    bio: "Focuses on biomechanics, muscle hypertrophy, and post-injury athletic rehabilitation with custom resistance periodization. Helps trainees rebuild joint resilience and sculpt symmetrical muscle.",
    photo: trainer2,
    floorZone: "Resistance Machine & Rehab Studio",
    certifications: [
      "NASM Corrective Exercise Specialist (CES)",
      "EXOS Performance Specialist",
      "Sports Physical Therapy Associate",
      "TRX Suspension Master Coach",
    ],
    languages: ["English", "Hindi"],
    rating: 4.88,
    reviewsCount: 76,
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
      rating: "4.9",
    },
    joinedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getTrainerPhoto(trainer) {
  if (!trainer) return null;
  if (trainer.photo) return trainer.photo;
  return TRAINER_PHOTOS[trainer.id] || null;
}

const LEGACY_MOCK_TRAINER_IDS = ["TRN-104", "TRN-105", "TRN-106"];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRAINERS));
      return [...SEED_TRAINERS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = parsed.filter((t) => !LEGACY_MOCK_TRAINER_IDS.includes(t.id));
      const merged = sanitized.map((trainer) => {
        const seed = SEED_TRAINERS.find((s) => s.id === trainer.id);
        if (seed) {
          return {
            ...seed,
            ...trainer,
            photo: trainer.photo || seed.photo,
            certifications: trainer.certifications || seed.certifications,
            stats: trainer.stats || seed.stats,
            programs: trainer.programs || seed.programs,
            quote: trainer.quote || seed.quote,
            floorZone: trainer.floorZone || seed.floorZone,
            gender: trainer.gender || seed.gender,
          };
        }
        return trainer;
      });
      if (merged.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRAINERS));
    return [...SEED_TRAINERS];
  } catch {
    return [...SEED_TRAINERS];
  }
}

function writeStorage(trainers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trainers));
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
  const newTrainer = {
    id: data.id || `TRN-${Date.now().toString().slice(-3)}`,
    name: data.name || "",
    gender: data.gender || "Male",
    specialization: data.specialization || "General Fitness",
    experience: data.experience || "1 Year",
    phone: data.phone || "",
    email: data.email || "",
    shift: data.shift || "Morning (06:00 - 14:00)",
    status: data.status || "Active",
    quote: data.quote || "",
    floorZone: data.floorZone || "",
    programs: Array.isArray(data.programs)
      ? data.programs
      : data.programs
        ? data.programs
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["Functional Strength", "Athletic Conditioning"],
    languages: Array.isArray(data.languages)
      ? data.languages
      : data.languages
        ? data.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["English"],
    bio: data.bio || "",
    photo: data.photo || null,
    joinedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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
      if (typeof formattedUpdates.programs === "string") {
        formattedUpdates.programs = formattedUpdates.programs
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (typeof formattedUpdates.languages === "string") {
        formattedUpdates.languages = formattedUpdates.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      updatedTrainer = {
        ...t,
        ...formattedUpdates,
        updatedAt: new Date().toISOString(),
      };
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
