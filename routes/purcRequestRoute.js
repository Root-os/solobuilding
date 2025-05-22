const express = require('express');
const router = express.Router();
const PurchRequestController = require('../controllers/PurchRequestController');

router.post('/', PurchRequestController.createPurchaseRequest);
router.get('/', PurchRequestController.getAllPurchaseRequests);
router.get('/:id', PurchRequestController.getPurchaseRequestById);
router.put('/:id', PurchRequestController.updatePurchaseRequest);
router.delete('/:id', PurchRequestController.deletePurchaseRequest);
router.post('/report', PurchRequestController.generatePurchaseRequestReport);
router.get('/user/:userId', PurchRequestController.getPurchaseRequestsByUser);



module.exports = router;
