"use strict";

const SessionNote = require("./sessionNote.model");
const Session = require("./session.model");
const Batch = require("../batches/batch.model");
const Trainer = require("../trainers/trainer.model");
const { generateSessionNoteId } = require("../../shared/idGenerator");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} = require("../../shared/apiError");
const { hasClassStarted, getLocalDateString } = require("./session.service");

class SessionNoteService {
  /**
   * Calculate elapsed days between scheduled date and today at midnight.
   *
   * @param {string} sessionDateStr YYYY-MM-DD
   * @param {Date} now
   * @returns {number}
   */
  getDaysSinceSession(sessionDateStr, now = new Date()) {
    if (!sessionDateStr) return 0;
    const [y, m, d] = sessionDateStr.slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return 0;
    const schedDate = new Date(y, m - 1, d);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((todayMidnight.getTime() - schedDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if a session date is within the 30-day editing deadline.
   *
   * @param {string} sessionDateStr
   * @param {Date} now
   * @returns {boolean}
   */
  isWithin30Days(sessionDateStr, now = new Date()) {
    const elapsedDays = this.getDaysSinceSession(sessionDateStr, now);
    return elapsedDays <= 30;
  }

  /**
   * Find notes by query filters (sessionId, batchId, trainerId, date).
   */
  async getSessionNotes({ sessionId, batchId, trainerId, date } = {}) {
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (batchId) filter.batchId = batchId;
    if (trainerId) filter.trainerId = trainerId;
    if (date) filter.sessionDate = date;

    return SessionNote.find(filter).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get single note by ID.
   */
  async getNoteById(id) {
    const note = await SessionNote.findOne({ id }).lean();
    if (!note) {
      throw new NotFoundError(`Session note "${id}" not found.`);
    }
    return note;
  }

  /**
   * Requirement 5: In Admin page, display notes for today's ongoing and completed classes.
   * Excludes upcoming classes and cancelled classes.
   *
   * @param {Object} options
   * @param {string} options.date YYYY-MM-DD
   * @param {string} options.batchId
   */
  async getDailyNotesForAdmin({ date, batchId } = {}) {
    const targetDate = date || getLocalDateString();
    const now = new Date();

    // Find sessions for this date
    const sessionFilter = { sessionDate: targetDate };
    if (batchId && batchId !== "ALL") {
      sessionFilter.batchId = batchId;
    }

    const allSessions = await Session.find(sessionFilter).sort({ startTime: 1, classNumber: 1 }).lean();

    // Filter to strictly ONGOING and COMPLETED sessions (exclude upcoming and cancelled)
    const activeSessions = allSessions.filter((s) => {
      if (s.status === "CANCELLED") return false;
      if (s.status === "COMPLETED") return true;

      // For scheduled sessions on this date, check if ongoing/started
      if (s.sessionDate === targetDate) {
        return hasClassStarted(s, now);
      }

      return s.sessionDate < targetDate;
    });

    if (activeSessions.length === 0) {
      return [];
    }

    // Collect all session IDs and batch IDs
    const sessionIds = activeSessions.map((s) => s.id);
    const batchIds = Array.from(new Set(activeSessions.map((s) => s.batchId)));

    // Fetch batches, notes, and trainers in parallel
    const [batches, notes, allTrainers] = await Promise.all([
      Batch.find({ id: { $in: batchIds } }).lean(),
      SessionNote.find({ sessionId: { $in: sessionIds } }).lean(),
      Trainer.find({}, { id: 1, name: 1, firstName: 1, lastName: 1 }).lean(),
    ]);

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const trainerNameMap = new Map(
      allTrainers.map((t) => [t.id, t.name || `${t.firstName || ""} ${t.lastName || ""}`.trim() || t.id])
    );

    // Group notes by sessionId -> trainerId
    const notesBySessionAndTrainer = new Map();
    notes.forEach((note) => {
      notesBySessionAndTrainer.set(`${note.sessionId}___${note.trainerId}`, note);
    });

    // Build the consolidated daily admin records
    const result = activeSessions.map((session) => {
      const batch = batchMap.get(session.batchId);
      const batchTrainerIds = Array.isArray(batch?.trainerIds) ? batch.trainerIds : [];

      // Assigned trainers for this session (from batch + session coach)
      const assignedIds = Array.from(
        new Set([...batchTrainerIds, session.coachId].filter(Boolean))
      );

      const assignedTrainers = assignedIds.map((tid) => {
        const note = notesBySessionAndTrainer.get(`${session.id}___${tid}`) || null;
        const isSubmitted = Boolean(note && note.status === "SUBMITTED");
        return {
          trainerId: tid,
          trainerName: trainerNameMap.get(tid) || session.coachName || tid,
          status: isSubmitted ? "Submitted" : "Notes Pending",
          note,
        };
      });

      return {
        sessionId: session.id,
        className: session.className || session.subject || `Class #${session.classNumber}`,
        classNumber: session.classNumber,
        batchId: session.batchId,
        batchName: batch?.name || session.batchName || "Assigned Batch",
        sessionDate: session.sessionDate,
        timing: session.timing || `${session.startTime} - ${session.endTime}`,
        status: session.status,
        assignedTrainers,
      };
    });

    return result;
  }

  /**
   * Requirements 3, 4, 6, 7, 8, 9, 10:
   * Create or update a session note for a specific trainer and scheduled class.
   *
   * @param {Object} data
   * @param {Object} currentUser Authenticated user payload { id, email, role, name, trainerId }
   */
  async upsertSessionNote(data, currentUser) {
    const {
      sessionId,
      trainerId,
      sessionSummary,
      memberPerformance,
      observations,
      followUpRequired,
    } = data;

    if (!sessionId) {
      throw new BadRequestError("Session ID is required.");
    }
    if (!trainerId) {
      throw new BadRequestError("Trainer ID is required.");
    }
    if (!sessionSummary || sessionSummary.trim() === "") {
      throw new BadRequestError("Session summary is required.");
    }

    // 1. Check session existence
    const session = await Session.findOne({ id: sessionId }).lean();
    if (!session) {
      throw new NotFoundError(`Scheduled class session "${sessionId}" not found.`);
    }

    // 2. Class status checks (Requirement 5 & 10)
    if (session.status === "CANCELLED") {
      throw new BadRequestError("Cannot submit session notes for cancelled classes.");
    }

    const now = new Date();
    const todayLocal = getLocalDateString(now);

    // 3. User Ownership & Authorization checks (Requirements 3 & 7)
    const isAdmin = currentUser.role === "admin";
    const isTrainer = currentUser.role === "trainer";

    if (!isAdmin && !isTrainer) {
      throw new ForbiddenError("Only trainers and admins can add or edit session notes.");
    }

    if (isTrainer) {
      // Check trainerId match
      const loggedInTrainerId = currentUser.trainerId || currentUser.id;
      if (loggedInTrainerId !== trainerId) {
        throw new ForbiddenError(
          "Access denied. Trainers cannot add or edit notes for classes assigned to other trainers."
        );
      }

      // Check if session has started
      const isFutureDate = session.sessionDate > todayLocal;
      const isFutureTimeToday = session.sessionDate === todayLocal && !hasClassStarted(session, now);
      if (isFutureDate || isFutureTimeToday) {
        throw new BadRequestError(
          "Cannot submit session notes for future upcoming classes before they start."
        );
      }

      // Requirement 6: 30-Day Edit Lock
      const daysElapsed = this.getDaysSinceSession(session.sessionDate, now);
      if (daysElapsed > 30) {
        throw new ForbiddenError(
          "Editing deadline expired. Trainer session notes can only be created or edited within 30 days of the scheduled class date."
        );
      }

      // Verify trainer is assigned to batch or session
      const batch = await Batch.findOne({ id: session.batchId }).lean();
      const isAssignedToBatch = Array.isArray(batch?.trainerIds) && batch.trainerIds.includes(trainerId);
      const isAssignedToSession = session.coachId === trainerId;

      if (!isAssignedToBatch && !isAssignedToSession) {
        throw new ForbiddenError("You are not an assigned faculty coach for this class or batch.");
      }
    }

    // Resolve trainer name
    let resolvedTrainerName = data.trainerName || "";
    if (!resolvedTrainerName) {
      const trn = await Trainer.findOne({ id: trainerId }).lean();
      resolvedTrainerName = trn?.name || `${trn?.firstName || ""} ${trn?.lastName || ""}`.trim() || trainerId;
    }

    // Resolve batch name
    let resolvedBatchName = session.batchName || "";
    if (!resolvedBatchName) {
      const batch = await Batch.findOne({ id: session.batchId }).lean();
      resolvedBatchName = batch?.name || session.batchId;
    }

    // 4. Find existing note or create new one
    let note = await SessionNote.findOne({ sessionId, trainerId });

    if (note) {
      // Update existing note
      note.sessionSummary = sessionSummary.trim();
      note.memberPerformance = typeof memberPerformance === "string" ? memberPerformance.trim() : "";
      note.observations = typeof observations === "string" ? observations.trim() : "";
      note.followUpRequired = Boolean(followUpRequired);
      note.status = "SUBMITTED";
      note.lastUpdatedBy = currentUser.name || currentUser.email || currentUser.id;
      note.lastUpdatedRole = currentUser.role;

      await note.save();
      return { note: note.toObject(), isNew: false };
    }

    // Create new note
    const newNote = new SessionNote({
      id: generateSessionNoteId(),
      sessionId: session.id,
      batchId: session.batchId,
      batchName: resolvedBatchName,
      className: session.className || session.subject || `Class #${session.classNumber}`,
      classNumber: session.classNumber || 1,
      sessionDate: session.sessionDate,
      timing: session.timing || `${session.startTime} - ${session.endTime}`,
      trainerId,
      trainerName: resolvedTrainerName,
      sessionSummary: sessionSummary.trim(),
      memberPerformance: typeof memberPerformance === "string" ? memberPerformance.trim() : "",
      observations: typeof observations === "string" ? observations.trim() : "",
      followUpRequired: Boolean(followUpRequired),
      status: "SUBMITTED",
      submittedAt: new Date(),
      lastUpdatedBy: currentUser.name || currentUser.email || currentUser.id,
      lastUpdatedRole: currentUser.role,
    });

    await newNote.save();
    return { note: newNote.toObject(), isNew: true };
  }
}

module.exports = new SessionNoteService();
