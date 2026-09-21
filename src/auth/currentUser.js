const CURRENT_USER = {
  name: "Admin User",
  role: "Administrator",
  email: "admin@thestrengthway.com",
};

export function getCurrentUser() {
  if (typeof window === "undefined") return CURRENT_USER;

  try {
    const raw = localStorage.getItem("tsw-user") || localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      let name = user.name;
      if (!name && user.email) {
        name = user.email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
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
