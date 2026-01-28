const Complaint =require ('../models/complaint.js');
const Tenant = require('../models/tenant.js');
const Unit = require('../models/unit');
const Floor = require("../models/floor");
const sendNotificationHelper= require('../helpers/sendAlert');
const User = require('../models/user.js');
const Role = require('../models/role.js');
const { BASE_URL } = require('../config/config');
const sendEmailMessage = require('../services/sendEmailMessage');

// Create a new complaint with multiple image uploads
const createComplaint = async (req, res) => {
  try {
    const { tenantId, description, urgency } = req.body;

    const tenant = await Tenant.findOne({
      where: {
        id: tenantId,
        phoneNumber: req.user.phone,
      },
    });

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

    const admins = await User.findAll({
      include: [{
        model: Role,
        where: { name: 'admin' },
      }],
    }); // Fetch all admins

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
    const complaints = await Complaint.findAll({
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] }
          ],
        },
        {
          model: User,
          attributes: ['fname', 'lname'],
          as: 'assignedEmployee',
        },
      ],
    });

    const complaintsWithFullImageUrls = complaints.map(complaint => {
      let imageUrls = [];

      try {
        const imagePaths = JSON.parse(complaint.images || '[]');
        imageUrls = imagePaths.map(img =>
          `${BASE_URL}/${img.replace(/\\\\/g, '/')}` // Normalize path
        );
      } catch (err) {
        imageUrls = [];
      }

      return {
        ...complaint.toJSON(),
        images: imageUrls,
      };
    });

    res.status(200).json(complaintsWithFullImageUrls);
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

    // Assign employee to the complaint and set status
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

    // Send the complaint along with the assigned employee information in the response
    res.status(200).json({
      message: 'Complaint assigned successfully',
      complaint: {
        ...complaint.toJSON(),  // Convert complaint to plain object
        assignedEmployee: {
          id: assignedEmployee.id,
          fname: assignedEmployee.fname,
          lname: assignedEmployee.lname,
          email: assignedEmployee.email,  // Add any other relevant details
          phoneNumber: assignedEmployee.phoneNumber,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning complaint', error: error.message });
  }
};

//tenant get its own complaints
const getTenantComplaints = async (req, res) => {
  try {
    const phoneNumber = req.user.phone; 

    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ['id'],
    });

    const tenantIds = tenants.map(t => t.id);
    
    const complaints = await Complaint.findAll({
      where: { tenantId: tenantIds, },
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] }
          ],
        },
        {
          model: User,
          as: 'assignedEmployee',
          attributes: ['id', 'fname', 'lname'],
        }
      ]
    });

    const updatedComplaints = complaints.map((complaint) => {
      let parsedImages = [];

      try {
        parsedImages = complaint.images ? JSON.parse(complaint.images) : [];
      } catch (err) {
        console.error('Invalid image JSON:', complaint.images);
      }

      const fullImageUrls = parsedImages.map((imgPath) =>
        `${BASE_URL}/${imgPath.replace(/\\/g, '/')}`
      );

      return {
        ...complaint.toJSON(),
        images: fullImageUrls,
      };
    });

    res.status(200).json(updatedComplaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching complaints', error: error.message });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const tenantId = req.user.id;
        const complaint = await Complaint.findOne({
      where: { id: complaintId, tenantId },
      include: [
        {
          model: Tenant,
          attributes: ['id', 'fullName', 'email', 'phoneNumber'],
          include: [
            { model: Unit, attributes: ['id', 'unitNumber'] },
            { model: Floor, attributes: ['id', 'floorNumber'] },
          ],
        },
        {
          model: User,
          attributes: ['fname', 'lname'],
          as: 'assignedEmployee',
        },
      ],
    });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    let finalImages = Array.isArray(complaint.images) ? [...complaint.images] : [];

    // If frontend touched existing images
    if (req.body.existingImages !== undefined) {
      try {
        finalImages = JSON.parse(req.body.existingImages);
      } catch {
        return res.status(400).json({ error: '"existingImages" must be a valid JSON array' });
      }
    }

    // Append new uploads
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(file => file.path.replace(/\\/g, "/"));
      finalImages.push(...uploadedImages);
    }

    const updateData = {
      description: req.body.description ?? complaint.description,
      urgency: req.body.urgency ?? complaint.urgency,
    };

    if (req.body.existingImages !== undefined || (req.files && req.files.length > 0)) {
      updateData.images = finalImages;
    }

    await complaint.update(updateData);

    // Return complaint with full URL images
    const host = `${req.protocol}://${req.get('host')}`;
    const imagesWithFullURL = finalImages.map(img => `${host}/${img}`);

    res.status(200).json({
      message: 'Complaint updated successfully',
      complaint: {
        ...complaint.get({ plain: true }),
        images: imagesWithFullURL,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating complaint',
      error: error.message,
    });
  }
};


