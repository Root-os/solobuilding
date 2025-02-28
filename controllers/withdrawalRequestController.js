const WithdrawalRequest = require('../models/withdrawal');
const Tenant=require('../models/tenant');
const User = require('../models/user');
const {refundStatusSchema} = require('../helpers/schema');

// Create a new withdrawal request
const createWithdrawalRequest = async (req, res) => {
    try {
        const tenantId = req.user.id;

        const {  terminationDate, reason } = req.body;

        if (!tenantId || !terminationDate || !reason) {
            return res.status(400).json({ message: "Tenant ID, termination date, and reason are required." });
        }

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found." });
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
        const requests = await WithdrawalRequest.findAll(
            { include: { model: Tenant, } }
        );
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching withdrawal requests.", error: error.message });
    }
};


const getMyWithdrawalRequests = async (req, res) => {
    try {
        const { id } = req.user;
        const tenant = await Tenant.findByPk(id
            , { include: { model: Tenant, } }
        );
        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found." });
        }
        const requests = await WithdrawalRequest.findAll(
            { where: { tenantId: tenant.id } }
        );
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching withdrawal requests.", error: error.message });
    }
};


// Admin reviews and updates withdrawal request status
const reviewWithdrawalRequest = async (req, res) => {
    try {
        const { requestId, status, adminResponse } = req.body;

        const request = await WithdrawalRequest.findByPk(requestId
            , { include: { model: Tenant,} }
        );
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

const deleteWithdrawalRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) 
        {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }
        await request.destroy();
        res.status(200).json({ message: "Withdrawal request deleted successfully." });
    } 
    catch (error) 
    {
        res.status(500).json({ message: "Error deleting withdrawal request.", error: error.message });
    }
}
// Assign an employee to handle the exit process
const assignEmployeeToRequest = async (req, res) => {
    try {
        const { requestId, employeeId } = req.body;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }
const employee = await User.findByPk(employeeId);
if (!employee) {
    return res.status(404).json({ message: "Employee not found." });
}
if (employee.role !== "employee") {
    return res.status(400).json({ message: "Only employees can be assigned to requests." });
}
        request.status = "in_progress";
        request.assignedEmployeeId = employeeId;
        await request.save();

        res.status(200).json({ message: "Employee assigned successfully.", request });
    } catch (error) {
        res.status(500).json({ message: "Error assigning employee.", error: error.message });
    }
};
const myAssignedRequests=async(req,res)=>{
    try {
        const employeeId = req.user.id;
const employee = await User.findByPk(employeeId,
    { include: { model: User, } }
);
if (!employee) {
    return res.status(404).json({ message: "Employee not found." });
}
const requests = await WithdrawalRequest.findAll({ where: { assignedEmployeeId: employeeId } });
res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching assigned requests.", error: error.message });
    }
}

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
        const error = refundStatusSchema.validate(req.body).error;
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

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
    finalizeWithdrawalProcess,
    getMyWithdrawalRequests,
    myAssignedRequests,
};
