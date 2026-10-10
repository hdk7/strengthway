"use strict";

const portfolioService = require("./portfolio.service");
const { success, created } = require("../../shared/response");

async function getAll(req, res, next) {
  try {
    const { category, status, search, includeDeleted, page, pageSize } = req.query;
    const result = await portfolioService.getAll({
      category,
      status,
      search,
      includeDeleted: includeDeleted === "true",
      page,
      pageSize,
    });
    return success(res, result, "Portfolio items retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getPublic(req, res, next) {
  try {
    const result = await portfolioService.getPublic();
    return success(res, result, "Public portfolio data retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const item = await portfolioService.getById(req.params.id);
    return success(res, item, "Portfolio item retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const item = await portfolioService.create(req.body);
    return created(res, item, "Portfolio item created successfully.");
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await portfolioService.update(req.params.id, req.body);
    return success(res, item, "Portfolio item updated successfully.");
  } catch (err) {
    next(err);
  }
}

async function toggleStatus(req, res, next) {
  try {
    const item = await portfolioService.toggleStatus(req.params.id);
    return success(res, item, `Portfolio item status updated to ${item.status}.`);
  } catch (err) {
    next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const result = await portfolioService.reorder(req.body.items);
    return success(res, result, "Portfolio items reordered successfully.");
  } catch (err) {
    next(err);
  }
}

async function softDelete(req, res, next) {
  try {
    const item = await portfolioService.softDelete(req.params.id);
    return success(res, item, "Portfolio item archived successfully.");
  } catch (err) {
    next(err);
  }
}

async function restore(req, res, next) {
  try {
    const item = await portfolioService.restore(req.params.id);
    return success(res, item, "Portfolio item restored successfully.");
  } catch (err) {
    next(err);
  }
}

async function permanentDelete(req, res, next) {
  try {
    const item = await portfolioService.permanentDelete(req.params.id);
    return success(res, item, "Portfolio item permanently deleted.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getPublic,
  getById,
  create,
  update,
  toggleStatus,
  reorder,
  softDelete,
  restore,
  permanentDelete,
};
