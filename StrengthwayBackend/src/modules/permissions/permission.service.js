"use strict";

const RolePermission = require("./permission.model");
const PermissionAudit = require("./permissionAudit.model");
const {
  MODULES,
  ACTIONS,
  PERMISSION_DEFINITIONS,
  DEFAULT_TRAINER_PERMISSIONS,
  DEFAULT_MEMBER_PERMISSIONS,
} = require("../../shared/permissions");
const { USER_ROLES } = require("../../shared/constants");
const { BadRequestError, NotFoundError } = require("../../shared/apiError");

class PermissionService {
  constructor() {
    // In-memory cache for ultra-fast middleware checks without DB roundtrips on every HTTP request
    this._cache = new Map();
  }

  /**
   * Helper to convert Mongoose permissions map or plain object into a clean JS object
   */
  _toPlainObject(perms) {
    if (!perms) return {};
    if (perms instanceof Map) {
      return Object.fromEntries(perms);
    }
    if (typeof perms.toObject === "function") {
      const obj = perms.toObject();
      return obj instanceof Map ? Object.fromEntries(obj) : obj;
    }
    return { ...perms };
  }

  /**
   * Ensures default permissions exist in MongoDB for all non-admin roles
   */
  async ensureDefaults() {
    const rolesToSeed = [
      { role: USER_ROLES.TRAINER, defaults: DEFAULT_TRAINER_PERMISSIONS },
      { role: USER_ROLES.MEMBER, defaults: DEFAULT_MEMBER_PERMISSIONS },
    ];

    for (const { role, defaults } of rolesToSeed) {
      let existing = await RolePermission.findOne({ role });
      if (!existing) {
        await RolePermission.create({
          role,
          permissions: defaults,
          updatedByName: "System Seed",
        });
      } else {
        // Enforce Phase 3 constraints: Trainer cannot mark attendance; Member cannot view classes
        let modified = false;
        const currentPerms = this._toPlainObject(existing.permissions);
        if (role === USER_ROLES.TRAINER && currentPerms.attendance?.includes(ACTIONS.MARK_ATTENDANCE)) {
          currentPerms.attendance = currentPerms.attendance.filter((a) => a !== ACTIONS.MARK_ATTENDANCE);
          modified = true;
        }
        if (role === USER_ROLES.MEMBER && currentPerms.classes && currentPerms.classes.length > 0) {
          currentPerms.classes = [];
          modified = true;
        }
        if (modified) {
          existing.permissions = currentPerms;
          await existing.save();
          this.invalidateCache(role);
        }
      }
    }
  }

  /**
   * Clears the in-memory cache for a role or all roles
   */
  invalidateCache(role = null) {
    if (role) {
      this._cache.delete(role);
    } else {
      this._cache.clear();
    }
  }

  /**
   * Gets cached permissions for a role, fetching from DB if not cached
   */
  async getRolePermissions(role) {
    if (!role) return {};
    if (role === USER_ROLES.ADMIN) {
      // Super-Admin always has all permissions across all modules
      return this._getAllPermissionsObject();
    }

    if (this._cache.has(role)) {
      return this._cache.get(role);
    }

    let record = await RolePermission.findOne({ role });
    if (!record) {
      // Seed on-the-fly if missing
      const defaults =
        role === USER_ROLES.TRAINER
          ? DEFAULT_TRAINER_PERMISSIONS
          : DEFAULT_MEMBER_PERMISSIONS;
      record = await RolePermission.create({
        role,
        permissions: defaults,
        updatedByName: "System Default",
      });
    }

    const plain = this._toPlainObject(record.permissions);
    this._cache.set(role, plain);
    return plain;
  }

  /**
   * Returns an object where every module has all its possible actions enabled (for Super-Admin)
   */
  _getAllPermissionsObject() {
    const all = {};
    for (const def of PERMISSION_DEFINITIONS) {
      all[def.module] = def.actions.map((a) => a.id);
    }
    return all;
  }

