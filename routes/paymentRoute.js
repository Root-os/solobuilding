const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Create a new payment type
router.post("/", paymentController.createPayment);
router.get("/", paymentController.getAllPayments);
router.get("/:id", paymentController.getPaymentById);
router.put("/:id", paymentController.updatePayment);
router.delete("/:id", paymentController.deletePayment);
router.post("/report", paymentController.getPaymentsReport);

module.exports = router;