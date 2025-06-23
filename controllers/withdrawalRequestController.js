const WithdrawalRequest = require('../models/withdrawal');
const Tenant=require('../models/tenant');
const User = require('../models/user');
const Role = require('../models/role');
const {refundStatusSchema} = require('../helpers/schema');
const sendNotificationHelper= require('../helpers/sendAlert');
const sendEmailMessage = require('../services/sendEmailMessage');
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");



// Create a new withdrawal request
const createWithdrawalRequest = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { terminationDate, reason } = req.body;

    if (!tenantId || !terminationDate || !reason) {
      return res.status(400).json({ message: "Tenant ID, termination date, and reason are required." });
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const request = await WithdrawalRequest.create({ tenantId, terminationDate, reason });

    // Include Role model to filter admins
    const admins = await User.findAll({
      include: {
        model: Role,
        where: { name: 'admin' }, // Filter by role name
        attributes: [] // Exclude Role attributes from the result
      }
    });
    console.log(`Admins found: ${admins.length}`); // Debugging log
    console.log(`Request created: ${JSON.stringify(request)}`); // Debugging log

    if (request && admins.length > 0) {
      console.log(`Sending notifications to ${admins.length} admins.`); // Debugging log
      await Promise.all(
        admins.map((admin) =>
          sendNotificationHelper({
            adminId: admin.id,
            title: 'New Withdrawal Request from Tenant',
            body: `A new withdrawal request has been submitted by ${tenant.fullName}. Please check the withdrawal requests page for more details.`,
            type: 'New Withdrawal Request',
            receiver_type: 'staff',
          })
        )
      );
    }
    //send sms to admins phone
    const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
    await Promise.all(
      admins.map((admin) =>
        smsUtil.sendSingleSMS({
          phone: admin.phone,
          msg: `A new withdrawal request has been submitted by ${tenant.fullName}. Please check the withdrawal requests page for more details.`,
          callback: process.env.GEEZSMS_WEBHOOK_URL, // Optional callback URL
        })
      )
    );



    res.status(201).json({ message: "Withdrawal request submitted successfully.", request });
  } catch (error) {
    res.status(500).json({ message: "Error submitting withdrawal request.", error: error.message });
  }
};

// Admin retrieves all withdrawal requests
const getAllWithdrawalRequests = async (req, res) => {
  try {
    // Fetch withdrawal requests along with tenant and assigned employee (user) details
    const requests = await WithdrawalRequest.findAll({
      include: [
        {
          model: Tenant,
          attributes: ['id', 'fullName', 'email', 'phoneNumber'] // Attributes from Tenant model
        },
        {
          model: User,
          as: 'assignedEmployee', // Alias for the assigned employee
          attributes: ['fname', 'lname', 'email'] // Attributes from User model
        }
      ]
    });

    // Check if there are no requests
    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: "No withdrawal requests found." });
    }

    // Send the response
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching withdrawal requests.", error: error.message });
  }
};

const getMyWithdrawalRequests = async (req, res) => {
    try {
        const { id } = req.user;
        const tenant = await Tenant.findByPk(id
            
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
  
      // Fetch the request along with Tenant details
      const request = await WithdrawalRequest.findByPk(requestId, {
        include: { model: Tenant, attributes: ['id', 'fullName', 'email', 'phoneNumber'] },
      });
  
      if (!request) {
        return res.status(404).json({ message: "Withdrawal request not found." });
      }
  
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status update." });
      }
  
      if (request.status === "approved") {
        return res.status(400).json({ message: "Request has already been approved." });
      }
  
      if (request.status === "rejected") {
        return res.status(400).json({ message: "Request has already been rejected." });
      }
  
      if (status === "approved" && !request.assignedEmployeeId) {
        return res.status(400).json({ message: "Please assign an employee to this request before approving." });
      }
  
      if (status === "rejected" && !adminResponse) {
        return res.status(400).json({ message: "Please provide a reason for rejecting this request." });
      }
  
      // Update request details
      request.status = status;
      request.adminResponse = adminResponse || null;
      request.processedAt = status === "approved" ? new Date() : request.processedAt;
  
      await request.save();
  
      res.status(200).json({ message: `Request ${status} successfully.`, request });
    } catch (error) {
      res.status(500).json({ message: "Error updating withdrawal request.", error: error.message });
    }
  };
  
