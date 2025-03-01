const express = require('express');
const router = express.Router();
const stockoutController = require("../controllers/stockoutController");
const { employeeAuth,adminAuth,adminOrEmployeeAuth } = require("../middleware/auth"); // Ensure verifyToken is exported in authMiddleware

router.post("/request", employeeAuth, stockoutController.createStockoutRequest);
router.put('/approve/:id', adminAuth, stockoutController.approveStockout);
router.get("/", adminAuth, stockoutController.getStockoutRequests);
router.get("/:id", adminOrEmployeeAuth, stockoutController.getStockoutRequestById);
router.put("/:id", adminOrEmployeeAuth, stockoutController.updateStockoutRequest);
router.delete("/:id", adminAuth, stockoutController.deleteStockoutRequest);
router.put("/cance-request/:id", employeeAuth, stockoutController.cancelStockoutRequest);
router.get("/low-stock/check", adminAuth, stockoutController.checkLowStock);
router.get("/export", adminAuth, stockoutController.exportStockoutReport);
router.get("/movements", adminAuth, stockoutController.getStockMovementOverview);

module.exports = router;
