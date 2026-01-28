const express = require("express");
const router = express.Router();
const paymentResponseController = require("../controllers/paymentResponseController");

router.get("/", paymentResponseController.getAllPaymentResponses);
router.get("/request/:paymentRequestId", paymentResponseController.getPaymentResponsesByRequestId);


module.exports = router;