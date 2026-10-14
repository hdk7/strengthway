/**
 * Utility to map numeric percentages (0-100) to Tailwind CSS width utility classes.
 * Fully static class names ensure Tailwind compiler extracts every variant.
 */
export function getTailwindWidth(percent) {
  const p = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  if (p === 0) return "w-0";
  if (p <= 5) return "w-[5%]";
  if (p <= 10) return "w-[10%]";
  if (p <= 15) return "w-[15%]";
  if (p <= 20) return "w-[20%]";
  if (p <= 25) return "w-[25%]";
  if (p <= 30) return "w-[30%]";
  if (p <= 35) return "w-[35%]";
  if (p <= 40) return "w-[40%]";
  if (p <= 45) return "w-[45%]";
  if (p <= 50) return "w-[50%]";
  if (p <= 55) return "w-[55%]";
  if (p <= 60) return "w-[60%]";
  if (p <= 65) return "w-[65%]";
  if (p <= 70) return "w-[70%]";
  if (p <= 75) return "w-[75%]";
  if (p <= 80) return "w-[80%]";
  if (p <= 85) return "w-[85%]";
  if (p <= 90) return "w-[90%]";
  if (p <= 95) return "w-[95%]";
  return "w-full";
}
