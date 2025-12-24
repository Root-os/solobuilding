const express = require('express');
const router = express.Router();
const tenantRentController = require('../controllers/tenatRentCollectionController');
const { tenantAuth, adminAuth } = require('../middleware/auth');

// CRUD Routes
router.post('/', tenantRentController.createRentPayment);
router.get('/', tenantRentController.getAllRentPayments);
router.get('/my-rents',tenantAuth, tenantRentController.getRentPaymentHistoryByTenantId);
router.get('/:id', tenantRentController.getRentPaymentById);
router.put('/:id', tenantRentController.updateRentPayment);
router.delete('/:id', tenantRentController.deleteRentPayment);

// Additional Endpoints
router.get('/by-status/:status', tenantRentController.getPaymentsByStatus);
router.post('/filter', tenantRentController.filterRentCollections);


module.exports = router;
