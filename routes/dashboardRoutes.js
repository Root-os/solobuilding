const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getTenantDashboardStats,
  getEmployeeDashboardStats, // Assuming you have this function in your controller
} = require("../controllers/dashboardController");
const {
  adminAuth,
  tenantAuth,
  employeeAuth, // Add a middleware for employee authentication
} = require("../middleware/auth");

router.get("/", adminAuth, getDashboardStats);
router.get("/for-tenant", tenantAuth, getTenantDashboardStats);
router.get("/employee-dashboard", employeeAuth, getEmployeeDashboardStats);

module.exports = router;
