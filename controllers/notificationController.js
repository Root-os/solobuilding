const Notification = require("../models/notification");
const NotificationType = require("../models/notificationType");
const User = require("../models/user");
const Role = require("../models/role");
const Tenant = require("../models/tenant");
const Unit = require('../models/unit');
const Floor = require("../models/floor");
const {notificationSchema}=require('../helpers/schema')
const { Sequelize } = require('sequelize');
const { Op } = require("sequelize");


// Create notification for a specific user or tenant
const createNotificationForUser = async (req, res) => {
  try {
    const { error } = await notificationSchema.validateAsync(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { receiver_id, receiver_type,  title, body, type_id } = req.body;

    let receiver;
    if (receiver_type === "staff") {
      receiver = await User.findByPk(receiver_id);
    } else if (receiver_type === "tenant") {
      receiver = await Tenant.findByPk(receiver_id);
    } else {
      return res.status(400).json({ message: "Invalid receiver type." });
    }

    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const notification = await Notification.create({
      receiver_id,
      receiver_type,
      title,
      body,
      type_id,
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
    const { title, body, type_id, receiver_type } = req.body;

    if (!title || !body || !type_id || !receiver_type) {
      return res.status(400).json({
        message: "Title, body, type_id, and receiver_type are required."
      });
    }

    let receivers = [];

    if (receiver_type === "staff") {
        receivers = await User.findAll({
    include: [
      {
        model: Role,
        where: {
          name: { [Op.ne]: "admin" }
        },
        attributes: []
      }
    ],
    attributes: ["id"]
  });
    }

    if (receiver_type === "tenant") {
      const tenants = await Tenant.findAll({
        attributes: ["id", "phoneNumber", "createdAt"],
        order: [
          ["phoneNumber", "ASC"],
          ["createdAt", "ASC"] 
        ]
      });

      // Deduplicate by phoneNumber
      const uniqueTenantsMap = new Map();
      for (const tenant of tenants) {
        if (!uniqueTenantsMap.has(tenant.phoneNumber)) {
          uniqueTenantsMap.set(tenant.phoneNumber, tenant);
        }
      }

      receivers = Array.from(uniqueTenantsMap.values());
    }

    await Promise.all(
      receivers.map((receiver) =>
        Notification.create({
          receiver_id: receiver.id,
          receiver_type,
          title,
          body,
          type_id
        })
      )
    );

    return res.status(201).json({
      status: "success",
      message: `Notifications sent to all ${receiver_type}s.`
    });

  } catch (error) {
    console.error("Error sending group notifications:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// Update notification
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, type_id, isRead } = req.body;

    const notification = await Notification.findByPk(id);
    if (!notification) return res.status(404).json({ message: "Notification not found." });

    Object.assign(notification, { title, body, type_id, isRead });
    await notification.save();

    const updatedNotification = await Notification.findByPk(req.params.id, {
      include: [
        {
          model: NotificationType,
          as: "type",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "receiverStaff",
          attributes: ["id", "fname", "lname", "email"],
          required: false, // Optional include
          where: { "$Notification.receiver_type$": "staff" }, // Filter by receiver_type
        },
        {
          model: Tenant,
          as: "receiverTenant",
          attributes: ["id", "fullName", "email"],
          required: false, // Optional include
          where: { "$Notification.receiver_type$": "tenant" }, // Filter by receiver_type
        },
      ],
    });

    const notificationJson = updatedNotification.toJSON();

    const { receiverStaff, receiverTenant, ...rest } = notificationJson;

    const result = {
      ...rest,
      receiver:
        notificationJson.receiver_type === "staff"
          ? receiverStaff
          : receiverTenant,
    };

    return res.status(200).json({ message: "Notification updated successfully.", notification: result });
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
        { model: User, 
           attributes: ["id", "name", "email"], required: false,
           where: { '$receiverStaff.receiver_type$': 'staff' }, },
        { model: Tenant, 
          attributes: ["id", "name", "email"], required: false,
          where: { '$receiverTenant.receiver_type$': 'tenant' },
         },
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
    const { type, isRead } = req.query;
    const phoneNumber = req.user.phone;

    // 1. Find tenants by phone number (✅ correct table)
    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ["id"],
    });

    if (!tenants.length) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const tenantIds = tenants.map(t => t.id);

    // 2. Build where clause
    const whereClause = {
      receiver_id: tenantIds,
    };

    if (type) whereClause.notificationTypeId = type;
    if (isRead !== undefined) whereClause.isRead = isRead === "true";

    // 3. Fetch notifications with unit & floor
    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: NotificationType,
          as: "type",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Notification error:", error);
    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
    }

    // Fetch the notification by ID
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found"
      });
    }

    // Employee (staff) check: ID match
    if (notification.receiver_type === "staff") {
      if (Number(notification.receiver_id) !== Number(req.user.id)) {
        return res.status(403).json({
          status: "error",
          message: "You are not allowed to update this notification"
        });
      }
    }

    // Tenant check: compare phone numbers
    if (notification.receiver_type === "tenant") {
      const tenant = await Tenant.findByPk(notification.receiver_id);
      if (!tenant) {
        return res.status(404).json({
          status: "error",
          message: "Tenant not found"
        });
      }

      if (tenant.phoneNumber !== req.user.phone) {
        return res.status(403).json({
          status: "error",
          message: "You are not allowed to update this notification"
        });
      }
    }

    // Mark as read
    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      status: "success",
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


// Get all notifications (Admin)
const getAllNotifications = async (req, res) => {
  try {
    // Ensure the user has admin role
    const { type } = req.query;
    const whereClause = {};

    if (type) whereClause.type_id = type;

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: NotificationType,
          as: "type",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "receiverStaff",
          attributes: ["id", "fname", "lname", "email"],
          required: false, // Optional include
          where: { "$Notification.receiver_type$": "staff" }, 
        },
        {
          model: Tenant,
          as: "receiverTenant",
          attributes: ["id", "fullName", "email"],
          required: false, // Optional include
          where: { "$Notification.receiver_type$": "tenant" }, 
        },
      ],
    });

    // Clean up the response to include only the relevant receiver
    const result = notifications.rows.map((notification) => {
      const { receiverStaff, receiverTenant, ...rest } = notification.toJSON();
      return {
        ...rest,
        receiver: notification.receiver_type === "staff" ? receiverStaff : receiverTenant,
      };
    });

    return res.status(200).json({
      status: "success",
      count: notifications.count,
      data: result,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error.message);
    return res.status(500).json({
      status: "error",
      message: `Failed to fetch notifications: ${error.message}`,
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, receiver_id: req.user.id } });
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
const getStaffNotifications = async (req, res) => {
  try {
    const {type, isRead } = req.query;
    const whereClause = { receiver_id: req.user.id, receiver_type: "staff" };

    if (type) whereClause.type_id = type;
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
  getStaffNotifications,
};
