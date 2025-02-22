const express = require("express");
const router = express.Router();
const upload =require('../middleware/complaintUpload');
const {
  createComplaint,
  getAllComplaints,
  assignComplaint,
  updateComplaintStatus,
  confirmComplaintResolution,
  deleteComplaint,
  getSingleComplaint,
  getTenantComplaints,
  getAssignedComplaints,
} =require( '../controllers/complaintController.js');


// Tenant submits a complaint with images
router.post('/submit', upload.array('images', 5), createComplaint);

// Admin views all complaints
router.get('/all', getAllComplaints);

// Admin assigns a complaint to a staff member
router.put('/assign', assignComplaint);

// Admin updates complaint status
router.put('/update-status', updateComplaintStatus);

// Tenant confirms or reopens a complaint
router.put('/confirm-resolution', confirmComplaintResolution);

// Admin deletes a complaint
router.delete('/delete/:complaintId', deleteComplaint);

// Get a single complaint
router.get('/get/:complaintId', getSingleComplaint);

// Get all complaints for a tenant
router.get('/tenant/:tenantId', getTenantComplaints);

// Get all complaints assigned to a staff member
router.get('/assigned/:employeeId', getAssignedComplaints);


module.exports= router;
