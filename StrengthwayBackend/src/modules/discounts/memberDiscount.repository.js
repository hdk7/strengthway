"use strict";

const MemberDiscount = require("./memberDiscount.model");
const { MEMBER_DISCOUNT_STATUS } = require("../../shared/constants");

class MemberDiscountRepository {
  async findById(id) {
    return MemberDiscount.findOne({ id, isDeleted: false });
  }

  async findByMemberId(memberId, options = {}) {
    const filter = { memberId, isDeleted: false };
    if (options.status) {
      filter.status = options.status;
    }
    return MemberDiscount.find(filter).sort({ createdAt: -1 });
  }

  async findActiveByMemberIdAndPlan(memberId, planId) {
    const now = new Date();
    return MemberDiscount.findOne({
      memberId,
      planId,
      isDeleted: false,
      status: {
        $in: [
          MEMBER_DISCOUNT_STATUS.ASSIGNED,
          MEMBER_DISCOUNT_STATUS.NOTIFIED,
          MEMBER_DISCOUNT_STATUS.PAYMENT_PENDING,
        ],
      },
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
    });
  }

  async findAnyActiveForMember(memberId) {
    const now = new Date();
    return MemberDiscount.find({
      memberId,
      isDeleted: false,
      status: {
        $in: [
          MEMBER_DISCOUNT_STATUS.ASSIGNED,
          MEMBER_DISCOUNT_STATUS.NOTIFIED,
          MEMBER_DISCOUNT_STATUS.PAYMENT_PENDING,
        ],
      },
      $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
    }).sort({ createdAt: -1 });
  }

  async create(data) {
    return MemberDiscount.create(data);
  }

  async createMany(dataArray) {
    return MemberDiscount.insertMany(dataArray);
  }

  async updateById(id, updates) {
    const mongoUpdate = {};
    const setFields = {};

    for (const [key, value] of Object.entries(updates)) {
      if (key.startsWith("$")) {
        mongoUpdate[key] = value;
      } else {
        setFields[key] = value;
      }
    }

    if (Object.keys(setFields).length > 0) {
      mongoUpdate.$set = { ...(mongoUpdate.$set || {}), ...setFields };
    }

    return MemberDiscount.findOneAndUpdate({ id }, mongoUpdate, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async appendAuditLog(id, logEntry) {
    return MemberDiscount.findOneAndUpdate(
      { id },
      { $push: { auditLogs: logEntry } },
      { returnDocument: "after" }
    );
  }

  async findAll({ filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 50 } = {}) {
    return MemberDiscount.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return MemberDiscount.countDocuments({ ...filter, isDeleted: false });
  }

  async getMaxIdSuffix(year = new Date().getFullYear()) {
    const prefixRegex = new RegExp(`^DSC-${year}-(\\d{4})$`);
    const discounts = await MemberDiscount.find(
      { id: { $regex: prefixRegex } },
      { id: 1 }
    ).lean();

    if (!discounts || discounts.length === 0) {
      return 0;
    }

    let maxSuffix = 0;
    for (const d of discounts) {
      const match = d.id?.match(prefixRegex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSuffix) maxSuffix = num;
      }
    }
    return maxSuffix;
  }
}

module.exports = new MemberDiscountRepository();
