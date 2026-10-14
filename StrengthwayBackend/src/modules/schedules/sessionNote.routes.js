"use strict";

const router = require("express").Router();
const ctrl = require("./sessionNote.controller");
const { validate } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { requireTrainer, requireAdmin } = require("../../middleware/role.middleware");
const { upsertSessionNoteSchema } = require("./schedule.schema");

// GET /api/v1/session-notes/daily - Admin overview of today's ongoing & completed notes (Requirement 5)
router.get("/daily", authenticate, requireAdmin, ctrl.getDailyForAdmin);

// GET /api/v1/session-notes - query notes by sessionId, batchId, trainerId, date (Admin and Trainer only)
router.get("/", authenticate, requireTrainer, ctrl.getAll);

// GET /api/v1/session-notes/:id - single note by ID (Admin and Trainer only)
router.get("/:id", authenticate, requireTrainer, ctrl.getById);

// POST /api/v1/session-notes - create or update a trainer note with 30-day enforcement & ownership checks
router.post("/", authenticate, requireTrainer, validate(upsertSessionNoteSchema), ctrl.upsert);

module.exports = router;
