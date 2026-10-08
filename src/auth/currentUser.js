import { STORAGE_KEYS } from "@/config/storageKeys";

const CURRENT_USER = {
  name: "StrengthWay",
  role: "Administrator",
  email: "admin@thestrengthway.com",
};

export function getCurrentUser() {
  if (typeof window === "undefined") return CURRENT_USER;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) {
      const user = JSON.parse(raw);
      let name = user.name;
      if (!name && user.email) {
        name = user.email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
      if (
        !name ||
        name === "Gym Admin" ||
        name === "Admin User" ||
        name.toLowerCase().includes("gym admin")
      ) {
        name = "StrengthWay";
        try {
          user.name = "StrengthWay";
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        } catch {
          // ignore
        }
      }
      return {
        name: name || CURRENT_USER.name,
        role: user.role || CURRENT_USER.role,
        email: user.email || CURRENT_USER.email,
      };
    }
  } catch {
    // fallback
  }

  return CURRENT_USER;
}