  /**
   * Returns the entire permissions matrix + available definitions for the Admin UI
   */
  async getPermissionsMatrix() {
    await this.ensureDefaults();

    const trainerPerms = await this.getRolePermissions(USER_ROLES.TRAINER);
    const memberPerms = await this.getRolePermissions(USER_ROLES.MEMBER);

    const records = await RolePermission.find({
      role: { $in: [USER_ROLES.TRAINER, USER_ROLES.MEMBER] },
    });

    const metadata = {};
    for (const r of records) {
      metadata[r.role] = {
        updatedAt: r.updatedAt,
        updatedByName: r.updatedByName || "Administrator",
      };
    }

    return {
      definitions: PERMISSION_DEFINITIONS,
      roles: {
        [USER_ROLES.TRAINER]: trainerPerms,
        [USER_ROLES.MEMBER]: memberPerms,
      },
      metadata,
    };
  }

  /**
   * Updates permissions for a specific role and creates an audit trail entry
   */
  async updateRolePermissions(role, newPermissions, currentUser = {}) {
    if (![USER_ROLES.TRAINER, USER_ROLES.MEMBER, USER_ROLES.STAFF].includes(role)) {
      throw new BadRequestError(`Cannot modify permissions for role: ${role}`);
    }

    const currentPerms = await this.getRolePermissions(role);

    // Compute diffs for human-readable audit log
    const changesSummary = this._computePermissionDiffs(currentPerms, newPermissions);

    let doc = await RolePermission.findOne({ role });
    if (!doc) {
      doc = new RolePermission({ role });
    }

    doc.permissions = newPermissions;
    doc.updatedBy = currentUser.id || null;
    doc.updatedByName = currentUser.name || "Administrator";
    await doc.save();

    // Invalidate cache immediately
    this.invalidateCache(role);

    // Record audit log
    if (changesSummary.length > 0) {
      await PermissionAudit.create({
        role,
        actionType: "UPDATE",
        changedBy: currentUser.id || null,
        changedByName: currentUser.name || "Administrator",
        changedByEmail: currentUser.email || "admin@thestrengthway.com",
        changesSummary,
        previousPermissions: currentPerms,
        newPermissions,
      });
    }

    return {
      role,
      permissions: this._toPlainObject(doc.permissions),
      changesCount: changesSummary.length,
      updatedAt: doc.updatedAt,
      updatedByName: doc.updatedByName,
    };
  }

  /**
   * Resets permissions for a role to factory defaults
   */
  async resetRolePermissions(role, currentUser = {}) {
    if (![USER_ROLES.TRAINER, USER_ROLES.MEMBER].includes(role)) {
      throw new BadRequestError(`Invalid role for reset: ${role}`);
    }

    const currentPerms = await this.getRolePermissions(role);
    const defaults =
      role === USER_ROLES.TRAINER
        ? DEFAULT_TRAINER_PERMISSIONS
        : DEFAULT_MEMBER_PERMISSIONS;

    let doc = await RolePermission.findOne({ role });
    if (!doc) {
      doc = new RolePermission({ role });
    }

    doc.permissions = defaults;
    doc.updatedBy = currentUser.id || null;
    doc.updatedByName = `${currentUser.name || "Administrator"} (Reset to Factory Defaults)`;
    await doc.save();

    this.invalidateCache(role);

    await PermissionAudit.create({
      role,
      actionType: "RESET",
      changedBy: currentUser.id || null,
      changedByName: currentUser.name || "Administrator",
      changedByEmail: currentUser.email || "admin@thestrengthway.com",
      changesSummary: ["Reset all permissions back to factory defaults."],
      previousPermissions: currentPerms,
      newPermissions: defaults,
    });

    return {
      role,
      permissions: defaults,
      updatedAt: doc.updatedAt,
      updatedByName: doc.updatedByName,
    };
  }

  /**
   * Returns recent audit logs
   */
  async getAuditLogs(limit = 50) {
    return PermissionAudit.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Helper to compute detailed human-readable diffs between old and new permissions
   */
  _computePermissionDiffs(oldPerms, newPerms) {
    const diffs = [];
    const allModules = new Set([
      ...Object.keys(oldPerms || {}),
      ...Object.keys(newPerms || {}),
    ]);

    for (const mod of allModules) {
      const oldActions = new Set(oldPerms[mod] || []);
      const newActions = new Set(newPerms[mod] || []);

      const added = [...newActions].filter((a) => !oldActions.has(a));
      const removed = [...oldActions].filter((a) => !newActions.has(a));

      if (added.length > 0) {
        diffs.push(`${mod}: Granted [${added.join(", ")}]`);
      }
      if (removed.length > 0) {
        diffs.push(`${mod}: Revoked [${removed.join(", ")}]`);
      }
    }

    return diffs;
  }
}

module.exports = new PermissionService();
