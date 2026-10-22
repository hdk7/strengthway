"use strict";

const router = require("express").Router();
const multer = require("multer");
const ctrl = require("./memberImport.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireAdmin } = require("../../middleware/role.middleware");
const { BadRequestError } = require("../../shared/apiError");

const storage = multer.memoryStorage();

const spreadsheetFilter = (req, file, cb) => {
  const allowedMime = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/csv",
    "text/plain",
    "text/x-csv",
    "application/octet-stream",
  ];
  const isExtValid = /\.(xlsx|xls|csv)$/i.test(file.originalname);

  if (allowedMime.includes(file.mimetype) || isExtValid) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type "${file.mimetype}". Please upload an Excel (.xlsx, .xls) or CSV file.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: spreadsheetFilter,
});

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new BadRequestError("Spreadsheet file is too large. Max 10MB allowed."));
    }
    return next(new BadRequestError(`File upload error: ${err.message}`));
  }
  next(err);
}

// ─── Import Routes (Admin restricted) ─────────────────────────────────────────

// GET  /api/v1/member-import/config — Get Google Form template URL & question catalog
router.get("/config", authenticate, requireAdmin, ctrl.getConfig);

// PUT  /api/v1/member-import/config — Update custom Google Form URL or settings
router.put("/config", authenticate, requireAdmin, ctrl.updateConfig);

// GET  /api/v1/member-import/template — Download Excel (.xlsx) or CSV import template
router.get("/template", authenticate, requireAdmin, ctrl.downloadTemplate);

// POST /api/v1/member-import/parse — Upload file -> Parse & auto-map headers
router.post(
  "/parse",
  authenticate,
  requireAdmin,
  upload.single("file"),
  handleMulterError,
  ctrl.uploadAndParse
);

// POST /api/v1/member-import/validate — Run smart validation & duplicate detection
router.post("/validate", authenticate, requireAdmin, ctrl.validatePreview);

// POST /api/v1/member-import/execute — Bulk create/update members
router.post("/execute", authenticate, requireAdmin, ctrl.execute);

// GET  /api/v1/member-import/history — Audit log of past imports
router.get("/history", authenticate, requireAdmin, ctrl.getHistory);

// GET  /api/v1/member-import/history/:id/error-report — Download failed rows CSV
router.get("/history/:id/error-report", authenticate, requireAdmin, ctrl.downloadErrorReport);

module.exports = router;
