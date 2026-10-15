"use strict";

const notificationService = require("./notification.service");
const { success } = require("../../shared/response");

async function getNotifications(req, res, next) {
  try {
    const data = await notificationService.getNotifications(req.user, req.query);
    return success(res, data, "Notifications retrieved successfully.");
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user);
    return success(res, notification, "Notification marked as read.");
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user);
    return success(res, result, "All notifications marked as read.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
