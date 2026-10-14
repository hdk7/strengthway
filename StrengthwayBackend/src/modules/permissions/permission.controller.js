"use strict";

const permissionService = require("./permission.service");
const { success } = require("../../shared/response");

class PermissionController {
  /**
   * GET /api/v1/permissions
   * Returns full permission matrix, action definitions, and metadata
   */
  async getMatrix(req, res, next) {
    try {
      const data = await permissionService.getPermissionsMatrix();
      return success(res, data, "Permission matrix retrieved successfully", 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/permissions/me
   * Returns permissions specifically for the logged-in user's role
   */
  async getMyPermissions(req, res, next) {
    try {
      const userRole = req.user?.role || "member";
      const permissions = await permissionService.getRolePermissions(userRole);
      return success(
        res,
        { role: userRole, permissions },
        "User role permissions retrieved",
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/permissions/:role
   * Updates permissions for a specific role (Admin only)
   */
  async updateRole(req, res, next) {
    try {
      const { role } = req.params;
      const { permissions } = req.body;
      const result = await permissionService.updateRolePermissions(
        role,
        permissions,
        req.user
      );
      return success(
        res,
        result,
        `Permissions for '${role}' updated successfully`,
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/permissions/:role/reset
   * Resets permissions for a specific role to factory defaults (Admin only)
   */
  async resetRole(req, res, next) {
    try {
      const { role } = req.params;
      const result = await permissionService.resetRolePermissions(role, req.user);
      return success(
        res,
        result,
        `Permissions for '${role}' reset to defaults successfully`,
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/permissions/audit
   * Returns recent permission change audit logs (Admin only)
   */
  async getAudit(req, res, next) {
    try {
      const logs = await permissionService.getAuditLogs(50);
      return success(res, logs, "Audit logs retrieved successfully", 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PermissionController();
