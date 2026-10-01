/**
 * Trainers Service — API Layer
 *
 * All business data is fetched from / persisted to the backend API.
 * No localStorage is used for trainers data.
 *
 * Backend base: /api/v1/trainers
 */

import { api } from "@/lib/apiClient";
import trainer3 from "@/assets/trainer-3.webp";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";
import trainer2 from "@/assets/trainer-2.jpg";
import portfolioPhoto1 from "@/assets/portfolio-photo-1.jpg";
import portfolioPhoto2 from "@/assets/portfolio-photo-2.jpg";
import portfolioPhoto5 from "@/assets/portfolio-photo-5.jpg";

export const TRAINER_PHOTOS = {
  "TRN-101": trainer3,
  "TRN-102": portfolioPhoto3,
  "TRN-103": trainer2,
  "TRN-104": portfolioPhoto1,
  "TRN-105": portfolioPhoto2,
  "TRN-106": portfolioPhoto5,
};

// Static seed reference retained for backwards compatibility with cross-entity helpers
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

/**
 * Resolve display photo for a trainer record.
 * Falls back to mapped static photo or null.
 */
export function getTrainerPhoto(trainer) {
  if (!trainer) return null;
  if (trainer.photo) return trainer.photo;
  return TRAINER_PHOTOS[trainer.id] || null;
}

// ── Read ───────────────────────────────────────────────────────────────────────

/**
 * Fetch all trainers.
 *
 * @param {boolean} includeDeleted  Include deactivated / soft-deleted trainers.
 * @returns {Promise<object[]>}
 */
export async function getTrainers(includeDeleted = false) {
  const params = new URLSearchParams({ pageSize: "5000" });
  if (includeDeleted) params.set("includeDeleted", "true");
  const result = await api.get(`/v1/trainers?${params}`);
  if (Array.isArray(result)) return result;
  if (result?.data && Array.isArray(result.data)) return result.data;
  return [];
}

/**
 * Fetch a single trainer by ID.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getTrainerById(id) {
  if (!id) return null;
  try {
    return await api.get(`/v1/trainers/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

// ── Write ──────────────────────────────────────────────────────────────────────

/**
 * Create a new trainer profile.
 *
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function createTrainer(data) {
  return api.post("/v1/trainers", data);
}

/**
 * Update an existing trainer profile.
 *
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateTrainer(id, updates) {
  return api.put(`/v1/trainers/${encodeURIComponent(id)}`, updates);
}

/**
 * Permanently delete a trainer record.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteTrainer(id) {
  await api.delete(`/v1/trainers/${encodeURIComponent(id)}`);
  return true;
}

/**
 * Deactivate / soft-delete a trainer.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function softDeleteTrainer(id) {
  return api.patch(`/v1/trainers/${encodeURIComponent(id)}/soft-delete`);
}

/**
 * Restore a deactivated trainer back to active status.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function restoreTrainer(id) {
  return api.patch(`/v1/trainers/${encodeURIComponent(id)}/restore`);
}

/**
 * Toggle a trainer's status between Active and Inactive.
 *
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function toggleTrainerStatus(id) {
  return api.patch(`/v1/trainers/${encodeURIComponent(id)}/toggle-status`);
}

/**
 * Sync batch assignments for a trainer.
 *
 * @param {string} id
 * @param {string[]} batchIds
 * @returns {Promise<object>}
 */
export async function syncTrainerBatches(id, batchIds) {
  return api.patch(`/v1/trainers/${encodeURIComponent(id)}/sync-batches`, { batchIds });
}

/**
 * Retrieves month-wise tracking for an individual trainer:
 * - Assigned batches
 * - Total classes scheduled vs conducted
 * - Total coaching hours and attendees coached
 * - Conduction history ledger
 *
 * @param {string} id Trainer ID
 * @param {string} [yearMonth] Format: YYYY-MM (defaults to current month)
 * @returns {Promise<object>}
 */
export async function getTrainerMonthTracking(id, yearMonth) {
  if (!id) return null;
  const ym = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)
    ? yearMonth
    : new Date().toISOString().slice(0, 7);
  return api.get(`/v1/trainers/${encodeURIComponent(id)}/month-tracking?month=${encodeURIComponent(ym)}`);
}

