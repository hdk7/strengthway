"use strict";

/**
 * Parses any standard 12h or 24h time string into minutes since midnight.
 * e.g., "06:00 AM" -> 360, "02:00 PM" -> 840, "14:00" -> 840, "07:30" -> 450
 *
 * @param {string} timeStr
 * @returns {number|null}
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const clean = timeStr.trim().toUpperCase();

  // 12-hour format with AM/PM (e.g., "06:00 AM", "6:15 PM")
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3];
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours < 12) hours += 12;
    return hours * 60 + minutes;
  }

  // 24-hour format (e.g., "14:00", "06:30")
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Formats minutes from midnight to standard 12-hour AM/PM string.
 * e.g., 360 -> "06:00 AM", 840 -> "02:00 PM"
 *
 * @param {number} minutes
 * @returns {string}
 */
function formatMinutesToTime(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return "";
  let m = Math.floor(minutes) % (24 * 60);
  if (m < 0) m += 24 * 60;
  const hours24 = Math.floor(m / 60);
  const mins = m % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${meridiem}`;
}

/**
 * Calculates duration between two time strings in minutes.
 *
 * @param {string} startTimeStr
 * @param {string} endTimeStr
 * @returns {number}
 */
function calculateTimeDuration(startTimeStr, endTimeStr) {
  const inMin = parseTimeToMinutes(startTimeStr);
  const outMin = parseTimeToMinutes(endTimeStr);
  if (inMin === null || outMin === null) return 0;
  return Math.max(0, outMin - inMin);
}

/**
 * Calculates the duration (in minutes) an attendance interval overlapped with a scheduled class.
 * Excludes time outside the scheduled period from the teaching duration.
 *
 * Example:
 * Session scheduled: 6:00 AM (360) - 7:00 AM (420)
 * Presence: 5:55 AM (355) - 8:05 AM (485)
 * Overlap: max(355, 360) to min(485, 420) = 360 to 420 = 60 minutes.
 *
 * @param {number} inMin - Actual check-in minutes
 * @param {number} outMin - Actual check-out minutes
 * @param {number} schedStartMin - Scheduled session start minutes
 * @param {number} schedEndMin - Scheduled session end minutes
 * @returns {number}
 */
function calculateSessionOverlap(inMin, outMin, schedStartMin, schedEndMin) {
  if (inMin === null || outMin === null || schedStartMin === null || schedEndMin === null) {
    return 0;
  }
  const overlapStart = Math.max(inMin, schedStartMin);
  const overlapEnd = Math.min(outMin, schedEndMin);
  if (overlapEnd > overlapStart) {
    return overlapEnd - overlapStart;
  }
  return 0;
}

/**
 * Checks if a check-in timestamp falls within the allowed check-in window.
 * Normal check-in: 1 hour before scheduled start until 1 hour after scheduled start.
 *
 * @param {number} checkInMin
 * @param {number} scheduledStartMin
 * @param {number} [windowMinutes=60]
 * @returns {boolean}
 */
function isWithinCheckInWindow(checkInMin, scheduledStartMin, windowMinutes = 60) {
  if (checkInMin === null || scheduledStartMin === null) return false;
  return (
    checkInMin >= scheduledStartMin - windowMinutes &&
    checkInMin <= scheduledStartMin + windowMinutes
  );
}

/**
 * Checks if a check-out timestamp falls within the allowed check-out window.
 * Normal check-out: up to 1 hour after scheduled session end.
 *
 * @param {number} checkOutMin
 * @param {number} scheduledStartMin
 * @param {number} scheduledEndMin
 * @param {number} [windowMinutes=60]
 * @returns {boolean}
 */
function isWithinCheckOutWindow(checkOutMin, scheduledStartMin, scheduledEndMin, windowMinutes = 60) {
  if (checkOutMin === null || scheduledStartMin === null || scheduledEndMin === null) return false;
  return (
    checkOutMin >= scheduledStartMin &&
    checkOutMin <= scheduledEndMin + windowMinutes
  );
}

/**
 * Generates human-readable remarks/notes explaining exceptions such as:
 * - Late arrival
 * - Early departure
 * - Missing checkout
 * - Normal attendance
 *
 * @param {number} inMin
 * @param {number|null} outMin
 * @param {number} schedStartMin
 * @param {number} schedEndMin
 * @param {boolean} isMissingCheckout
 * @returns {string}
 */
function generateRemarks(inMin, outMin, schedStartMin, schedEndMin, isMissingCheckout = false) {
  if (isMissingCheckout || outMin === null || outMin === undefined) {
    return "Check-out time not recorded. Admin verification required.";
  }

  const isLate = inMin > schedStartMin;
  const isEarly = outMin < schedEndMin;

  if (isLate && isEarly) {
    const lateM = inMin - schedStartMin;
    const earlyM = schedEndMin - outMin;
    return `Checked in ${lateM} minutes after scheduled start time and left ${earlyM} minutes before session ended.`;
  }
  if (isLate) {
    const lateM = inMin - schedStartMin;
    return `Checked in ${lateM} minute${lateM === 1 ? "" : "s"} after the scheduled start time.`;
  }
  if (isEarly) {
    const earlyM = schedEndMin - outMin;
    return `Left ${earlyM} minute${earlyM === 1 ? "" : "s"} before the scheduled session ended.`;
  }
  return "Attended on schedule.";
}

/**
 * Groups sessions into consecutive session blocks (intervals) where the break between
 * consecutive sessions is <= meaningfulBreakMinutes (default: 15 minutes).
 *
 * @param {Array<object>} sessions
 * @param {number} [meaningfulBreakMinutes=15]
 * @returns {Array<{
 *   blockIndex: number,
 *   blockStartTime: string,
 *   blockEndTime: string,
 *   blockStartMin: number,
 *   blockEndMin: number,
 *   totalScheduledDuration: number,
 *   isConsecutive: boolean,
 *   sessions: Array<object>
 * }>}
 */
function groupConsecutiveSessions(sessions, meaningfulBreakMinutes = 15) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

  // Sort sessions chronologically by start time
  const sorted = [...sessions].sort((a, b) => {
    const startA = parseTimeToMinutes(a.startTime) || 0;
    const startB = parseTimeToMinutes(b.startTime) || 0;
    return startA - startB;
  });

  const blocks = [];
  let currentBlock = null;

  for (const s of sorted) {
    const sStartMin = parseTimeToMinutes(s.startTime);
    const sEndMin = parseTimeToMinutes(s.endTime);
    if (sStartMin === null || sEndMin === null) continue;

    if (!currentBlock) {
      currentBlock = {
        blockIndex: blocks.length + 1,
        blockStartTime: s.startTime,
        blockEndTime: s.endTime,
        blockStartMin: sStartMin,
        blockEndMin: sEndMin,
        totalScheduledDuration: sEndMin - sStartMin,
        sessions: [s],
      };
    } else {
      // Check if this session is consecutive without a meaningful break
      const breakMinutes = sStartMin - currentBlock.blockEndMin;
      if (breakMinutes <= meaningfulBreakMinutes && breakMinutes >= -15) {
        // Consecutive session: extend block
        currentBlock.sessions.push(s);
        currentBlock.blockEndTime = s.endTime;
        currentBlock.blockEndMin = Math.max(currentBlock.blockEndMin, sEndMin);
        currentBlock.totalScheduledDuration += (sEndMin - sStartMin);
      } else {
        // Meaningful break: close previous block and start a new one
        currentBlock.isConsecutive = currentBlock.sessions.length > 1;
        blocks.push(currentBlock);
        currentBlock = {
          blockIndex: blocks.length + 1,
          blockStartTime: s.startTime,
          blockEndTime: s.endTime,
          blockStartMin: sStartMin,
          blockEndMin: sEndMin,
          totalScheduledDuration: sEndMin - sStartMin,
          sessions: [s],
        };
      }
    }
  }

  if (currentBlock) {
    currentBlock.isConsecutive = currentBlock.sessions.length > 1;
    blocks.push(currentBlock);
  }

  return blocks;
}

module.exports = {
  parseTimeToMinutes,
  formatMinutesToTime,
  calculateTimeDuration,
  calculateSessionOverlap,
  isWithinCheckInWindow,
  isWithinCheckOutWindow,
  generateRemarks,
  groupConsecutiveSessions,
};
