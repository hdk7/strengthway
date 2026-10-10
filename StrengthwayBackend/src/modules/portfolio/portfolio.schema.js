"use strict";

const yup = require("yup");
const {
  PORTFOLIO_CATEGORY,
  PORTFOLIO_STATUS,
  PORTFOLIO_ASPECT_RATIO,
  PORTFOLIO_MEDIA_TYPE,
} = require("../../shared/constants");

const createPortfolioItemSchema = yup.object().shape({
  id: yup.string().trim().nullable(),
  category: yup
    .string()
    .trim()
    .required("Category is required.")
    .oneOf(Object.values(PORTFOLIO_CATEGORY), "Invalid portfolio category."),
  title: yup.string().trim().required("Title is required.").min(2, "Title must be at least 2 characters."),
  description: yup.string().trim().nullable(),
  mediaUrl: yup.string().trim().required("Media URL is required."),
  thumbnailUrl: yup.string().trim().nullable(),
  aspectRatio: yup
    .string()
    .trim()
    .oneOf(Object.values(PORTFOLIO_ASPECT_RATIO), "Invalid aspect ratio.")
    .nullable(),
  mediaType: yup
    .string()
    .trim()
    .oneOf(Object.values(PORTFOLIO_MEDIA_TYPE), "Invalid media type.")
    .nullable(),
  altText: yup.string().trim().nullable(),
  featuredOnHome: yup.boolean().nullable(),
  authorName: yup.string().trim().nullable(),
  authorRole: yup.string().trim().nullable(),
  quote: yup.string().trim().nullable(),
  rating: yup.number().min(1).max(5).nullable(),
  durationText: yup.string().trim().nullable(),
  level: yup.string().trim().nullable(),
  iconKey: yup.string().trim().nullable(),
  displayOrder: yup.number().integer().min(0).nullable(),
  status: yup
    .string()
    .oneOf(Object.values(PORTFOLIO_STATUS), "Invalid status.")
    .nullable(),
});

const updatePortfolioItemSchema = yup.object().shape({
  category: yup
    .string()
    .trim()
    .oneOf(Object.values(PORTFOLIO_CATEGORY), "Invalid portfolio category.")
    .nullable(),
  title: yup.string().trim().min(2, "Title must be at least 2 characters.").nullable(),
  description: yup.string().trim().nullable(),
  mediaUrl: yup.string().trim().nullable(),
  thumbnailUrl: yup.string().trim().nullable(),
  aspectRatio: yup
    .string()
    .trim()
    .oneOf(Object.values(PORTFOLIO_ASPECT_RATIO), "Invalid aspect ratio.")
    .nullable(),
  mediaType: yup
    .string()
    .trim()
    .oneOf(Object.values(PORTFOLIO_MEDIA_TYPE), "Invalid media type.")
    .nullable(),
  altText: yup.string().trim().nullable(),
  featuredOnHome: yup.boolean().nullable(),
  authorName: yup.string().trim().nullable(),
  authorRole: yup.string().trim().nullable(),
  quote: yup.string().trim().nullable(),
  rating: yup.number().min(1).max(5).nullable(),
  durationText: yup.string().trim().nullable(),
  level: yup.string().trim().nullable(),
  iconKey: yup.string().trim().nullable(),
  displayOrder: yup.number().integer().min(0).nullable(),
  status: yup
    .string()
    .oneOf(Object.values(PORTFOLIO_STATUS), "Invalid status.")
    .nullable(),
});

const reorderPortfolioSchema = yup.object().shape({
  items: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().trim().required("Item ID is required."),
        displayOrder: yup.number().integer().min(0).required("Display order is required."),
      })
    )
    .required("Items array is required.")
    .min(1, "Items array must contain at least one item."),
});

module.exports = {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  reorderPortfolioSchema,
};
