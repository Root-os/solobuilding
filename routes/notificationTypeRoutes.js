const express = require("express");
const router = express.Router();
const notificationTypeController = require("../controllers/notificationTypeController");
const { adminAuth,EmployeeOrTenantAuth, } = require("../middleware/auth");

// Create a new notification type
router.post("/",adminAuth, notificationTypeController.createNotificationType);

// Get all notification types
router.get("/", notificationTypeController.getNotificationTypes);

// Update notification type by ID
router.put("/:id", notificationTypeController.updateNotificationType);

// Delete notification type by ID
router.delete("/:id", notificationTypeController.deleteNotificationType);

module.exports = router;
