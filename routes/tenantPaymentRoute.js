const express = require('express');
const router = express.Router();
const TenantPaymentController = require('../controllers/tenantPaymentsController');
const { adminAuth,employeeAuth, tenantAuth, } = require("../middleware/auth");

// CRUD Routes
router.post('/', TenantPaymentController.createPayment);
router.get('/', TenantPaymentController.getAllPayments);
router.get('/my-bills',tenantAuth, TenantPaymentController.getPaymentByTenantId);
router.post('/by-date', TenantPaymentController.getAllPaymentByDate);
router.get('/last', TenantPaymentController.getLastTenantPayment);
router.put('/:id', TenantPaymentController.updatePayment);
router.delete('/:id', TenantPaymentController.deletePayment);
router.post('/reports', TenantPaymentController.getTenantPaymentsReport);

module.exports = router;
