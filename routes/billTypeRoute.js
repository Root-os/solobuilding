// routes/billPaymentTypeRoutes.js
const express = require('express');
const router = express.Router();
const billPaymentTypeController = require('../controllers/billTypeController');

router.post('/', billPaymentTypeController.createBillPaymentType);
router.get('/', billPaymentTypeController.getAllBillPaymentTypes);
router.get('/:id', billPaymentTypeController.getBillPaymentTypeById);
router.put('/:id', billPaymentTypeController.updateBillPaymentType);
router.delete('/:id', billPaymentTypeController.deleteBillPaymentType);

module.exports = router;
