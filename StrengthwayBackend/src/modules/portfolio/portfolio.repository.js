"use strict";

const PortfolioItem = require("./portfolio.model");

class PortfolioRepository {
  async findAll({ filter = {}, sort = { displayOrder: 1, createdAt: -1 }, skip = 0, limit = 0 } = {}) {
    const query = PortfolioItem.find(filter).sort(sort);
    if (skip > 0) query.skip(skip);
    if (limit > 0) query.limit(limit);
    return query.lean();
  }

  async count(filter = {}) {
    return PortfolioItem.countDocuments(filter);
  }

  async findById(id) {
    return PortfolioItem.findOne({ id }).lean();
  }

  async getMaxOrder(category) {
    const filter = { isDeleted: false };
    if (category) filter.category = category;
    const item = await PortfolioItem.findOne(filter).sort({ displayOrder: -1 }).select("displayOrder").lean();
    return item ? item.displayOrder : 0;
  }

  async countAll() {
    return PortfolioItem.countDocuments();
  }

  async create(data) {
    const item = new PortfolioItem(data);
    return (await item.save()).toObject();
  }

  async updateById(id, updates) {
    return PortfolioItem.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after", runValidators: false, lean: true }
    );
  }

  async softDelete(id) {
    return PortfolioItem.findOneAndUpdate(
      { id },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after", lean: true }
    );
  }

  async restore(id) {
    return PortfolioItem.findOneAndUpdate(
      { id },
      { $set: { isDeleted: false, deletedAt: null, updatedAt: new Date() } },
      { returnDocument: "after", lean: true }
    );
  }

  async deleteById(id) {
    return PortfolioItem.findOneAndDelete({ id });
  }

  async bulkReorder(items) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const operations = items.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { id },
        update: { $set: { displayOrder: Number(displayOrder), updatedAt: new Date() } },
      },
    }));

    return PortfolioItem.bulkWrite(operations);
  }
}

module.exports = new PortfolioRepository();
