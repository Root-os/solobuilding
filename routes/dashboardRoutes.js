const express = require("express");
const router = express.Router();
const { getDashboardStats,getTenantDashboardStats } = require("../controllers/dashboardController");
const { adminAuth,EmployeeOrTenantAuth, tenantAuth } = require("../middleware/auth");

router.get("/", adminAuth,getDashboardStats);
router.get('/for-tenant',tenantAuth,getTenantDashboardStats)

module.exports = router;
