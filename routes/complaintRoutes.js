import express from 'express';
import upload from '../middlewares/complaintUpload';
import {
  createComplaint,
  getAllComplaints,
  assignComplaint,
  updateComplaintStatus,
  confirmComplaintResolution,
} from '../controllers/complaintController.js';

const router = express.Router();

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

export default router;
