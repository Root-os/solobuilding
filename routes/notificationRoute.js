const express = require("express");

const router = express.Router();

const {
  
  createNotificationForUser,
 updateNotification,
 createNotificationForGroup,
 getMyNotifications,
  markAsRead,
  getAllNotifications,
  deleteNotification,
 
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
router.post("/create-for-all",  createNotificationForGroup);

// Get my notifications with pagination and filters
router.get(
  "/my",

  getMyNotifications
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


module.exports = router;


module.exports = router;