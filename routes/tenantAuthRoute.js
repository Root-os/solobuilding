const express = require('express');
const { tenantAuth } = require('../middleware/auth');
const tenantController = require('../controllers/tenantAuthController');

const router = express.Router();

// Tenant Login
router.post('/login', tenantController.login);

// Change Password
router.put('/change-password', tenantAuth, tenantController.changePassword);

// Forgot Password (via Email)
router.post('/forgot-password', tenantController.forgotPassword);

// Reset Password
router.post('/reset-password/:token', tenantController.resetPassword);

// Get Tenant Profile
router.get('/profile', tenantAuth, tenantController.getProfile);

// Update Tenant Profile
router.put('/profile', tenantAuth, tenantController.updateProfile);

module.exports = router;