// Update complaint status
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId, status } = req.body;
    console.log('Received request to update complaint:', complaintId, 'to status:', status);

    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      console.log('Complaint not found with ID:', complaintId);
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      console.log('Invalid status provided:', status);
      return res.status(400).json({ message: 'Invalid status' });
    }

    complaint.status = status;
    await complaint.save();
    console.log('Complaint status updated in DB');

    const tenant = await Tenant.findByPk(complaint.tenantId);
    if (!tenant) {
      console.log('Tenant not found with ID:', complaint.tenantId);
      return res.status(404).json({ message: 'Tenant not found' });
    }

    console.log('Sending notification to tenant:', tenant.id, tenant.fullName);
    await sendNotificationHelper({
      adminId: tenant.id,
      title: 'Complaint Status Update',
      body: `Your complaint status has been updated to ${status}. Please check the complaints page for more details.`,
      type: 'Complaint Status Update',
      receiver_type: 'tenant',
    });

    // Send email notification to tenant
    const emailResponse = await sendEmailMessage({
      email: tenant.email,
      fullName: tenant.fullName,
      title: 'Complaint Status Update',
      body: `Dear ${tenant.fullName},<br><br>Your complaint status has been updated to <strong>${status}</strong>. Please check the complaints page for more details.<br><br>Regards,<br>Apartment Management Team`,
    });

    console.log('Notification sent successfully');

    res.status(200).json({ message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    console.error('Error updating complaint status:', error.message);
    res.status(500).json({ message: 'Error updating complaint status', error: error.message });
  }
};

// Confirm or reopen a complaint (tenant feedback)
const confirmComplaintResolution = async (req, res) => {
  try {
    const { complaintId, feedback } = req.body;
      const complaint = await Complaint.findByPk(complaintId, {
      include: [
        {
          model: User,
          as: 'assignedEmployee',
          attributes: ['id', 'fname', 'lname'],
        }
      ]
    });

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

    // ✅ Process image paths into full URLs
    let imageUrls = [];
    try {
      const imagePaths = JSON.parse(complaint.images || '[]');
      imageUrls = imagePaths.map(img =>
        `${BASE_URL}/${img.replace(/\\\\/g, '/')}` // Normalize path
      );
    } catch (err) {
      imageUrls = [];
    }

    const updatedComplaint = {
      ...complaint.toJSON(),
      images: imageUrls,
    };

    res.status(200).json({
      message: 'Complaint feedback submitted successfully',
      complaint: updatedComplaint,
    });

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

const getAssignedComplaints = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const complaints = await Complaint.findAll({
      where: { assignedEmployeeId: employeeId },
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
           include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] }
          ],
        },
        {
          model: User,
          attributes: ['fname', 'lname', 'email'],
          as: 'assignedEmployee',
        },
      ],
    });

    // Add full URL for images
    const complaintsWithFullImageUrls = complaints.map(complaint => {
      let imageUrls = [];

      try {
        const imagePaths = JSON.parse(complaint.images || '[]'); // Parse images if stored as JSON
        imageUrls = imagePaths.map(img =>
          `${BASE_URL}/${img.replace(/\\/g, '/')}` // Normalize path and prepend BASE_URL
        );
      } catch (err) {
        imageUrls = [];
      }

      return {
        ...complaint.toJSON(),
        images: imageUrls,
      };
    });

    res.status(200).json(complaintsWithFullImageUrls);
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
updateComplaint,
getAssignedComplaints,
}