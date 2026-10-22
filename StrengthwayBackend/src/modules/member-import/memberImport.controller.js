"use strict";

const memberImportService = require("./memberImport.service");
const { success, created } = require("../../shared/response");
const { BadRequestError } = require("../../shared/apiError");

class MemberImportController {
  async getConfig(req, res, next) {
    try {
      const data = await memberImportService.getImportConfig();
      return success(res, data, "Import configuration retrieved successfully.");
    } catch (err) {
      next(err);
    }
  }

  async updateConfig(req, res, next) {
    try {
      const data = await memberImportService.updateImportConfig(req.body, req.user);
      return success(res, data, "Import configuration updated successfully.");
    } catch (err) {
      next(err);
    }
  }

  async downloadTemplate(req, res, next) {
    try {
      const format = (req.query.format || "xlsx").toLowerCase();
      const template = memberImportService.generateTemplate(format);

      res.setHeader("Content-Type", template.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${template.filename}"`
      );
      return res.status(200).send(template.buffer);
    } catch (err) {
      next(err);
    }
  }

  async uploadAndParse(req, res, next) {
    try {
      if (!req.file) {
        throw new BadRequestError("Please upload an Excel (.xlsx, .xls) or CSV file.");
      }

      const result = await memberImportService.parseUploadedFile(
        req.file.buffer,
        req.file.originalname
      );

      return success(res, result, "File parsed and columns mapped successfully.");
    } catch (err) {
      next(err);
    }
  }

  async validatePreview(req, res, next) {
    try {
      const { rows, mappings } = req.body;
      if (!rows || !Array.isArray(rows)) {
        throw new BadRequestError("Invalid payload: rows must be an array.");
      }

      const result = await memberImportService.validateAndPreview(rows, mappings);
      return success(res, result, "Data validated and preview generated successfully.");
    } catch (err) {
      next(err);
    }
  }

  async execute(req, res, next) {
    try {
      const { records, customMappingsToSave, sourceFilename, fileSize } = req.body;
      if (!records || !Array.isArray(records)) {
        throw new BadRequestError("Invalid payload: records array is required.");
      }

      const result = await memberImportService.executeImport({
        records,
        customMappingsToSave,
        adminUser: req.user,
        sourceFilename,
        fileSize,
      });

      return created(res, result, "Member bulk import executed successfully.");
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { page, pageSize } = req.query;
      const result = await memberImportService.getHistory({ page, pageSize });
      return success(res, result, "Import history retrieved successfully.");
    } catch (err) {
      next(err);
    }
  }

  async downloadErrorReport(req, res, next) {
    try {
      const { id } = req.params;
      const report = await memberImportService.generateErrorReportCsv(id);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${report.filename}"`
      );
      return res.status(200).send(report.buffer);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MemberImportController();