const deleteWithdrawalRequest = async (req, res) => {
    try {
        const requestId  = req.params.id;

        const request = await WithdrawalRequest.findByPk(requestId);
        if (!request) 
        {
            return res.status(404).json({ message: "Withdrawal request not found." });
        }
        await request.destroy();
        res.status(204).json({ message: "Withdrawal request deleted successfully." });
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

    // Fetch the withdrawal request by its ID
    const request = await WithdrawalRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: "Withdrawal request not found." });
    }

    // Fetch the employee with their role included
    const employee = await User.findByPk(employeeId, {
      include: {
        model: Role, // Ensure Role is properly included
        attributes: ['name'], // Fetch only the 'name' of the role
      },
    });
    // Handle case if employee is not found
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    // Check if the employee's role is 'employee'
    if (!employee.Role || employee.Role.name === 'admin') {
      return res.status(400).json({ message: "Only employees can be assigned to requests." });
    }
    // Update the request status and assign the employee to the request
    request.status = "in_progress";
    request.assignedEmployeeId = employeeId;
    await request.save();

    // Fetch tenant details
    const tenant = await Tenant.findByPk(request.tenantId, {
      attributes: ['id', 'fullName'],
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    // Send notifications to both employee and tenant
    try {
      await Promise.all([
        sendNotificationHelper({
          adminId: employeeId,
          title: 'New Withdrawal Request Assigned',
          body: `A new withdrawal request has been assigned to you. Please check the requests page for more details.`,
          type: 'Withdrawal Request Assigned',
          receiver_type: 'staff',
        }),
        sendNotificationHelper({
          adminId: tenant.id,
          title: 'Your Withdrawal Request is in Progress',
          body: `Your withdrawal request has been assigned to ${employee.fname} ${employee.lname}. The assigned employee will process it soon.`,
          type: 'Withdrawal Request Processing',
          receiver_type: 'tenant',
        }),
      ]);
    } catch (notificationError) {
      console.error('Notification error:', notificationError.message);
      // Continue execution even if notifications fail
    }

    // Return the updated request
    res.status(200).json({ message: "Employee assigned successfully.", request });
  } catch (error) {
    // Handle errors and return the appropriate response
    res.status(500).json({ message: "Error assigning employee.", error: error.message });
  }
};

const myAssignedRequests=async(req,res)=>{
    try {
        const employeeId = req.user.id;
const employee = await User.findByPk(employeeId,
    { include: { model: User,attributes:['fullName','email','phoneNumber'], } }
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
        // Fetch tenant details
        const tenant = await Tenant.findByPk(request.tenantId, {
            attributes: ['id', 'fullName', 'email', 'phoneNumber'],
        }); 
        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found." });
        }
        // Send notification to tenant about the finalized process
        await sendNotificationHelper({
            adminId: tenant.id,
            title: 'Withdrawal Process Finalized',
            body: `Your withdrawal process has been finalized. The deposit refund status is ${depositRefundStatus}.`,
            type: 'Withdrawal Process Finalized',
            receiver_type: 'tenant',
        });
        // Send email notification to tenant
        await sendEmailMessage({
            email: tenant.email,
            fullName: tenant.fullName,
            title: 'Withdrawal Process Finalized',
            body: `Dear ${tenant.fullName},\n\nYour withdrawal process has been finalized. The deposit refund status is ${depositRefundStatus}.\n\nThank you for being a valued tenant.\n\nBest regards,\nApartment Management Team`
        });

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
    deleteWithdrawalRequest,
};
