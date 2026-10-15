"use strict";

const sessionNoteService = require("./sessionNote.service");
const { success } = require("../../shared/response");
const { ForbiddenError } = require("../../shared/apiError");

async function getAll(req, res, next) {
  try {
    const { sessionId, batchId, trainerId, date } = req.query;
    let targetTrainerId = trainerId;

    // Enforce backend security: If logged-in user is a trainer,
    // filter notes strictly using the authenticated trainer's ID.
    // Ensure trainers cannot access another trainer's notes through API requests
    // or by changing URL parameters.
    if (req.user && req.user.role === "trainer") {
      targetTrainerId = req.user.trainerId || req.user.id;
    }

    const notes = await sessionNoteService.getSessionNotes({
      sessionId,
      batchId,
      trainerId: targetTrainerId,
      date,
    });
    return success(res, notes, "Session notes retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const note = await sessionNoteService.getNoteById(req.params.id);

    // Enforce backend security: If logged-in user is a trainer,
    // ensure they can ONLY EVER view their own note!
    // Cannot access another trainer's notes even if assigned to the same class/batch.
    if (req.user && req.user.role === "trainer") {
      const loggedInTrainerId = req.user.trainerId || req.user.id;
      if (note.trainerId !== loggedInTrainerId) {
        throw new ForbiddenError(
          "Access denied. Trainers can only view their own session notes."
        );
      }
    }

    return success(res, note, "Session note retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getDailyForAdmin(req, res, next) {
  try {
    const { date, batchId } = req.query;
    const records = await sessionNoteService.getDailyNotesForAdmin({
      date,
      batchId,
    });
    return success(res, records, "Daily session notes overview retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function upsert(req, res, next) {
  try {
    const { note, isNew } = await sessionNoteService.upsertSessionNote(
      req.body,
      req.user
    );
    const msg = isNew
      ? "Coach session note submitted successfully."
      : "Coach session note updated successfully.";
    return success(res, note, msg, isNew ? 201 : 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  getDailyForAdmin,
  upsert,
};
