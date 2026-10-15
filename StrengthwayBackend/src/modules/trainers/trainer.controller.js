"use strict";

const trainerService = require("./trainer.service");
const { success, created, paginated } = require("../../shared/response");
const { parsePaginationParams, buildPaginationResult } = require("../../shared/pagination");

async function getAll(req, res, next) {
  try {
    const { page, pageSize, skip } = parsePaginationParams(req.query);
    const { status, search, includeDeleted } = req.query;

    const { data, total } = await trainerService.getAll({
      page,
      pageSize,
      skip,
      status,
      search: search?.trim() || "",
      includeDeleted: includeDeleted === "true" || includeDeleted === true,
      scopedTrainerIds: req.scopedTrainerIds ?? null,
    });

    return paginated(
      res,
      {
        data,
        ...buildPaginationResult(total, page, pageSize),
      },
      "Coaches retrieved successfully."
    );
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const trainer = await trainerService.getById(req.params.id);
    return success(res, trainer, "Coach retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const trainer = await trainerService.create(req.body);
    return created(res, trainer, "Coach added successfully.");
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const trainer = await trainerService.update(req.params.id, req.body);
    return success(res, trainer, "Coach updated successfully.");
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await trainerService.delete(req.params.id);
    return success(res, result, "Coach permanently deleted.");
  } catch (err) {
    next(err);
  }
}

async function softDelete(req, res, next) {
  try {
    const trainer = await trainerService.softDelete(req.params.id);
    return success(res, trainer, "Coach deactivated successfully.");
  } catch (err) {
    next(err);
  }
}

async function restore(req, res, next) {
  try {
    const trainer = await trainerService.restore(req.params.id);
    return success(res, trainer, "Coach restored successfully.");
  } catch (err) {
    next(err);
  }
}

async function toggleStatus(req, res, next) {
  try {
    const trainer = await trainerService.toggleStatus(req.params.id);
    return success(res, trainer, `Coach status changed to ${trainer.status}.`);
  } catch (err) {
    next(err);
  }
}

async function syncBatches(req, res, next) {
  try {
    const { batchIds } = req.body;
    const trainer = await trainerService.syncBatches(req.params.id, batchIds);
    return success(res, trainer, "Coach batch assignments updated successfully.");
  } catch (err) {
    next(err);
  }
}

async function getMonthTracking(req, res, next) {
  try {
    const { month } = req.query;
    const tracking = await trainerService.getTrainerMonthTracking(req.params.id, month);
    return success(res, tracking, "Coach month tracking retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  softDelete,
  restore,
  toggleStatus,
  syncBatches,
  getMonthTracking,
};

