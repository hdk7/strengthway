/**
 * Centralized formatting utilities for Strengthway CRM
 */

/**
 * Formats a number or string into Indian Rupee (INR) representation.
 * Example: 18000 -> "₹18,000", -2500 -> "-₹2,500"
 */
export function formatINR(amount, { includeSymbol = true, decimals = 0 } = {}) {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = Number(amount);
  if (Number.isNaN(num)) return "—";

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const prefix = includeSymbol ? (isNegative ? "-₹" : "₹") : isNegative ? "-" : "";
  return `${prefix}${formatted}`;
}

/**
 * Standardized Date Formatter across all modules
 * Eliminates inconsistencies between en-US, en-IN, and en-GB.
 */
export function formatDate(dateInput, format = "short", fallback = "—") {
  if (!dateInput) return fallback;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return fallback;

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "full":
      return date.toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "dateTime":
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    case "monthYear":
      return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    case "weekday":
      return date.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    case "iso":
      return date.toISOString().split("T")[0];
    default:
      return date.toLocaleDateString("en-IN");
  }
}

/**
 * Standardized Entity ID display badge formatter
 * Example: "662a874b2f1e" -> "2F1E" or "INQ-2026-003" -> "INQ-2026-003"
 */
export function formatEntityId(id, maxLen = 7) {
  if (!id) return "";
  const str = String(id);
  return str.length > maxLen ? str.slice(-6).toUpperCase() : str;
}

/**
 * Returns initials from a full name (e.g., "John Doe" -> "JD", "Alex" -> "A")
 */
export function getInitials(name, fallback = "M") {
  if (!name || typeof name !== "string") return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || fallback;
}
