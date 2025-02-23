const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { adminAuth,EmployeeOrTenantAuth, } = require("../middleware/auth");

router.get("/", adminAuth,getDashboardStats);

module.exports = router;
