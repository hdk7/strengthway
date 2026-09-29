/**
 * Application Storage Keys Configuration
 *
 * Centralizes all localStorage / persistence keys.
 * Storage keys are defined exclusively via environment variables (.env).
 */

export const STORAGE_KEYS = Object.freeze({
  THEME: import.meta.env.VITE_STORAGE_KEY_THEME,
  AUTH_TOKEN: import.meta.env.VITE_STORAGE_KEY_AUTH_TOKEN,
  AUTH_USER: import.meta.env.VITE_STORAGE_KEY_AUTH_USER,
  INQUIRIES: import.meta.env.VITE_STORAGE_KEY_INQUIRIES,
  TRAINERS: import.meta.env.VITE_STORAGE_KEY_TRAINERS,
  MEMBERS: import.meta.env.VITE_STORAGE_KEY_MEMBERS,
  BATCHES: import.meta.env.VITE_STORAGE_KEY_BATCHES,
  COACH_SHIFTS: import.meta.env.VITE_STORAGE_KEY_COACH_SHIFTS,
  SCHEDULED_CLASSES: import.meta.env.VITE_STORAGE_KEY_SCHEDULED_CLASSES,
  MASTER_SCHEDULES: import.meta.env.VITE_STORAGE_KEY_MASTER_SCHEDULES,
  MASTER_ITEMS: import.meta.env.VITE_STORAGE_KEY_MASTER_ITEMS,
  SESSIONS: import.meta.env.VITE_STORAGE_KEY_SESSIONS,
  HOLIDAYS: import.meta.env.VITE_STORAGE_KEY_HOLIDAYS,
  CURRICULUM_VERSION: import.meta.env.VITE_STORAGE_KEY_CURRICULUM_VERSION,
  MEMBERSHIP_PLANS: import.meta.env.VITE_STORAGE_KEY_MEMBERSHIP_PLANS,
});

export default STORAGE_KEYS;

