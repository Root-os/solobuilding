const Complaint =require ('../models/complaint.js');

// Create a new complaint with multiple image uploads
 const createComplaint = async (req, res) => {
  try {
    const { tenantId, description, urgency } = req.body;
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

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error: error.message });
  }
};

// Get all complaints (admin view)
 const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.findAll();
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

    complaint.assignedEmployeeId = employeeId;
    complaint.status = 'in_progress';
    await complaint.save();

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

module.exports={
createComplaint,
 getAllComplaints,
 assignComplaint,
 updateComplaintStatus,
 confirmComplaintResolution,
}