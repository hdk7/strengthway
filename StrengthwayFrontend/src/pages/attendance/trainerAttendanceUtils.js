/* eslint-disable max-lines */
/**
 * Trainer Attendance Utilities & Schedule Rules
 *
 * Provides pure date/time evaluation, schedule access validation,
 * automatic Absent expiration, and daily KPI aggregation for faculty attendance.
 * Directly mirrors the Members Attendance module pattern while maintaining
 * Trainer Attendance as a distinct record and workflow.
 */

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isDateToday(dateStr) {
  return dateStr === getTodayDateString();
}

export function isDatePast(dateStr) {
  const today = getTodayDateString();
  return dateStr < today;
}

export function isDateFuture(dateStr) {
  const today = getTodayDateString();
  return dateStr > today;
}

/**
 * Parses a standard 12h or 24h time string into minutes since midnight.
 * e.g., "06:00 AM" -> 360, "02:00 PM" -> 840, "14:00" -> 840
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const clean = timeStr.trim().toUpperCase();

  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = match12[3];
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours < 12) hours += 12;
    return hours * 60 + minutes;
  }

  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
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
export function formatMinutesToTime(minutes) {
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
 * Calculates actual overlap between an attendance interval and a scheduled session.
 * Excludes time outside the scheduled period from teaching duration.
 *
 * @param {number} inMin
 * @param {number} outMin
 * @param {number} schedStartMin
 * @param {number} schedEndMin
 * @returns {number}
 */
