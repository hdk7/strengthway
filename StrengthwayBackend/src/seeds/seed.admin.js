"use strict";

/**
 * Admin User Seeder
 * =================
 * Creates the default administrative accounts if they don't already exist.
 * Run standalone with:  node src/seeds/seed.admin.js
 */

require("../config/env");
const bcrypt = require("bcryptjs");
const { connectDB, disconnectDB } = require("../config/database");
const User = require("../modules/auth/user.model");

const DEFAULT_USERS = [
  {
    name: "StrengthWay Admin",
    email: "admin@strengthway.com",
    password: "Admin@2026",
    role: "admin",
    trainerId: null,
    memberId: null,
  },
  {
    name: "StrengthWay Admin",
    email: "admin@thestrengthway.com",
    password: "Admin@2026",
    role: "admin",
    trainerId: null,
    memberId: null,
  },
  {
    name: "Dolliee Ellens (Trainer Demo)",
    email: "trainer@strengthway.com",
    password: "Trainer@2026",
    role: "trainer",
    trainerId: "TRN-101",
    memberId: null,
  },
  {
    name: "Dolliee Ellens (Trainer Demo)",
    email: "trainer@thestrengthway.com",
    password: "Trainer@2026",
    role: "trainer",
    trainerId: "TRN-101",
    memberId: null,
  },
  {
    name: "Arun Varma (Member Demo)",
    email: "member@strengthway.com",
    password: "Member@2026",
    role: "member",
    trainerId: null,
    memberId: "MEM-2001",
  },
  {
    name: "Arun Varma (Member Demo)",
    email: "member@thestrengthway.com",
    password: "Member@2026",
    role: "member",
    trainerId: null,
    memberId: "MEM-2001",
  },
];

async function seedAdmin(options = {}) {
  const { silent = false } = options;
  let seeded = 0;
  let skipped = 0;

  for (const userData of DEFAULT_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.name = userData.name;
      existing.role = userData.role;
      existing.trainerId = userData.trainerId || null;
      existing.memberId = userData.memberId || null;
      existing.isActive = true;
      await existing.save();
      seeded++;
      if (!silent) console.log(`[Seed:User] ✓ User account updated: ${userData.email} (${userData.role})`);
      continue;
    }

    await User.create({
      name: userData.name,
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role,
      trainerId: userData.trainerId || null,
      memberId: userData.memberId || null,
    });
    seeded++;
    if (!silent) {
      console.log(`[Seed:User] ✓ User account created: ${userData.email} (${userData.role})`);
    }
  }

  // Ensure default RBAC permissions are configured
  try {
    const permissionService = require("../modules/permissions/permission.service");
    await permissionService.ensureDefaults();
    if (!silent) console.log("[Seed:Permissions] ✓ Default RBAC role permissions verified.");
  } catch (permErr) {
    if (!silent) console.warn("[Seed:Permissions] Notice:", permErr.message);
  }

  return { seeded, skipped };
}

// Standalone execution support: node src/seeds/seed.admin.js
if (require.main === module) {
  (async () => {
    try {
      console.log("[ADMIN SEED] Connecting to database...");
      await connectDB();
      await seedAdmin({ silent: false });
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error("[ADMIN SEED] ✗ Failed:", err.message);
      process.exit(1);
    }
  })();
}

module.exports = seedAdmin;
