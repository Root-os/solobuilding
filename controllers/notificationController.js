const Notification = require("../models/notification");
const NotificationType = require("../models/notificationType");
const User = require("../models/user");
const Tenant = require("../models/tenant");

// Create notification for a specific user or tenant
const createNotificationForUser = async (req, res) => {
  try {
    const { receiverId, receiver_type, senderId, title, body, type_id } = req.body;

    let receiver;
    if (receiver_type === "staff") {
      receiver = await User.findByPk(receiverId);
    } else if (receiver_type === "tenant") {
      receiver = await Tenant.findByPk(receiverId);
    } else {
      return res.status(400).json({ message: "Invalid receiver type." });
    }

    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const notification = await Notification.create({
      senderId,
      receiverId,
      receiver_type,
      title,
      body,
      notificationTypeId: type_id,
    });

    return res.status(201).json({ status: "success", message: "Notification created successfully", notification });
  } catch (error) {
    console.error("Error creating notification for user:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Create notification for all tenants or employees
const createNotificationForGroup = async (req, res) => {
  try {
    const { title, body, type_id, receiver_type, senderId } = req.body;
    if (!title || !body || !type_id || !receiver_type) {
      return res.status(400).json({ message: "Title, body, type_id, and receiver_type are required." });
    }

    let receivers;
    if (receiver_type === "staff") {
      receivers = await User.findAll({ attributes: ["id"] });
    } else if (receiver_type === "tenant") {
      receivers = await Tenant.findAll({ attributes: ["id"] });
    } else {
      return res.status(400).json({ message: "Invalid receiver type." });
    }

    await Promise.all(receivers.map(async (receiver) => {
      try {
        await Notification.create({
          senderId,
          receiverId: receiver.id,
          receiver_type,
          title,
          body,
          notificationTypeId: type_id,
        });
      } catch (error) {
        console.error(`Failed to create notification for receiver ${receiver.id}:`, error.message);
      }
    }));

    return res.status(201).json({ status: "success", message: `Notifications sent to all ${receiver_type}s.` });
  } catch (error) {
    console.error("Error sending group notifications:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// Update notification
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, type_id, isRead } = req.body;

    const notification = await Notification.findByPk(id);
    if (!notification) return res.status(404).json({ message: "Notification not found." });

    Object.assign(notification, { title, body, notificationTypeId: type_id, isRead });
    await notification.save();

    return res.status(200).json({ message: "Notification updated successfully.", notification });
  } catch (error) {
    console.error("Error updating notification:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// Fetch notification by ID with associations
const fetchNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id, {
      include: [
        { model: NotificationType, as: "type", attributes: ["id", "name"] },
        { model: User, as: "sender", attributes: ["id", "name", "email"] },
        { model: User, as: "receiverStaff", attributes: ["id", "name", "email"], required: false },
        { model: Tenant, as: "receiverTenant", attributes: ["id", "name", "email"], required: false },
      ],
    });

    if (!notification) return res.status(404).json({ message: "Notification not found." });
    return res.status(200).json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get notifications for the logged-in user
const getMyNotifications = async (req, res) => {
  try {
    const {type, isRead } = req.query;
    const whereClause = { receiverId: req.user.id };

    if (type) whereClause.notificationTypeId = type;
    if (typeof isRead === "boolean") whereClause.isRead = isRead;

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [{ model: NotificationType, as: "type", attributes: ["id", "name"] }],
    });

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to fetch notifications" });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, receiverId: req.user.id } });

    if (!notification) return res.status(404).json({ status: "error", message: "Notification not found" });

    notification.isRead = !notification.isRead;
    await notification.save();

    return res.status(200).json({ status: "success", message: "Notification marked as read" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to mark notification as read" });
  }
};

// Get all notifications (Admin)
const getAllNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });

    const {  type } = req.query;
    const whereClause = {};

    if (type) whereClause.type_id = type;

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        { model: NotificationType, as: "type", attributes: ["id", "name"] },
        // { model: User, as: "sender", attributes: ["id", "name", "email"] },
        { model: User, as: "receiverStaff", attributes: ["id", "name", "email"], required: false },
        { model: Tenant, as: "receiverTenant", attributes: ["id", "name", "email"], required: false },
      ],
    });

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ status: "error", message: `Failed to fetch notifications: ${error.message}` });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, receiverId: req.user.id } });
    if (!notification) return res.status(404).json({ status: "error", message: "Notification not found" });

    await notification.destroy();
    return res.status(204).json({ status: "success", message: "Notification deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to delete notification" });
  }
};
const deleteNotificationAdmin = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) return res.status(404).json({ status: "error", message: "Notification not found" });

    await notification.destroy();
    return res.status(204).json({ status: "success", message: "Notification deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to delete notification" });
  }
}

module.exports = {
  createNotificationForUser,
  createNotificationForGroup,
  updateNotification,
  fetchNotificationById,
  getMyNotifications,
  markAsRead,
  getAllNotifications,
  deleteNotification,
  deleteNotificationAdmin,
};
