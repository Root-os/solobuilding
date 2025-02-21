const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

// Create a new tenant
router.post('/', tenantController.createTenant);

// Get all tenants
router.get('/', tenantController.getAllTenants);

// Get tenant by ID
router.get('/:id', tenantController.getTenantById);

// Update tenant details
router.put('/:id', tenantController.updateTenant);

// Delete tenant by ID
router.delete('/:id', tenantController.deleteTenant);

// Get tenants by unitId
router.get('/unit/:unitId', tenantController.getTenantsByUnitId);

// Get tenants by floorId
router.get('/floor/:floorId', tenantController.getTenantsByFloorId);
router.post('/filter', tenantController.filterTenants);
router.get('/10days/remaining', tenantController.getTenantsWithExpiringLease);
module.exports = router;
