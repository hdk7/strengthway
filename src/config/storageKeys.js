/**
 * Application Storage Keys Configuration
 *
 * Centralizes all localStorage / persistence keys. Values are loaded from environment
 * variables (Vite env variables prefixed with VITE_) with reliable fallbacks to maintain
 * full backwards compatibility with existing browser data.
 */

export const STORAGE_KEYS = {
  THEME: import.meta.env.VITE_STORAGE_KEY_THEME || "theme",
  AUTH_TOKEN: import.meta.env.VITE_STORAGE_KEY_AUTH_TOKEN || "tsw-token",
  AUTH_USER: import.meta.env.VITE_STORAGE_KEY_AUTH_USER || "tsw-user",
  INQUIRIES: import.meta.env.VITE_STORAGE_KEY_INQUIRIES || "thestrengthway_inquiries_data_v1",
  TRAINERS: import.meta.env.VITE_STORAGE_KEY_TRAINERS || "tsw-trainers",
  MEMBERS: import.meta.env.VITE_STORAGE_KEY_MEMBERS || "tsw-registered-members",
  BATCHES: import.meta.env.VITE_STORAGE_KEY_BATCHES || "tsw-batches",
  COACH_SHIFTS: import.meta.env.VITE_STORAGE_KEY_COACH_SHIFTS || "tsw-coach-shifts",
  SCHEDULED_CLASSES: import.meta.env.VITE_STORAGE_KEY_SCHEDULED_CLASSES || "tsw-scheduled-classes",
  MASTER_SCHEDULES: import.meta.env.VITE_STORAGE_KEY_MASTER_SCHEDULES || "tsw-master-class-schedules",
  MASTER_ITEMS: import.meta.env.VITE_STORAGE_KEY_MASTER_ITEMS || "tsw-master-class-items",
  SESSIONS: import.meta.env.VITE_STORAGE_KEY_SESSIONS || "tsw-generated-sessions",
  HOLIDAYS: import.meta.env.VITE_STORAGE_KEY_HOLIDAYS || "tsw-holidays",
  CURRICULUM_VERSION: import.meta.env.VITE_STORAGE_KEY_CURRICULUM_VERSION || "tsw-curriculum-version",
  MEMBERSHIP_PLANS: import.meta.env.VITE_STORAGE_KEY_MEMBERSHIP_PLANS || "thestrengthway_membership_plans_v1",
};

export default STORAGE_KEYS;
