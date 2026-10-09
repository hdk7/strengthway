"use strict";

const uploadService = require("./upload.service");
const { success } = require("../../shared/response");

/**
 * POST /api/v1/uploads/photo
 * Uploads a profile photo to Cloudinary.
 * Expects multipart/form-data with field name "photo".
 * Returns: { url, publicId, format, width, height, bytes }
 */
async function uploadPhoto(req, res, next) {
  try {
    const result = await uploadService.uploadPhoto(req.file);
    return success(res, result, "Photo uploaded successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/uploads/document
 * Uploads a medical document (PDF or image) to Cloudinary.
 * Expects multipart/form-data with field name "document".
 * Returns: { url, publicId, format, bytes, resourceType }
 */
async function uploadDocument(req, res, next) {
  try {
    const result = await uploadService.uploadDocument(req.file);
    return success(res, result, "Document uploaded successfully.");
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/uploads/:publicId
 * Deletes an asset from Cloudinary.
 * Query param: ?type=image|raw  (default: image)
 */
async function deleteAsset(req, res, next) {
  try {
    // publicId may contain slashes (e.g. "strengthway/photos/abc123")
    // Express 5 wildcard /*path provides req.params.path
    const publicId = decodeURIComponent(req.params.path || req.params[0] || req.params.publicId || "");
    const resourceType = req.query.type || "image";
    const result = await uploadService.deleteAsset(publicId, resourceType);
    return success(res, result, "Asset deleted successfully.");
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadPhoto, uploadDocument, deleteAsset };
