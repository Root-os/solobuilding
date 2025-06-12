const express = require("express");

const router = express.Router();

const {
createNotificationForUser,
 updateNotification,
 createNotificationForGroup,
 getMyNotifications,
 getStaffNotifications,
  markAsRead,
  getAllNotifications,
  deleteNotification,
  deleteNotificationAdmin,
  fetchNotificationById,
} = require("../controllers/notificationController");
const { adminAuth,EmployeeOrTenantAuth,adminOrEmployeeAuth,tenantAuth } = require("../middleware/auth");

// Create notification for user
router.post("/create", adminAuth, createNotificationForUser);

// Update notification
router.put(
  "/update/:id",adminAuth,
  updateNotification
);

// Create notification for all users
router.post("/group", adminAuth, createNotificationForGroup);

// Get my notifications with pagination and filters
router.get("/my-notification",tenantAuth,getMyNotifications);

// Mark notification as read
router.put("/mark-as-read/:id",tenantAuth, markAsRead);

// Get all notifications (admin only)
router.get("/all", adminAuth,getAllNotifications);

// Delete notification
router.delete("/delete/:id",EmployeeOrTenantAuth,deleteNotification);
router.delete("/delete-admin/:id",adminAuth,  deleteNotificationAdmin);
router.get("/get-by-id/:id",fetchNotificationById);

//staff notification
router.delete("/staff-delete/:id",adminOrEmployeeAuth,deleteNotification);
router.get("/staff-notification",adminOrEmployeeAuth,getStaffNotifications);
router.put("/staff-mark-as-read/:id",adminOrEmployeeAuth, markAsRead);


module.exports = router;


module.exports = router;