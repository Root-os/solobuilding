const express = require('express');
const router = express.Router();
const {receiptUpload} = require('../middleware/upload')
const {roleAuth}=require('../middleware/auth')
const paymentRequestController = require('../controllers/paymentRequestController');

router.post('/', paymentRequestController.createPaymentRequest);
router.get('/', paymentRequestController.getAllPaymentRequests);
router.get('/:id', paymentRequestController.getPaymentRequestById);
router.put('/:id', paymentRequestController.updatePaymentRequest);
router.put('/review/:id', paymentRequestController.reviewPayment);
router.post('/upload-receipt/:id', roleAuth('tenant'),receiptUpload.single('receipt'), paymentRequestController.uploadReceipt);
router.delete('/:id', paymentRequestController.deletePaymentRequest);
router.get('/tenant/my-requests', roleAuth('tenant'),paymentRequestController.getMyRequestFromAdmin);


module.exports = router;
