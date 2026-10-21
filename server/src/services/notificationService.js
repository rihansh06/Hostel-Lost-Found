const Notification = require('../models/Notification');
const socketService = require('./socketService');

/**
 * Creates a notification in the database and emits it in real-time via Socket.io
 */
const createAndEmitNotification = async ({ userId, type, message, link = '' }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      message,
      link,
      read: false,
    });

    // Real-time delivery to user's private socket room
    socketService.emitToUser(userId, 'notification', {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.warn(`[NotificationService] Failed to create notification for user ${userId}:`, err.message);
    return null;
  }
};

const getUserNotifications = async (userId, limit = 30) => {
  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
  return { message: 'All notifications marked as read' };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ user: userId, read: false });
  return { count };
};

module.exports = {
  createAndEmitNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
