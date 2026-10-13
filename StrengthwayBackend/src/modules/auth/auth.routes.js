"use strict";

const router = require("express").Router();
const ctrl = require("./auth.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { loginSchema, registerSchema, changePasswordSchema } = require("./auth.schema");

// Helper: Allows bootstrap registration if 0 users exist; otherwise requires Admin
async function allowInitialOrRequireAdmin(req, res, next) {
  const User = require("./user.model");
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      return next();
    }
  } catch {
    // fallback to auth
  }

  return authenticate(req, res, (err) => {
    if (err) return next(err);
    return requireAdmin(req, res, next);
  });
}

// ─── Public routes ─────────────────────────────────────────────────────────
// POST /api/v1/auth/login  — { email, password } → { token, user }
router.post("/login", validate(loginSchema), ctrl.login);

// POST /api/v1/auth/logout  — client-side token removal; server confirms
router.post("/logout", ctrl.logout);

// POST /api/v1/auth/refresh  — { token } → { token, user }
router.post("/refresh", ctrl.refresh);

// ─── User Profile Routes ───────────────────────────────────────────────────
// GET  /api/v1/auth/me  — returns the current user profile
router.get("/me", authenticate, ctrl.getMe);

// PATCH /api/v1/auth/change-password
router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  ctrl.changePassword
);

// ─── Users & Roles Management (Admin Only) ─────────────────────────────────
// POST /api/v1/auth/register — Create Admin, Trainer, or Member account
router.post("/register", allowInitialOrRequireAdmin, validate(registerSchema), ctrl.register);

// GET /api/v1/auth/users — List all user accounts
router.get("/users", authenticate, requireAdmin, ctrl.getAllUsers);

// PATCH /api/v1/auth/users/:id/status — Toggle active status
router.patch("/users/:id/status", authenticate, requireAdmin, ctrl.toggleUserStatus);

// DELETE /api/v1/auth/users/:id — Delete user account
router.delete("/users/:id", authenticate, requireAdmin, ctrl.deleteUser);

module.exports = router;
