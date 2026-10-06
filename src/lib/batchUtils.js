export const SHIFT_SLOTS = [
  {
    key: "6_00_am_mwf",
    label: "6.00 am MWF",
    time: "06:00 AM - 07:00 AM",
    days: "MWF",
    batchId: "BATCH-01",
  },
  {
    key: "8_00_am_mwf",
    label: "8.00am MWF",
    time: "08:00 AM - 09:00 AM",
    days: "MWF",
    batchId: "BATCH-02",
  },
  {
    key: "6_00_am_tts",
    label: "6 am TTS",
    time: "06:00 AM - 07:00 AM",
    days: "TTS",
    batchId: "BATCH-04",
  },
  {
    key: "8_00_am_tts",
    label: "8 AM TTS",
    time: "08:00 AM - 09:00 AM",
    days: "TTS",
    batchId: "BATCH-05",
  },
  {
    key: "6_30_pm_mwf",
    label: "6.30 PM MWF",
    time: "06:30 PM - 07:30 PM",
    days: "MWF",
    batchId: "BATCH-03",
  },
  {
    key: "8_00_pm_mwf",
    label: "8 00 PM MWF",
    time: "08:00 PM - 09:00 PM",
    days: "MWF",
    batchId: "BATCH-06",
  },
];

// Pure schedule utility
export function resolveDaysDetails(daysPattern, customLabel, customList) {
  const p = (daysPattern || "MWF").trim();
  if (p === "MWF") {
    return {
      daysPattern: "MWF",
      daysLabel: "Monday • Wednesday • Friday",
      daysList: ["Monday", "Wednesday", "Friday"],
    };
  }
  if (p === "TTS") {
    return {
      daysPattern: "TTS",
      daysLabel: "Tuesday • Thursday • Saturday",
      daysList: ["Tuesday", "Thursday", "Saturday"],
    };
  }
  if (p === "Mon - Fri" || p === "WEEKDAYS") {
    return {
      daysPattern: "Mon - Fri",
      daysLabel: "Monday to Friday (Weekdays)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    };
  }
  if (p === "Mon - Sat" || p === "6DAYS") {
    return {
      daysPattern: "Mon - Sat",
      daysLabel: "Monday to Saturday (6 Days)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    };
  }
  if (p === "Daily" || p === "DAILY") {
    return {
      daysPattern: "Daily",
      daysLabel: "Monday to Sunday (All 7 Days)",
      daysList: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    };
  }
  if (p === "Weekend" || p === "WEEKEND") {
    return {
      daysPattern: "Weekend",
      daysLabel: "Saturday • Sunday (Weekend)",
      daysList: ["Saturday", "Sunday"],
    };
  }

  if (customLabel && customList && Array.isArray(customList) && customList.length > 0) {
    return {
      daysPattern: daysPattern || "CUSTOM",
      daysLabel: customLabel,
      daysList: customList,
    };
  }

  return {
    daysPattern: p,
    daysLabel: customLabel || p,
    daysList: customList && customList.length > 0 ? customList : [p],
  };
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3] ? match[3].toUpperCase() : null;

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function hasClassStarted(session, now = new Date()) {
  if (!session) return false;
  const rawDate = session.sessionDate;
  if (!rawDate) return false;

  const sessionDate = typeof rawDate === "string" ? rawDate.slice(0, 10) : "";
  const todayLocal = getLocalDateString(now);

  if (sessionDate < todayLocal) {
    return true;
  }
  if (sessionDate > todayLocal) {
    return false;
  }

  const rawTime =
    session.startTime ||
    (session.timing ? session.timing.split("-")[0].trim() : "");
  if (!rawTime) {
    return true;
  }

  const classMinutes = parseTimeToMinutes(rawTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= classMinutes;
}

