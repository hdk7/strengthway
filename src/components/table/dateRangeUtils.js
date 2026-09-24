export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const formatBoxDate = (dateStr) => {
  if (!dateStr) return "Select...";
  try {
    const [y, m, d] = dateStr.split("-");
    const mIndex = parseInt(m, 10) - 1;
    const month = MONTH_NAMES[mIndex]?.slice(0, 3) || m;
    return `${parseInt(d, 10)} ${month} ${y}`;
  } catch {
    return dateStr;
  }
};

/**
 * Generate 7-column calendar day cells for a given month and year
 */
export const getCalendarDays = (viewYear, viewMonth) => {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];

  // Previous month tail days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const d = new Date(viewYear, viewMonth - 1, dayNum);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    days.push({
      dayNumber: dayNum,
      dateString: dateStr,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: true,
    });
  }

  // Next month head days to complete full 7-col grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(viewYear, viewMonth + 1, d);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
    });
  }

  return days;
};
