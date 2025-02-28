const express = require('express');
const { createStockoutRequest, approveStockout } = require('../controllers/stockoutController');
const router = express.Router();

router.post('/request', createStockoutRequest);
router.put('/approve/:stockoutId', approveStockout);

module.exports = router;
