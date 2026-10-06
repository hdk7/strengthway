/* eslint-disable max-lines */
import { toast } from "sonner";

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
    hour12: true,
  });
}

export function isDateToday(dateStr) {
  return dateStr === getTodayDateString();
}

export function isDatePast(dateStr) {
  return Boolean(dateStr && dateStr < getTodayDateString());
}

export function isDateFuture(dateStr) {
  return Boolean(dateStr && dateStr > getTodayDateString());
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }
  return null;
}

/**
 * Resolves the scheduled days list for a batch.
 */
export function getBatchDaysList(batch) {
  if (Array.isArray(batch?.daysList) && batch.daysList.length > 0) {
    return batch.daysList;
  }
  const pattern = (batch?.daysPattern || "MWF").trim();
  if (pattern === "MWF") return ["Monday", "Wednesday", "Friday"];
  if (pattern === "TTS") return ["Tuesday", "Thursday", "Saturday"];
  if (pattern === "Mon - Fri" || pattern === "WEEKDAYS") {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  }
  if (pattern === "Mon - Sat" || pattern === "6DAYS") {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  }
  if (pattern === "Daily" || pattern === "DAILY") {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  }
  if (pattern === "Weekend" || pattern === "WEEKEND") {
    return ["Saturday", "Sunday"];
  }
  return ["Monday", "Wednesday", "Friday"];
}

/**
 * Validates checkOutTime against checkInTime.
 */
export function isCheckOutValid(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) return true;
  const inM = parseTimeToMinutes(checkInTime);
  const outM = parseTimeToMinutes(checkOutTime);
  if (inM === null || outM === null) return true;
  return outM >= inM;
}

/**
 * Checks attendance access based on the assigned batch schedule (days and timings).
 * Attendance access is granted ONLY during the assigned batch days and time slots.
 */
export function checkBatchScheduleAccess(selectedDate, batch, now = new Date()) {
  if (!batch) {
    return {
      isAllowed: false,
      isScheduledDay: false,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: false,
      reason: "No assigned batch found.",
    };
  }

  // 1. Future date check: Locked until scheduled date
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

  // 2. Past date check: View only
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

  // 3. Current Day: Check day of week against batch schedule
  let dayOfWeek = "";
  try {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dayOfWeek = DAY_NAMES[dateObj.getDay()] || "";
  } catch {
    dayOfWeek = "";
  }

  const scheduledDays = getBatchDaysList(batch);
  const isScheduledDay = scheduledDays.includes(dayOfWeek);
  const daysLabel = batch.daysLabel || scheduledDays.join(", ");
  const rawStart = batch.startTime || (batch.timingLabel ? batch.timingLabel.split("-")[0]?.trim() : "06:00 AM");
  const rawEnd = batch.endTime || (batch.timingLabel ? batch.timingLabel.split("-")[1]?.trim() : "07:00 AM");
  const timingLabel = batch.timingLabel || `${rawStart} - ${rawEnd}`;

  if (!isScheduledDay) {
    return {
      isAllowed: false,
      isScheduledDay: false,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: false,
      dayOfWeek,
      daysLabel,
      timingLabel,
      startTime: rawStart,
      endTime: rawEnd,
      reason: `Restricted: ${batch.name || "Batch"} runs on ${daysLabel}. No class on ${dayOfWeek}.`,
    };
  }

  // 4. Current Day & Scheduled Day: Check time slot
  const startMinutes = parseTimeToMinutes(rawStart);
  const endMinutes = parseTimeToMinutes(rawEnd);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (startMinutes !== null && currentMinutes < startMinutes) {
    return {
      isAllowed: false,
      isScheduledDay: true,
      isWithinTiming: false,
      isBeforeStart: true,
      isAfterEnd: false,
      dayOfWeek,
      daysLabel,
      timingLabel,
      startTime: rawStart,
      endTime: rawEnd,
      reason: `Restricted: Scheduled ${timingLabel} (Opens at ${rawStart}).`,
    };
  }

  if (endMinutes !== null && currentMinutes > endMinutes) {
    return {
      isAllowed: false,
      isScheduledDay: true,
      isWithinTiming: false,
      isBeforeStart: false,
      isAfterEnd: true,
      dayOfWeek,
      daysLabel,
      timingLabel,
      startTime: rawStart,
      endTime: rawEnd,
      reason: `Restricted: Attendance closed (Class ended at ${rawEnd}).`,
    };
  }

  // Active attendance session
  return {
    isAllowed: true,
    isScheduledDay: true,
    isWithinTiming: true,
    isBeforeStart: false,
    isAfterEnd: false,
    dayOfWeek,
    daysLabel,
    timingLabel,
    startTime: rawStart,
    endTime: rawEnd,
    reason: `Active session window (${timingLabel}).`,
  };
}

