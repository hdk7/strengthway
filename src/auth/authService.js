const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// TEMPORARY: lets you test the login UI before a real backend exists.
// Remove this block and DEMO_CREDENTIALS once VITE_API_BASE_URL points at a live auth endpoint.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
export const DEMO_CREDENTIALS = { email: "admin@thestrengthway.com", password: "Admin@12345" };

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function loginAdmin({ email, password }) {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      return { token: "demo-token", user: { email } };
    }
    throw new AuthError("Incorrect email or password.", 401);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new AuthError("Unable to reach the server. Check your connection and try again.");
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
  if (DEMO_MODE) {
    // Simulate network delay without leaking whether the email exists
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { message: "If the email is registered, a reset link has been sent." };
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
