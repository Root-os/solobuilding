const express = require("express");
const router = express.Router();
const OrderTypeController = require("../controllers/orderTypeController");


router.post("/", OrderTypeController.createOrderType); // Create service type
router.get("/", OrderTypeController.getAllOrderTypes); // Get all service types
router.get("/:id", OrderTypeController.getOrderTypeById); // Get service type by ID
router.put("/:id", OrderTypeController.updateOrderType); // Update service type
router.delete("/:id", OrderTypeController.deleteOrderType);







module.exports = router;