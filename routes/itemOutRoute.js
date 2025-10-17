const express = require("express");
const router = express.Router();
const ItemOutController = require("../controllers/itemOutController");
const { adminAuth,verifyToken, tenantAuth, employeeAuth,adminOrEmployeeAuth } = require("../middleware/auth");

router.post("/",tenantAuth, ItemOutController.createRequest);
router.get("/",tenantAuth, ItemOutController.getAllRequests);
router.get("/admin",adminOrEmployeeAuth, ItemOutController.getAllRequestsForAdmin);
router.get("/:id",tenantAuth, ItemOutController.getItemById);
router.put("/:id",tenantAuth, ItemOutController.updateRequest);
router.delete("/:id",tenantAuth, ItemOutController.deleteItem);
router.patch("/:id/status", adminOrEmployeeAuth, ItemOutController.updateStatus);

module.exports = router;
