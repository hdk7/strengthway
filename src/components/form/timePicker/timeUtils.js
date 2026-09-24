// --- Time String Helpers -----------------------------------------------------

export function parseTimeString(str) {
  if (!str || typeof str !== "string") {
    return { hour: "06", minute: "00", period: "AM" };
  }
  const match = str.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    let p = match[3] ? match[3].toUpperCase() : "AM";
    if (!match[3]) {
      if (h >= 12) {
        p = "PM";
        if (h > 12) h -= 12;
      } else if (h === 0) {
        h = 12;
        p = "AM";
      }
    }
    if (h > 12) h = 12;
    if (h < 1) h = 12;
    const minVal = Math.min(59, Math.max(0, parseInt(m, 10) || 0));
    return {
      hour: String(h).padStart(2, "0"),
      minute: String(minVal).padStart(2, "0"),
      period: p,
    };
  }
  return { hour: "06", minute: "00", period: "AM" };
}
