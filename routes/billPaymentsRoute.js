const express = require("express");
const router = express.Router();
const BillPaymentController = require("../controllers/billPaymentsController");

// CRUD Routes
router.post("/", BillPaymentController.createBillPayment); // Create a new bill payment
router.get("/", BillPaymentController.getAllBillPayments); // Get all bill payments
router.get("/:id", BillPaymentController.getBillPaymentById); // Get a single bill payment by ID
router.put("/:id", BillPaymentController.updateBillPayment); // Update a bill payment
router.delete("/:id", BillPaymentController.deleteBillPayment); // Delete a bill payment

// Additional Endpoints
router.get("/by-status/:status", BillPaymentController.getPaymentsByStatus); // Get payments by status
router.post("/bill-report", BillPaymentController.getBillPaymentsReport); // Get payments by status

module.exports = router;
