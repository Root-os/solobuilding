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
router.post("/create",  createNotificationForUser);

// Update notification
router.put(
  "/update/:id",adminOrEmployeeAuth,
  updateNotification
);

// Create notification for all users
router.post("/group", adminOrEmployeeAuth, createNotificationForGroup);

// Get my notifications with pagination and filters
router.get("/my-notification",tenantAuth,getMyNotifications);

// Mark notification as read
router.put("/mark-as-read/:id",EmployeeOrTenantAuth, markAsRead);

// Get all notifications (admin only)
router.get("/all", adminOrEmployeeAuth,getAllNotifications);

// Delete notification
router.delete("/delete/:id",EmployeeOrTenantAuth,deleteNotification);
router.delete("/delete-admin/:id",adminOrEmployeeAuth,  deleteNotificationAdmin);
router.get("/get-by-id/:id",fetchNotificationById);

//staff notification
router.delete("/staff-delete/:id",adminOrEmployeeAuth,deleteNotification);
router.get("/staff-notification",adminOrEmployeeAuth,getStaffNotifications);
router.put("/staff-mark-as-read/:id",adminOrEmployeeAuth, markAsRead);


module.exports = router;


module.exports = router;