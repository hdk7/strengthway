"use strict";

const portfolioRepo = require("./portfolio.repository");
const { NotFoundError, BadRequestError, ConflictError } = require("../../shared/apiError");
const {
  PORTFOLIO_CATEGORY,
  PORTFOLIO_STATUS,
  PORTFOLIO_ASPECT_RATIO,
  PORTFOLIO_MEDIA_TYPE,
  PAGINATION,
} = require("../../shared/constants");
const { generatePortfolioId } = require("../../shared/idGenerator");

class PortfolioService {
  /**
   * Admin paginated query with category, status, search, and deleted filters.
   */
  async getAll({
    category,
    status,
    search,
    includeDeleted = false,
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = {}) {
    const filter = {};

    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { authorName: regex },
        { quote: regex },
        { altText: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(
      PAGINATION.MAX_PAGE_SIZE,
      Math.max(1, parseInt(pageSize, 10) || PAGINATION.DEFAULT_PAGE_SIZE)
    );
    const skipNum = (pageNum - 1) * limitNum;

    const [items, totalCount, allItems] = await Promise.all([
      portfolioRepo.findAll({
        filter,
        sort: { displayOrder: 1, createdAt: -1 },
        skip: skipNum,
        limit: limitNum,
      }),
      portfolioRepo.count(filter),
      // Query stats across active/draft/archived
      portfolioRepo.findAll({ filter: { isDeleted: false } }),
    ]);

    // Compute high-level stats for admin toolbar/KPIs
    const stats = {
      total: allItems.length,
      active: allItems.filter((i) => i.status === PORTFOLIO_STATUS.ACTIVE).length,
      draft: allItems.filter((i) => i.status === PORTFOLIO_STATUS.DRAFT).length,
      photos: allItems.filter((i) => i.category === PORTFOLIO_CATEGORY.PHOTO).length,
      movementVideos: allItems.filter((i) => i.category === PORTFOLIO_CATEGORY.MOVEMENT_VIDEO).length,
      sessionClips: allItems.filter((i) => i.category === PORTFOLIO_CATEGORY.SESSION_CLIP).length,
      feedbackStories: allItems.filter((i) => i.category === PORTFOLIO_CATEGORY.FEEDBACK_STORY).length,
      sessionDisciplines: allItems.filter((i) => i.category === PORTFOLIO_CATEGORY.SESSION_DISCIPLINE).length,
    };

    return {
      items,
      pagination: {
        page: pageNum,
        pageSize: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
      stats,
    };
  }

  /**
   * Public grouped portfolio response for fast rendering of all portfolio sections.
   */
  async getPublic() {
    const filter = {
      isDeleted: false,
      status: PORTFOLIO_STATUS.ACTIVE,
    };

    const items = await portfolioRepo.findAll({
      filter,
      sort: { displayOrder: 1, createdAt: -1 },
    });

    const photos = items.filter((i) => i.category === PORTFOLIO_CATEGORY.PHOTO);
    const movementVideos = items.filter((i) => i.category === PORTFOLIO_CATEGORY.MOVEMENT_VIDEO);
    const sessionClips = items.filter((i) => i.category === PORTFOLIO_CATEGORY.SESSION_CLIP);
    const sessionDisciplines = items.filter((i) => i.category === PORTFOLIO_CATEGORY.SESSION_DISCIPLINE);
    const feedbackStories = items.filter((i) => i.category === PORTFOLIO_CATEGORY.FEEDBACK_STORY);

    const homepagePhotos = photos.filter((p) => p.featuredOnHome);

    return {
      photos,
      movementVideos,
      sessionClips,
      sessionDisciplines,
      feedbackStories,
      homepagePhotos: homepagePhotos.length > 0 ? homepagePhotos : photos.slice(0, 8),
      totalActive: items.length,
    };
  }

  async getById(id) {
    const item = await portfolioRepo.findById(id);
    if (!item) {
      throw new NotFoundError(`Portfolio item "${id}" not found.`);
    }
    return item;
  }

  async create(body) {
    let id = body.id;
    if (!id) {
      const count = await portfolioRepo.countAll();
      id = generatePortfolioId(count);
    }

    const existing = await portfolioRepo.findById(id);
    if (existing) {
      throw new ConflictError(`Portfolio item with ID "${id}" already exists.`);
    }

    // Determine default aspect ratio based on category if omitted
    let aspectRatio = body.aspectRatio;
    if (!aspectRatio) {
      if (body.category === PORTFOLIO_CATEGORY.PHOTO) {
        aspectRatio = PORTFOLIO_ASPECT_RATIO.FOUR_BY_FIVE;
      } else if (body.category === PORTFOLIO_CATEGORY.MOVEMENT_VIDEO) {
        aspectRatio = PORTFOLIO_ASPECT_RATIO.SIXTEEN_BY_NINE;
      } else if (
        body.category === PORTFOLIO_CATEGORY.SESSION_CLIP ||
        body.category === PORTFOLIO_CATEGORY.FEEDBACK_STORY
      ) {
        aspectRatio = PORTFOLIO_ASPECT_RATIO.NINE_BY_SIXTEEN;
      } else {
        aspectRatio = PORTFOLIO_ASPECT_RATIO.ONE_BY_ONE;
      }
    }

    // Determine default media type
    let mediaType = body.mediaType;
    if (!mediaType) {
      if (
        body.category === PORTFOLIO_CATEGORY.MOVEMENT_VIDEO ||
        body.category === PORTFOLIO_CATEGORY.SESSION_CLIP ||
        body.category === PORTFOLIO_CATEGORY.FEEDBACK_STORY
      ) {
        mediaType = PORTFOLIO_MEDIA_TYPE.VIDEO;
      } else {
        mediaType = PORTFOLIO_MEDIA_TYPE.IMAGE;
      }
    }

    // Determine display order if not specified
    let displayOrder = body.displayOrder;
    if (displayOrder === undefined || displayOrder === null) {
      const maxOrder = await portfolioRepo.getMaxOrder(body.category);
      displayOrder = maxOrder + 1;
    }

    const payload = {
      id,
      category: body.category,
      title: body.title,
      description: body.description || "",
      mediaUrl: body.mediaUrl,
      thumbnailUrl: body.thumbnailUrl || "",
      aspectRatio,
      mediaType,
      altText: body.altText || body.title,
      featuredOnHome: Boolean(body.featuredOnHome),
      authorName: body.authorName || "",
      authorRole: body.authorRole || "",
      quote: body.quote || "",
      rating: body.rating !== undefined ? Number(body.rating) : 5,
      durationText: body.durationText || "",
      level: body.level || "",
      iconKey: body.iconKey || "",
      displayOrder: Number(displayOrder),
      status: body.status || PORTFOLIO_STATUS.ACTIVE,
      isDeleted: false,
      deletedAt: null,
    };

    return portfolioRepo.create(payload);
  }

  async update(id, body) {
    await this.getById(id);

    const updates = { ...body };
    delete updates.id;
    delete updates._id;

    if (updates.displayOrder !== undefined) {
      updates.displayOrder = Number(updates.displayOrder);
    }
    if (updates.rating !== undefined) {
      updates.rating = Number(updates.rating);
    }
    if (updates.featuredOnHome !== undefined) {
      updates.featuredOnHome = Boolean(updates.featuredOnHome);
    }

    const updated = await portfolioRepo.updateById(id, updates);
    if (!updated) {
      throw new NotFoundError(`Portfolio item "${id}" not found.`);
    }
    return updated;
  }

  async toggleStatus(id) {
    const item = await this.getById(id);
    const newStatus =
      item.status === PORTFOLIO_STATUS.ACTIVE
        ? PORTFOLIO_STATUS.DRAFT
        : PORTFOLIO_STATUS.ACTIVE;

    return portfolioRepo.updateById(id, { status: newStatus });
  }

  async reorder(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError("Items array is required for reordering.");
    }
    await portfolioRepo.bulkReorder(items);
    return { reorderedCount: items.length };
  }

  async softDelete(id) {
    await this.getById(id);
    const item = await portfolioRepo.softDelete(id);
    if (!item) {
      throw new NotFoundError(`Portfolio item "${id}" not found.`);
    }
    return item;
  }

  async restore(id) {
    const item = await portfolioRepo.restore(id);
    if (!item) {
      throw new NotFoundError(`Portfolio item "${id}" not found.`);
    }
    return item;
  }

  async permanentDelete(id) {
    const item = await portfolioRepo.deleteById(id);
    if (!item) {
      throw new NotFoundError(`Portfolio item "${id}" not found.`);
    }
    return item;
  }
}

module.exports = new PortfolioService();
