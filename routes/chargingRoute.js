const express = require('express');
const router = express.Router();
const electricCarChargingController = require('../controllers/chargingController');

// 1. Create a new charging session
router.post('/', electricCarChargingController.createChargingSession); 

// 2. Get all charging sessions (with optional filters)
router.get('/', electricCarChargingController.getAllChargingSessions); 

// 3. Get a charging session by ID
router.get('/:id', electricCarChargingController.getChargingSessionById); 

// 4. Update a charging session (e.g., set charging end time, cost, etc.)
router.put('/:id', electricCarChargingController.updateChargingSession);

// 5. Delete a charging session
router.delete('/:id', electricCarChargingController.deleteChargingSession);
router.post('/report', electricCarChargingController.generateReport);

module.exports = router;