/**
 * Checks if the applicable attendance period has ended for the given date and batch.
 */
export function isAttendancePeriodExpired(selectedDate, batch) {
  if (isDatePast(selectedDate)) return true;
  if (isDateFuture(selectedDate)) return false;
  const access = checkBatchScheduleAccess(selectedDate, batch);
  return access.isAfterEnd || !access.isScheduledDay;
}

/**
 * Computes daily attendance KPIs.
 */
export function calculateDailyKpis(dailyAttendees, dailyRecordsMap, selectedDate, batch) {
  const isPast = isDatePast(selectedDate);
  const scheduleAccess = checkBatchScheduleAccess(selectedDate, batch);
  const periodExpired = isPast || scheduleAccess.isAfterEnd || !scheduleAccess.isScheduledDay;

  const totalEligible = dailyAttendees.filter((a) => !a.isFlexOut).length;
  let presentCount = 0;
  let flexInCount = 0;
  let absentCount = 0;
  const flexOutCount = dailyAttendees.filter((a) => a.isFlexOut).length;

  dailyAttendees.forEach((a) => {
    if (a.isFlexOut) return;
    const rec = dailyRecordsMap[a.memberId];
    const isCheckedIn = Boolean(rec?.checkInTime || rec?.status === "PRESENT");
    const isAbsent = rec?.status === "ABSENT" || (!isCheckedIn && periodExpired);

    if (isCheckedIn) {
      presentCount++;
      if (a.isFlexIn || rec?.isFlexAttendance) flexInCount++;
    } else if (isAbsent) {
      absentCount++;
    }
  });

  const turnoutRate = totalEligible > 0 ? Math.round((presentCount / totalEligible) * 100) : 0;
  return { totalEligible, presentCount, turnoutRate, flexInCount, absentCount, flexOutCount };
}

export function exportMatrixCSV(matrixData, selectedMonth) {
  if (!matrixData || !matrixData.members || matrixData.members.length === 0) {
    toast.error("No matrix attendance records available to export.");
    return;
  }

  const { daysInMonth, members, matrix, batchName } = matrixData;
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
  const headers = [
    "Member ID",
    "Athlete Name",
    "Enrolled Type",
    ...dayHeaders,
    "Present Count",
    "Total Logged",
    "Compliance Rate %",
  ];

  const rows = members.map((mem) => {
    const memberMatrix = matrix[mem.id] || {};
    let present = 0;
    let total = 0;

    const dailyCols = Array.from({ length: daysInMonth }, (_, i) => {
      const dayStr = String(i + 1).padStart(2, "0");
      const dateStr = `${selectedMonth}-${dayStr}`;
      const record = memberMatrix[dateStr];
      if (!record) return "—";

      total++;
      const st = record.status;
      if (st === "PRESENT" || st === "LATE" || st === "CHECKED_IN" || st === "CHECKED_OUT") {
        present++;
        if (record.isFlexAttendance) return "FLEX";
        return "P";
      }
      if (st === "ABSENT") return "A";
      if (st === "EXCUSED") return "E";
      return st;
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return [
      `"${mem.id}"`,
      `"${mem.name}"`,
      `"${mem.isFlexIn ? "Inbound Flex Pass" : "Permanent Member"}"`,
      ...dailyCols.map((c) => `"${c}"`),
      present,
      total,
      `${rate}%`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `${batchName.replace(/\s+/g, "_")}_Attendance_${selectedMonth}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Attendance matrix CSV downloaded.");
}
