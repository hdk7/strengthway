const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Demo mode defaults to true unless explicitly disabled with VITE_DEMO_MODE=false.
// This ensures that deployed previews (such as on Vercel) work out-of-the-box without requiring a live backend.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";
export const DEMO_CREDENTIALS = { email: "admin@thestrengthway.com", password: "Admin@12345" };

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function loginAdmin({ email, password }) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const isDemoCredentialMatch =
    normalizedEmail === DEMO_CREDENTIALS.email.toLowerCase() &&
    password === DEMO_CREDENTIALS.password;

  // If in demo mode OR using demo credentials, authenticate immediately
  if (DEMO_MODE || isDemoCredentialMatch) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (isDemoCredentialMatch) {
      return {
        token: `demo-token-${Date.now()}`,
        user: {
          id: "ADM-001",
          email: DEMO_CREDENTIALS.email,
          name: "Administrator",
          role: "admin",
        },
      };
    }
    throw new AuthError("Incorrect email or password. Please use the demo credentials.", 401);
  }

  // Live backend authentication attempt
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new AuthError("Unable to reach the backend server. Please verify your connection or use demo credentials.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new AuthError("Incorrect email or password.", 401);
    }
    throw new AuthError("Something went wrong. Please try again.", response.status);
  }

  return response.json();
}

export async function forgotPassword(email) {
  if (DEMO_MODE || !import.meta.env.VITE_API_BASE_URL) {
    // Simulate network delay without leaking whether the email exists
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { message: "If the email is registered, a password reset link has been sent." };
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new AuthError("Unable to reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new AuthError("Something went wrong. Please try again.", response.status);
  }

  return response.json();
}
