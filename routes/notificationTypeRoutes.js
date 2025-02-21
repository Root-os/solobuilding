const express = require("express");
const router = express.Router();
const notificationTypeController = require("../controllers/notificationTypeController");

// Create a new notification type
router.post("/", notificationTypeController.createNotificationType);

// Get all notification types
router.get("/", notificationTypeController.getAllNotificationTypes);

// Get notification type by ID
router.get("/:id", notificationTypeController.getNotificationTypeById);

// Update notification type by ID
router.put("/:id", notificationTypeController.updateNotificationType);

// Delete notification type by ID
router.delete("/:id", notificationTypeController.deleteNotificationType);

module.exports = router;
