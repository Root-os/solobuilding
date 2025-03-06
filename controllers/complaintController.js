const Complaint =require ('../models/complaint.js');
const Tenant = require('../models/tenant.js');
const sendNotificationHelper= require('../helpers/sendAlert');
const User = require('../models/user.js');

// Create a new complaint with multiple image uploads
const createComplaint = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { description, urgency } = req.body;
    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const imagePaths = req.files ? req.files.map(file => file.path) : [];

    if (!tenantId || !description) {
      return res.status(400).json({ message: 'Tenant ID and description are required' });
    }

    const complaint = await Complaint.create({
      tenantId,
      description,
      urgency,
      images: imagePaths,
    });

    const admins = await User.findAll({ where: { role: 'admin' } }); // Fetch all admins

    if (complaint && admins.length > 0) {
      // Send notification to each admin
      await Promise.all(
        admins.map((admin) =>
          sendNotificationHelper({
            adminId: admin.id,
            title: 'New Complaint from Tenant',
            body: `A new complaint has been submitted by ${tenant.fullName}. Please check the complaints page for more details.`,
            type: 'New Complaint',
            receiver_type: 'staff',
          })
        )
      );
    }

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error: error.message });
  }
};


// Get all complaints (admin view)
 const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.findAll(
      {
         include: { 
          model: Tenant,attributes: ['fullName', 'email', 'phoneNumber']
          },
     }
    );
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

// Assign a complaint to an employee
const assignComplaint = async (req, res) => {
  try {
    const { complaintId, employeeId } = req.body;
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const assignedEmployee = await User.findByPk(employeeId);
    if (!assignedEmployee) {
      return res.status(404).json({ message: 'Assigned employee not found' });
    }

    complaint.assignedEmployeeId = employeeId;
    complaint.status = 'in_progress';
    await complaint.save();

    const tenant = await Tenant.findByPk(complaint.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Send notifications concurrently
    await Promise.all([
      sendNotificationHelper({
        adminId: employeeId, // Employee receives the notification
        title: 'New Complaint Assigned',
        body: `A new complaint has been assigned to you. Please check the complaints page for more details.`,
        type: 'New Complaint',
        receiver_type: 'staff',
      }),

      sendNotificationHelper({
        adminId: tenant.id, // Tenant receives the notification
        title: 'Your Complaint is Processing',
        body: `Your complaint has been assigned to ${assignedEmployee.fname} ${assignedEmployee.lname}. The employee will visit you soon.`,
        type: 'Complaint Processing',
        receiver_type: 'tenant',
      }),
    ]);

    res.status(200).json({ message: 'Complaint assigned successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning complaint', error: error.message });
  }
};



// Update complaint status
 const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId, status } = req.body;
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({ message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint status', error: error.message });
  }
};


// Confirm or reopen a complaint (tenant feedback)
 const confirmComplaintResolution = async (req, res) => {
  try {
    const { complaintId, feedback } = req.body;
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!['satisfied', 'not_satisfied'].includes(feedback)) {
      return res.status(400).json({ message: 'Invalid feedback' });
    }

    complaint.tenantFeedback = feedback;
    if (feedback === 'not_satisfied') {
      complaint.status = 'in_progress';
    }
    await complaint.save();

    res.status(200).json({ message: 'Complaint feedback submitted successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint feedback', error: error.message });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await complaint.destroy();
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting complaint', error: error.message });
  }
};
const getSingleComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findByPk(complaintId
      , { include: { model: Tenant,attributes: ['fullName', 'email', 'phoneNumber'] } }
    );

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaint', error: error.message });
  }
}
const getTenantComplaints = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const complaints = await Complaint.findAll({ where: { tenantId } }
      , { include: { model: Tenant,attributes: ['fullName', 'email', 'phoneNumber'] } }
    );

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};
const getAssignedComplaints = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const complaints = await Complaint.findAll({
      where: { assignedEmployeeId: employeeId },
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
        },
        {
          model: User,
          attributes: ['fname', 'lname', 'email', 'phoneNumber'],
          as: 'assignedEmployee',
        },
      ],
    });

    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

module.exports={
createComplaint,
getAllComplaints,
assignComplaint,
updateComplaintStatus,
confirmComplaintResolution,
deleteComplaint,
getSingleComplaint,
getTenantComplaints,
getAssignedComplaints,
}