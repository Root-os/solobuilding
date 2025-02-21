const express = require('express');
const router = express.Router();
const paymentRequestController = require('../controllers/paymentRequestController');

router.post('/', paymentRequestController.createPaymentRequest);
router.get('/', paymentRequestController.getAllPaymentRequests);
router.get('/:id', paymentRequestController.getPaymentRequestById);
router.put('/:id', paymentRequestController.updatePaymentRequest);
router.delete('/:id', paymentRequestController.deletePaymentRequest);

module.exports = router;
