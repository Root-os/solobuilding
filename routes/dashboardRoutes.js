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

// Route for the admin dashboard, accessible only by admins
router.get("/", adminAuth, getDashboardStats);

// Route for the tenant dashboard, accessible only by tenants
router.get("/for-tenant", tenantAuth, getTenantDashboardStats);

// Route for the employee dashboard, accessible only by employees
router.get("/employee-dashboard", employeeAuth, getEmployeeDashboardStats);

module.exports = router;
