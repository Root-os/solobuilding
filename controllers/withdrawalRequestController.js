const WithdrawalRequest = require('../models/withdrawal');

// Create a new withdrawal request
const createWithdrawalRequest = async (req, res) => {
    try {
        const { tenantId, terminationDate, reason } = req.body;

        if (!tenantId || !terminationDate || !reason) {
            return res.status(400).json({ message: "Tenant ID, termination date, and reason are required." });
        }

        const request = await WithdrawalRequest.create({ tenantId, terminationDate, reason });

        res.status(201).json({ message: "Withdrawal request submitted successfully.", request });
    } catch (error) {
        res.status(500).json({ message: "Error submitting withdrawal request.", error: error.message });
    }
};

// Admin retrieves all withdrawal requests
const getAllWithdrawalRequests = async (req, res) => {
    try {
        const requests = await WithdrawalRequest.findAll();
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching withdrawal requests.", error: error.message });
    }
};

// Admin reviews and updates withdrawal request status
const reviewWithdrawalRequest = async (req, res) => {
    try {
        const { requestId, status, adminResponse } = req.body;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status update." });
        }

        request.status = status;
        request.adminResponse = adminResponse || null;

        if (status === "approved") {
            request.processedAt = new Date(); // Mark approval date
        }

        await request.save();

        res.status(200).json({ message: `Request ${status} successfully.`, request });
    } catch (error) {
        res.status(500).json({ message: "Error updating withdrawal request.", error: error.message });
    }
};

// Assign an employee to handle the exit process
const assignEmployeeToRequest = async (req, res) => {
    try {
        const { requestId, employeeId } = req.body;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }

        request.assignedEmployeeId = employeeId;
        await request.save();

        res.status(200).json({ message: "Employee assigned successfully.", request });
    } catch (error) {
        res.status(500).json({ message: "Error assigning employee.", error: error.message });
    }
};

// Tenant provides feedback on request rejection
const provideTenantFeedback = async (req, res) => {
    try {
        const { requestId, tenantFeedback } = req.body;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }

        request.tenantFeedback = tenantFeedback;
        await request.save();

        res.status(200).json({ message: "Tenant feedback submitted.", request });
    } catch (error) {
        res.status(500).json({ message: "Error submitting feedback.", error: error.message });
    }
};

// Admin finalizes exit process and refunds deposit
const finalizeWithdrawalProcess = async (req, res) => {
    try {
        const { requestId, depositRefundStatus } = req.body;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }

        if (!["not_processed", "partial", "full"].includes(depositRefundStatus)) {
            return res.status(400).json({ message: "Invalid deposit refund status." });
        }

        request.depositRefundStatus = depositRefundStatus;
        request.status = "processed";
        request.processedAt = new Date();

        await request.save();

        res.status(200).json({ message: "Withdrawal process finalized successfully.", request });
    } catch (error) {
        res.status(500).json({ message: "Error finalizing withdrawal process.", error: error.message });
    }
};

module.exports = {
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    reviewWithdrawalRequest,
    assignEmployeeToRequest,
    provideTenantFeedback,
    finalizeWithdrawalProcess
};
