"use strict";

const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("../../config/env");
const { BadRequestError, InternalError } = require("../../shared/apiError");

// ── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// ── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Upload a buffer to Cloudinary using upload_stream.
 * Returns the upload result (secure_url, public_id, etc.)
 */
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

class UploadService {
  /**
   * Upload a profile photo.
   * Resizes to max 800×800, converts to WebP.
   */
  async uploadPhoto(file) {
    if (!file) {
      throw new BadRequestError("No file provided.");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.map((t) => t.split("/")[1].toUpperCase()).join(", ")}.`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError("File too large. Maximum allowed size is 5 MB.");
    }

    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: "strengthway/photos",
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (err) {
      throw new InternalError("Photo upload failed: " + err.message);
    }
  }

  /**
   * Upload a medical document (PDF or image).
   */
  async uploadDocument(file) {
    if (!file) {
      throw new BadRequestError("No file provided.");
    }

    if (!ALLOWED_DOC_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        "Invalid file type. Allowed types: PDF, JPEG, PNG, WEBP."
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError("File too large. Maximum allowed size is 5 MB.");
    }

    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: "strengthway/documents",
        resource_type: "auto", // allows PDF
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
        resourceType: result.resource_type,
      };
    } catch (err) {
      throw new InternalError("Document upload failed: " + err.message);
    }
  }

  /**
   * Delete an asset from Cloudinary by its public_id.
   */
  async deleteAsset(publicId, resourceType) {
    if (!publicId) {
      throw new BadRequestError("publicId is required.");
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType || "image",
      });
      return { publicId, result: result.result };
    } catch (err) {
      throw new InternalError("Asset deletion failed: " + err.message);
    }
  }
}

module.exports = new UploadService();
