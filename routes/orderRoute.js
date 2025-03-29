const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/orderController");
const { upload, receiptUpload } = require('../middleware/upload');
const { tenantAuth,AdminOrTenantAuth } = require('../middleware/auth');

router.post("/", tenantAuth, receiptUpload.single('receiptImage'), OrderController.createOrder); // Create order
router.get("/", OrderController.getAllOrders); // Get all orders
router.get("/myorders", tenantAuth, OrderController.getOrdersForCurrentTenant); // Get orders for current tenant

router.get("/:id", OrderController.getOrderById); // Get order by ID
router.get("/tenant/:tenantId", OrderController.getOrdersByTenantId); // Get orders by tenant ID
router.put("/:id", AdminOrTenantAuth, receiptUpload.single('receiptImage'), OrderController.updateOrder); // Update order
router.delete("/:id", OrderController.deleteOrder); // Delete order

module.exports = router;