const express = require("express");
const router = express.Router();
const {
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    reviewWithdrawalRequest,
    assignEmployeeToRequest,
    provideTenantFeedback,
    finalizeWithdrawalProcess
} = require("../controllers/withdrawalRequestController");

const { adminAuth, tenantAuth, employeeAuth } = require("../middleware/auth");
// Tenant submits withdrawal request
router.post('/submit', createWithdrawalRequest);

// Admin retrieves all withdrawal requests
router.get('/all', getAllWithdrawalRequests);

// Admin reviews and updates withdrawal status
router.put('/review', reviewWithdrawalRequest);

// Admin assigns an employee to handle withdrawal
router.put('/assign-employee', assignEmployeeToRequest);

// Tenant provides feedback on rejection
router.put('/feedback', provideTenantFeedback);

// Admin finalizes withdrawal process
router.put('/finalize', finalizeWithdrawalProcess);

module.exports = router;
