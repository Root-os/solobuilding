const express = require("express");
const router = express.Router();
const PaymentTypeController = require("../controllers/paymentTypeController");

// Create a new payment type
router.post("/", PaymentTypeController.createPaymentType);

// Get all payment types
router.get("/", PaymentTypeController.getAllPaymentTypes);

// Get a single payment type by ID
router.get("/:id", PaymentTypeController.getPaymentTypeById);

// Update a payment type
router.put("/:id", PaymentTypeController.updatePaymentType);

// Delete a payment type
router.delete("/:id", PaymentTypeController.deletePaymentType);

module.exports = router;
