const express = require('express');
const router = express.Router();
const tenantRentController = require('../controllers/tenatRentCollectionController');

// CRUD Routes
router.post('/', tenantRentController.createRentPayment);
router.get('/', tenantRentController.getAllRentPayments);
router.get('/:tenantId', tenantRentController.getRentPaymentHistoryByTenantId);
router.put('/:id', tenantRentController.updateRentPayment);
router.delete('/:id', tenantRentController.deleteRentPayment);

// Additional Endpoints

router.get('/by-status/:status', tenantRentController.getPaymentsByStatus);
router.post('/filter', tenantRentController.filterRentCollections);


module.exports = router;
