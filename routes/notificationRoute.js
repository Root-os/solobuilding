const express = require("express");

const router = express.Router();

const {
  
  createNotificationForUser,
 updateNotification,
 createNotificationForAllUsers,
  getMyNotifications,
  getMyUnreadNotifications,
  markAsRead,
  getAllNotifications,
  deleteNotification,
  createNotificationType,
  getNotificationTypes,
  updateNotificationType,
  deleteNotificationType,

  fetchNotificationById,
} = require("../controllers/notificationController");

// Create notification for user
router.post("/create",  createNotificationForUser);

// Update notification
router.put(
  "/update/:id",
  updateNotification
);

// Create notification for all users
router.post("/create-for-all",  createNotificationForAllUsers);

// Get my notifications with pagination and filters
router.get(
  "/my",

  getMyNotifications
);

// Get my unread notifications
router.get(
  "/my/unread",

  getMyUnreadNotifications
);

// Mark notification as read
router.put(
  "/mark-as-read/:id",
  markAsRead
);

// Get all notifications (admin only)
router.get(
  "/all",
   getAllNotifications
);

// Delete notification
router.delete(
  "/delete/:id",

  deleteNotification
);
router.delete(
  "/delete-admin/:id",  deleteNotification
);
router.get("/by/:id",fetchNotificationById);

router.post("/type", createNotificationType);
router.get("/types", getNotificationTypes);
router.put("/type/:id", updateNotificationType);
router.delete("/type/:id", deleteNotificationType);

module.exports = router;


module.exports = router;