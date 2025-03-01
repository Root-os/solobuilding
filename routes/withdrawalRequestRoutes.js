const express = require("express");
const router = express.Router();
const {
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    reviewWithdrawalRequest,
    assignEmployeeToRequest,
    provideTenantFeedback,
    finalizeWithdrawalProcess,
    getMyWithdrawalRequests,
    myAssignedRequests,
    deleteWithdrawalRequest,
} = require("../controllers/withdrawalRequestController");
const { adminAuth,employeeAuth, tenantAuth, } = require("../middleware/auth");

// Tenant submits withdrawal request
router.post('/submit',tenantAuth, createWithdrawalRequest);

// Admin retrieves all withdrawal requests
router.get('/all',adminAuth, getAllWithdrawalRequests);

// Admin reviews and updates withdrawal status
router.put('/review',adminAuth, reviewWithdrawalRequest);

// Admin assigns an employee to handle withdrawal
router.put('/assign-employee', adminAuth,assignEmployeeToRequest);

// Tenant provides feedback on rejection
router.put('/feedback',tenantAuth, provideTenantFeedback);

// Admin finalizes withdrawal process
router.put('/finalize',adminAuth, finalizeWithdrawalProcess);
router.get('/tenant/my-requests',tenantAuth,getMyWithdrawalRequests);
router.get('/employee/my-requests',employeeAuth,myAssignedRequests);
router.delete('/delete/:id',adminAuth,deleteWithdrawalRequest);


module.exports = router;
