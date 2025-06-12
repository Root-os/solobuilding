const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.createPurchase);
router.get('/', purchaseController.getAllPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.get('/by-vendor/:vendorId', purchaseController.getPurchaseByVenderId);
router.put('/:id', purchaseController.updatePurchase);
router.delete('/:id', purchaseController.deletePurchase);
router.post('/purchaseReport', purchaseController.generatePurchaseReport);

module.exports = router;
