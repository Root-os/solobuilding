const express = require("express");
const router = express.Router();
const OrderController = require("../controllers/orderController");
const { upload, receiptUpload } = require('../middleware/upload');
const { tenantAuth, AdminOrTenantAuth, adminAuth } = require('../middleware/auth'); // Make sure you have adminAuth for admin routes

// Create order
router.post("/", tenantAuth, receiptUpload.single('receiptImage'), OrderController.createOrder); 

// Get all orders
router.get("/", OrderController.getAllOrders); 

// Get orders for current tenant
router.get("/myorders", tenantAuth, OrderController.getOrdersForCurrentTenant); 

// Get order by ID
router.get("/:id", OrderController.getOrderById); 

// Get orders by tenant ID
router.get("/tenant/:tenantId", OrderController.getOrdersByTenantId); 

// Update order
router.put("/:id", AdminOrTenantAuth, receiptUpload.single('receiptImage'), OrderController.updateOrder); 

// Delete order
router.delete("/:id", OrderController.deleteOrder); 

// Admin approve order status
router.put("/approve/:id", adminAuth, OrderController.approveOrder); // Approve order by admin

module.exports = router;