export function calculateSessionOverlap(inMin, outMin, schedStartMin, schedEndMin) {
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
 * Groups sessions into consecutive session blocks (intervals) where break <= 15 minutes.
 *
 * @param {Array<object>} sessions
 * @param {number} [meaningfulBreakMinutes=15]
 * @returns {Array<object>}
 */
export function groupConsecutiveSessions(sessions = [], meaningfulBreakMinutes = 15) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];

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
      const breakMinutes = sStartMin - currentBlock.blockEndMin;
      if (breakMinutes <= meaningfulBreakMinutes && breakMinutes >= -15) {
        currentBlock.sessions.push(s);
        currentBlock.blockEndTime = s.endTime;
        currentBlock.blockEndMin = Math.max(currentBlock.blockEndMin, sEndMin);
        currentBlock.totalScheduledDuration += (sEndMin - sStartMin);
      } else {
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

/**
 * Generates remarks for exceptions (late arrival, missing checkout, early departure).
 */
export function generateRemarks(inMin, outMin, schedStartMin, schedEndMin, isMissingCheckout = false) {
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
 * Derives a trainer's applicable schedule, working days, and time slot for a selected date.
 */
export function getTrainerScheduleDetails(trainer, batches = [], selectedDate = getTodayDateString()) {
  let dayOfWeek = "";
  try {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dayOfWeek = DAY_NAMES[dateObj.getDay()] || "";
  } catch {
    dayOfWeek = "";
  }

  const assignedBatches = (batches || []).filter((b) =>
    Array.isArray(trainer?.batchIds) && trainer.batchIds.includes(b.id)
  );

  const batchesRunningToday = assignedBatches.filter((b) => {
    if (Array.isArray(b.daysList) && b.daysList.length > 0) {
      return b.daysList.includes(dayOfWeek);
    }
    if (b.daysPattern === "TTS") {
      return ["Tuesday", "Thursday", "Saturday"].includes(dayOfWeek);
    }
    if (b.daysPattern === "MWF") {
      return ["Monday", "Wednesday", "Friday"].includes(dayOfWeek);
    }
    return dayOfWeek !== "Sunday";
  });

  if (assignedBatches.length > 0) {
    const isScheduledDay = batchesRunningToday.length > 0;
    const activeBatches = isScheduledDay ? batchesRunningToday : assignedBatches;

    const rawStart = activeBatches[0]?.startTime || (activeBatches[0]?.timingLabel ? activeBatches[0].timingLabel.split("-")[0]?.trim() : "06:00 AM");
    const rawEnd = activeBatches[activeBatches.length - 1]?.endTime || (activeBatches[activeBatches.length - 1]?.timingLabel ? activeBatches[activeBatches.length - 1].timingLabel.split("-")[1]?.trim() : "07:00 AM");

    const daysLabel = Array.from(new Set(assignedBatches.map((b) => b.daysLabel || b.daysPattern))).filter(Boolean).join(" • ") || "Assigned Days";
    const timingLabel = activeBatches.map((b) => b.timingLabel || `${b.startTime || rawStart} - ${b.endTime || rawEnd}`).join(", ");

    return {
      dayOfWeek,
      isScheduledDay,
      assignedBatches,
      batchesRunningToday,
      primaryBatchId: activeBatches[0]?.id || assignedBatches[0]?.id,
      primaryBatchName: activeBatches[0]?.name || assignedBatches[0]?.name,
      startTime: rawStart,
      endTime: rawEnd,
      timingLabel: timingLabel || `${rawStart} - ${rawEnd}`,
      daysLabel,
    };
  }

  // Fallback: Trainer Shift slot (e.g., Morning 06:00 - 14:00, Evening 14:00 - 22:00, General)
  const shiftStr = (trainer?.shift || "General (06:00 - 14:00)").trim();
  const isSunday = dayOfWeek === "Sunday";
  const isScheduledDay = !isSunday;

  let rawStart = "06:00 AM";
  let rawEnd = "02:00 PM";

  if (shiftStr.includes("14:00") && shiftStr.includes("22:00")) {
    rawStart = "02:00 PM";
    rawEnd = "10:00 PM";
  } else if (shiftStr.includes("Evening")) {
    rawStart = "02:00 PM";
    rawEnd = "10:00 PM";
  } else if (shiftStr.includes("Full Day")) {
    rawStart = "06:00 AM";
    rawEnd = "10:00 PM";
  }

  return {
    dayOfWeek,
    isScheduledDay,
    assignedBatches: [],
    batchesRunningToday: [],
    primaryBatchId: "BATCH-DEFAULT",
    primaryBatchName: "Faculty Floor Shift",
    startTime: rawStart,
    endTime: rawEnd,
    timingLabel: `${rawStart} - ${rawEnd}`,
    daysLabel: "Monday • Saturday",
  };
}

/**
 * Validates schedule access for checking in/out on a given date.
 */
export function checkTrainerScheduleAccess(selectedDate, trainer, batches = [], now = new Date()) {
  if (isDateFuture(selectedDate)) {
    return {
      isAllowed: false,
      isScheduledDay: false,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: false,
      isFuture: true,
      reason: `Attendance disabled until scheduled date (${selectedDate}).`,
    };
  }

  if (isDatePast(selectedDate)) {
    return {
      isAllowed: false,
      isScheduledDay: false,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: true,
      isPast: true,
      reason: "Past session records are view-only.",
    };
  }

  const schedule = getTrainerScheduleDetails(trainer, batches, selectedDate);

  if (!schedule.isScheduledDay) {
    return {
      isAllowed: false,
      isScheduledDay: false,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: false,
      dayOfWeek: schedule.dayOfWeek,
      daysLabel: schedule.daysLabel,
      timingLabel: schedule.timingLabel,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      reason: `Restricted: Faculty scheduled for ${schedule.daysLabel}. No class/shift on ${schedule.dayOfWeek}.`,
    };
  }

  const startMinutes = parseTimeToMinutes(schedule.startTime);
  const endMinutes = parseTimeToMinutes(schedule.endTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const checkInWindowOpen = startMinutes !== null ? startMinutes - 60 : null;
  const checkOutWindowClose = endMinutes !== null ? endMinutes + 60 : null;

  if (checkInWindowOpen !== null && currentMinutes < checkInWindowOpen) {
    return {
      isAllowed: false,
      isScheduledDay: true,
      isWithinTiming: false,
      isBeforeStart: true,
      isAfterEnd: false,
      dayOfWeek: schedule.dayOfWeek,
      daysLabel: schedule.daysLabel,
      timingLabel: schedule.timingLabel,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      reason: `Restricted: Scheduled ${schedule.timingLabel} (Check-in opens at ${formatMinutesToTime(checkInWindowOpen)}).`,
    };
  }

  if (checkOutWindowClose !== null && currentMinutes > checkOutWindowClose) {
    return {
      isAllowed: false,
      isScheduledDay: true,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: true,
      dayOfWeek: schedule.dayOfWeek,
      daysLabel: schedule.daysLabel,
      timingLabel: schedule.timingLabel,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      reason: `Restricted: Attendance closed (Session window ended at ${formatMinutesToTime(checkOutWindowClose)}).`,
    };
  }

  return {
    isAllowed: true,
    isScheduledDay: true,
    isWithinTiming: true,
    isBeforeStart: false,
    isAfterEnd: false,
    dayOfWeek: schedule.dayOfWeek,
    daysLabel: schedule.daysLabel,
    timingLabel: schedule.timingLabel,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    reason: `Active session window (${schedule.timingLabel}).`,
  };
}

/**
 * Checks if the applicable attendance period has ended for the trainer on the date.
 */
export function isTrainerAttendancePeriodExpired(selectedDate, trainer, batches = []) {
  if (isDatePast(selectedDate)) return true;
  if (isDateFuture(selectedDate)) return false;
  const access = checkTrainerScheduleAccess(selectedDate, trainer, batches);
  return access.isAfterEnd || !access.isScheduledDay;
}

/**
 * Computes the effective attendance status for a trainer on the selected date.
 * Returns: "PRESENT" | "ABSENT" | "LEAVE" | "PENDING"
 */
export function getEffectiveTrainerStatus(trainer, record, scheduleAccess, isPast, periodExpired) {
  if (record?.checkInTime || record?.status === "PRESENT" || record?.status === "CONDUCTED") {
    return "PRESENT";
  }

  if (record?.status === "LEAVE") {
    return "LEAVE";
  }

  const isRestrictedOrExpired =
    isPast ||
    periodExpired ||
    (scheduleAccess && !scheduleAccess.isScheduledDay) ||
    (scheduleAccess && scheduleAccess.isAfterEnd);

  if (record?.status === "ABSENT" || isRestrictedOrExpired) {
    return "ABSENT";
  }

  return "PENDING";
}

/**
 * Aggregates daily KPIs for faculty attendance.
 */
export function calculateTrainerDailyKpis(trainers = [], dailyRecordsMap = {}, selectedDate, batches = []) {
  const isPast = isDatePast(selectedDate);
  const activeTrainers = trainers.filter((t) => t.status !== "Inactive");
  const totalFaculty = activeTrainers.length;

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let pendingCount = 0;
  let totalMinutes = 0;

  activeTrainers.forEach((trainer) => {
    const record = dailyRecordsMap[trainer.id];
    const scheduleAccess = checkTrainerScheduleAccess(selectedDate, trainer, batches);
    const periodExpired = isTrainerAttendancePeriodExpired(selectedDate, trainer, batches);
    const status = getEffectiveTrainerStatus(trainer, record, scheduleAccess, isPast, periodExpired);

    if (status === "PRESENT") {
      presentCount++;
      totalMinutes += record?.durationMinutes || 60;
    } else if (status === "LEAVE") {
      leaveCount++;
    } else if (status === "ABSENT") {
      absentCount++;
    } else {
      pendingCount++;
    }
  });

  const turnoutRate = totalFaculty > 0 ? Math.round((presentCount / totalFaculty) * 100) : 0;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return {
    totalFaculty,
    presentCount,
    absentCount,
    leaveCount,
    pendingCount,
    turnoutRate,
    totalHours,
  };

}
