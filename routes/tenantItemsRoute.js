const express = require("express");
const router = express.Router();
const TenantItemsController = require("../controllers/tenantItemscontroller");
const { adminAuth,verifyToken, tenantAuth, employeeAuth,adminOrEmployeeAuth } = require("../middleware/auth");

router.get("/my-items", tenantAuth, TenantItemsController.getTenantItems);
router.get("/", adminAuth,TenantItemsController.getAllTenantItemsForAdmin);
router.get('/tenant/:tenantId', adminAuth,TenantItemsController. getTenantItemsByTenantId);



module.exports = router;
