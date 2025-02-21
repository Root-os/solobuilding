const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

// Create a new floor
router.post('/', floorController.createFloor);

// Get all floors
router.get('/', floorController.getAllFloors);

// Get a single floor by ID
router.get('/:id', floorController.getFloorById);

// Update a floor
router.put('/:id', floorController.updateFloor);

// Delete a floor
router.delete('/:id', floorController.deleteFloor);

module.exports = router;
