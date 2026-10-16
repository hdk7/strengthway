"use strict";

const Enrollment = require("./enrollment.model");

class EnrollmentRepository {
  async findById(id) {
    return Enrollment.findOne({ id, isDeleted: false });
  }

  async findByInquiryId(inquiryId) {
    return Enrollment.find({ inquiryId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findActiveByInquiryId(inquiryId) {
    return Enrollment.findOne({
      inquiryId,
      isDeleted: false,
      status: { $nin: ["Cancelled", "Converted"] },
    });
  }

  async findByOrderId(orderId) {
    return Enrollment.findOne({
      "invoice.gatewayOrderId": orderId,
      isDeleted: false,
    });
  }

  async findByPaymentLinkId(linkId) {
    return Enrollment.findOne({
      "invoice.paymentLink.linkId": linkId,
      isDeleted: false,
    });
  }

  async findByInvoiceNumber(invoiceNumber) {
    return Enrollment.findOne({
      "invoice.invoiceNumber": invoiceNumber,
      isDeleted: false,
    });
  }

  async findOne(filter) {
    return Enrollment.findOne({ ...filter, isDeleted: false });
  }

  async create(data) {
    return Enrollment.create(data);
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

    return Enrollment.findOneAndUpdate({ id }, mongoUpdate, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async appendAuditLog(id, logEntry) {
    return Enrollment.findOneAndUpdate(
      { id },
      { $push: { auditLogs: logEntry } },
      { returnDocument: "after" }
    );
  }

  async findAll({ filter = {}, sort = { createdAt: -1 }, skip = 0, limit = 50 } = {}) {
    return Enrollment.find(filter).sort(sort).skip(skip).limit(limit);
  }

  async count(filter = {}) {
    return Enrollment.countDocuments(filter);
  }

  async getMaxIdSuffix(year = new Date().getFullYear()) {
    const prefix = `ENR-${year}-`;
    const regex = new RegExp(`^${prefix}(\\d+)$`);
    const doc = await Enrollment.findOne({ id: { $regex: regex } })
      .sort({ id: -1 })
      .select("id")
      .lean();

    if (!doc) return 0;
    const match = doc.id.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getMaxInvoiceSuffix(year = new Date().getFullYear()) {
    const prefix = `INV-${year}-`;
    const regex = new RegExp(`^${prefix}(\\d+)$`);
    const doc = await Enrollment.findOne({ "invoice.invoiceNumber": { $regex: regex } })
      .sort({ "invoice.invoiceNumber": -1 })
      .select("invoice.invoiceNumber")
      .lean();

    if (!doc || !doc.invoice?.invoiceNumber) return 0;
    const match = doc.invoice.invoiceNumber.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  }
}

module.exports = new EnrollmentRepository();
