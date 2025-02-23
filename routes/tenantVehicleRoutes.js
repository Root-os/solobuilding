const express = require('express');
const tenantVehicleController = require('../controllers/TenantVehicleController');

const router = express.Router();

// Create a new vehicle for a tenant
router.post('/', tenantVehicleController.createVehicle);

// Get all vehicles for a tenant
router.get('/vehicles/:tenantId', tenantVehicleController.getAllVehiclesOfTenant);

// Get a specific vehicle by ID
router.get('/:id', tenantVehicleController.getVehicleById);

//get single vehicle by car plate
router.get('/carplate/:carPlate', tenantVehicleController.getVehicleByPlate);

//get all vehicles
router.get('/', tenantVehicleController.getVehiclesWithFilter);
// router.get('/', tenantVehicleController.getAllVehicles);

// Update a vehicle
router.put('/:id', tenantVehicleController.updateVehicle);

// Delete a vehicle
router.delete('/:id', tenantVehicleController.deleteVehicle);

// Export the router

module.exports = router;