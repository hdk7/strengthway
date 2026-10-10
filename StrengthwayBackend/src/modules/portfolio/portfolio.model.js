"use strict";

const mongoose = require("mongoose");
const {
  PORTFOLIO_CATEGORY,
  PORTFOLIO_STATUS,
  PORTFOLIO_ASPECT_RATIO,
  PORTFOLIO_MEDIA_TYPE,
} = require("../../shared/constants");

const portfolioItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(PORTFOLIO_CATEGORY),
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
      trim: true,
    },
    aspectRatio: {
      type: String,
      enum: Object.values(PORTFOLIO_ASPECT_RATIO),
      default: PORTFOLIO_ASPECT_RATIO.FOUR_BY_FIVE,
    },
    mediaType: {
      type: String,
      enum: Object.values(PORTFOLIO_MEDIA_TYPE),
      default: PORTFOLIO_MEDIA_TYPE.IMAGE,
    },
    altText: {
      type: String,
      default: "",
      trim: true,
    },
    featuredOnHome: {
      type: Boolean,
      default: false,
      index: true,
    },
    authorName: {
      type: String,
      default: "",
      trim: true,
    },
    authorRole: {
      type: String,
      default: "",
      trim: true,
    },
    quote: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    durationText: {
      type: String,
      default: "",
      trim: true,
    },
    level: {
      type: String,
      default: "",
      trim: true,
    },
    iconKey: {
      type: String,
      default: "",
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PORTFOLIO_STATUS),
      default: PORTFOLIO_STATUS.ACTIVE,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Composite indexes for common query patterns
portfolioItemSchema.index({ category: 1, isDeleted: 1, status: 1, displayOrder: 1 });
portfolioItemSchema.index({ featuredOnHome: 1, isDeleted: 1, status: 1, displayOrder: 1 });

const PortfolioItem = mongoose.model("PortfolioItem", portfolioItemSchema);

module.exports = PortfolioItem;
