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
  updateComplaint,
  getAssignedComplaints,
} =require( '../controllers/complaintController.js');
const { adminAuth, tenantAuth, } = require("../middleware/auth");


// Tenant submits a complaint with images
router.post('/submit', upload.array('images', 5), tenantAuth,createComplaint);

// Admin views all complaints
router.get('/all', getAllComplaints);

// Admin assigns a complaint to a staff member
router.put('/assign',adminAuth, assignComplaint);

// Admin updates complaint status
router.put('/update-status', adminAuth, updateComplaintStatus);

// Tenant confirms or reopens a complaint
router.put('/confirm-resolution', tenantAuth,confirmComplaintResolution);

// Admin deletes a complaint
router.delete('/delete/:complaintId',adminAuth, deleteComplaint);

// Get a single complaint
router.get('/get/:complaintId', getSingleComplaint);

// Get all complaints for a tenant
router.get('/tenant',tenantAuth, getTenantComplaints);
router.put(
  '/:complaintId',
  upload.array('images', 5),
  tenantAuth,
  updateComplaint
);


// Get all complaints assigned to a staff member
router.get('/assigned/:employeeId', getAssignedComplaints);



module.exports= router;
