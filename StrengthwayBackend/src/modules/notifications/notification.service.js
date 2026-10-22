"use strict";

const Notification = require("./notification.model");
const { generateNotificationId } = require("../../shared/idGenerator");
const { NotFoundError } = require("../../shared/apiError");

class NotificationService {
  /**
   * Creates and persists a new notification.
   */
  async createNotification(payload) {
    const id = generateNotificationId();
    const notification = await Notification.create({
      id,
      recipientId: payload.recipientId || null,
      recipientRole: payload.recipientRole || "all",
      title: payload.title || "Notification",
      message: payload.message || "",
      type: payload.type || "GENERAL",
      isRead: false,
      data: payload.data || {},
    });
    return notification.toObject();
  }

  /**
   * Retrieves notifications for the current authenticated user.
   */
  async getNotifications(user, query = {}) {
    const filter = { $or: [] };

    // Targeted directly at this user / trainer ID / member ID
    if (user?.trainerId) {
      filter.$or.push({ recipientId: user.trainerId });
    }
    if (user?.memberId) {
      filter.$or.push({ recipientId: user.memberId });
    }
    if (user?.id) {
      filter.$or.push({ recipientId: user.id });
    }

    // Role-based broadcast
    if (user?.role) {
      filter.$or.push({ recipientRole: user.role });
    }
    filter.$or.push({ recipientRole: "all" });

    if (query.unreadOnly === "true" || query.unreadOnly === true) {
      filter.isRead = false;
    }

    const limit = Math.min(Number(query.limit) || 30, 100);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id, user) {
    const notification = await Notification.findOneAndUpdate(
      { id },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) {
      throw new NotFoundError(`Notification with ID "${id}" was not found.`);
    }

    return notification;
  }

  /**
   * Marks all eligible notifications as read for current user.
   */
  async markAllAsRead(user) {
    const filter = { $or: [] };
    if (user?.trainerId) filter.$or.push({ recipientId: user.trainerId });
    if (user?.memberId) filter.$or.push({ recipientId: user.memberId });
    if (user?.id) filter.$or.push({ recipientId: user.id });
    if (user?.role) filter.$or.push({ recipientRole: user.role });
    filter.$or.push({ recipientRole: "all" });

    await Notification.updateMany({ ...filter, isRead: false }, { $set: { isRead: true } });
    return { success: true };
  }
}

module.exports = new NotificationService();
