const express = require("express");
const router = express.Router();
const TenantItemsController = require("../controllers/tenantItemscontroller");
const { adminAuth,verifyToken, tenantAuth, employeeAuth,adminOrEmployeeAuth } = require("../middleware/auth");

router.get("/:tenantId/items", tenantAuth, TenantItemsController.getTenantItems);
router.get("/", TenantItemsController.getAllTenantItemsForAdmin);
router.get('/tenant/:phoneNumber', adminOrEmployeeAuth,TenantItemsController.getTenantItemsByPhone);



module.exports = router;
