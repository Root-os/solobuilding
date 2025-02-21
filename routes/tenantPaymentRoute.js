const express = require('express');
const router = express.Router();
const TenantPaymentController = require('../controllers/tenantPaymentsController');

// CRUD Routes
router.post('/', TenantPaymentController.createPayment);
router.get('/', TenantPaymentController.getAllPayments);
router.get('/:tenantId', TenantPaymentController.getPaymentByTenantId);
router.post('/by-date', TenantPaymentController.getAllPaymentByDate);
router.put('/:id', TenantPaymentController.updatePayment);
router.delete('/:id', TenantPaymentController.deletePayment);
router.post('/reports', TenantPaymentController.getTenantPaymentsReport);

module.exports = router;
