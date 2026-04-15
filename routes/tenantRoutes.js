const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const {
    adminAuth,
    tenantAuth,
    employeeAuth, // Add a middleware for employee authentication
  } = require("../middleware/auth");
// Create a new tenant
router.post('/', tenantController.createTenant);

// Get all tenants
router.get('/', tenantController.getAllTenants);

// Get tenant by ID
router.get('/profile',tenantAuth, tenantController.getTenantProfile);
router.get('/floor-units', tenantController.getTenantUnits);
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
router.get('/3days/remaining', tenantController.getTenantsWithExpiringLease);
module.exports = router;
