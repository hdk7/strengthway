/**
 * Class Interchange Validation Utilities
 * =====================================
 * Pure validation functions to ensure only uncompleted, upcoming classes
 * appear in the Interchange Class Schedule modal and are permitted to be swapped.
 */

export const APP_TIMEZONE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_TIMEZONE) ||
  "Asia/Kolkata";

/**
 * Returns current date string (YYYY-MM-DD) and current time in minutes (0 - 1439)
 * for the configured application timezone.
 */
export function getAppDateTime(timeZone = APP_TIMEZONE) {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || "";
    const year = getPart("year");
    const month = String(getPart("month")).padStart(2, "0");
    const day = String(getPart("day")).padStart(2, "0");
    let hour = parseInt(getPart("hour"), 10) || 0;
    if (hour === 24) hour = 0;
    const minute = parseInt(getPart("minute"), 10) || 0;

    return {
      dateStr: `${year}-${month}-${day}`,
      currentTimeMinutes: hour * 60 + minute,
      hour,
      minute,
      timeZone,
      timestamp: now.getTime(),
    };
  } catch {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = now.getHours();
    const minute = now.getMinutes();

    return {
      dateStr: `${year}-${month}-${day}`,
      currentTimeMinutes: hour * 60 + minute,
      hour,
      minute,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local",
      timestamp: now.getTime(),
    };
  }
}

/**
 * Parses time string (e.g. "06:00 AM", "6.30 PM", "18:00", "07:00 AM (Morning)") into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  // Remove parenthesized annotations like "(Morning)" or "(IST)"
  const cleaned = timeStr.replace(/\([^)]*\)/g, "").trim().replace(/\./g, ":");

  // 12-hour: 6:00 AM, 06:30 PM, 6 AM
  const match12 = cleaned.match(/(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AaPp][Mm])/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 24-hour: 18:30, 06:00, 06:00:00
  const match24 = cleaned.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Resolves start and end time in minutes for a session, checking session fields
 * and falling back to batch timing.
 */
export function getSessionTimingMinutes(session, batch) {
  let startStr = session?.startTime;
  let endStr = session?.endTime;

  if ((!startStr || !endStr) && session?.timing) {
    const parts = session.timing.split(/[-–—]/);
    if (!startStr && parts[0]) startStr = parts[0].trim();
    if (!endStr && parts[1]) endStr = parts[1].trim();
  }

  if ((!startStr || !endStr) && batch?.timingLabel) {
    const parts = batch.timingLabel.split(/[-–—]/);
    if (!startStr && parts[0]) startStr = parts[0].trim();
    if (!endStr && parts[1]) endStr = parts[1].trim();
  }

  if (!startStr && batch?.startTime) startStr = batch.startTime;
  if (!endStr && batch?.endTime) endStr = batch.endTime;

  const startMinutes = parseTimeToMinutes(startStr);
  let endMinutes = parseTimeToMinutes(endStr);

  // If start is known but end cannot be parsed, default to 60-minute duration
  if (startMinutes !== null && endMinutes === null) {
    endMinutes = startMinutes + 60;
  }

  // If end is less than start (e.g. overnight), wrap around
  if (startMinutes !== null && endMinutes !== null && endMinutes < startMinutes) {
    endMinutes += 1440;
  }

  return { startMinutes, endMinutes, startStr, endStr };
}

/**
 * Evaluates whether a session is eligible for class schedule interchange.
 *
 * Rules:
 * 1. Must not have status COMPLETED or CANCELLED.
 * 2. Must not be currently in progress (via status IN_PROGRESS or current time between start & end time).
 * 3. Must not have recorded attendance (attendedCount > 0).
 * 4. Must not be scheduled on a past date.
 * 5. If scheduled for today, its scheduled end time must not have passed, and it must not be in progress.
 * 6. Future dates are eligible.
 */
export function getSessionInterchangeEligibility(session, batch, appDateTime = getAppDateTime()) {
  if (!session) {
    return { eligible: false, reason: "No session selected" };
  }

  // 1. Explicit status & attendance checks
  const status = String(session.status || "").toUpperCase();
  if (status === "COMPLETED") {
    return { eligible: false, reason: "Class has already been completed" };
  }
  if (status === "CANCELLED") {
    return { eligible: false, reason: "Class has been cancelled" };
  }
  if (status === "IN_PROGRESS") {
    return { eligible: false, reason: "Class is currently in progress" };
  }
  if (Number(session.attendedCount) > 0) {
    return { eligible: false, reason: "Class already has recorded attendance" };
  }

  // 2. Date checks against configured application timezone
  const rawDate = session.sessionDate;
  if (!rawDate) {
    return { eligible: false, reason: "Missing scheduled session date" };
  }
  const sessionDate = String(rawDate).slice(0, 10);
  const todayStr = appDateTime.dateStr;

  if (sessionDate < todayStr) {
    return { eligible: false, reason: `Scheduled date (${sessionDate}) has already passed` };
  }

  if (sessionDate > todayStr) {
    return { eligible: true, status: "UPCOMING_FUTURE" };
  }

  // 3. Today's date: check actual scheduled start and end times against current time
  const { startMinutes, endMinutes, startStr, endStr } = getSessionTimingMinutes(session, batch);
  const currentMinutes = appDateTime.currentTimeMinutes;

  if (startMinutes !== null && endMinutes !== null) {
    // If end time has already passed today -> completed
    if (currentMinutes >= endMinutes) {
      return {
        eligible: false,
        reason: `Class ended today at ${endStr || "scheduled time"}`,
        status: "ENDED_TODAY",
      };
    }
    // If current time is between start and end time -> currently in progress
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return {
        eligible: false,
        reason: `Class is currently in progress (${startStr || ""} - ${endStr || ""})`.trim(),
        status: "IN_PROGRESS_TODAY",
      };
    }
    // If current time is before start time -> upcoming today
    if (currentMinutes < startMinutes) {
      return {
        eligible: true,
        status: "UPCOMING_TODAY",
      };
    }
  }

  // If start is known and current time is past start time
  if (startMinutes !== null && currentMinutes >= startMinutes) {
    return {
      eligible: false,
      reason: "Class start time has already arrived or passed today",
      status: "STARTED_TODAY",
    };
  }

  return { eligible: true, status: "UPCOMING_TODAY" };
}

export function isSessionEligibleForInterchange(session, batch, appDateTime = getAppDateTime()) {
  return getSessionInterchangeEligibility(session, batch, appDateTime).eligible;
}

export function filterInterchangeEligibleSessions(sessions = [], batch, appDateTime = getAppDateTime()) {
  return (sessions || []).filter((s) => isSessionEligibleForInterchange(s, batch, appDateTime));
}
