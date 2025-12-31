const express = require("express");
const {
  sendEmailToTenant,
  sendBulkEmailToTenants,
  getReceivedEmails,
  getSentEmails,
  markEmailAsRead,
  deleteEmail,
} = require("../controllers/emailController");
const { adminAuth, tenantAuth, adminOrEmployeeAuth } = require("../middleware/auth");
const router = express.Router();


router.post("/send", adminOrEmployeeAuth, sendEmailToTenant);
router.post("/send-bulk", adminOrEmployeeAuth, sendBulkEmailToTenants);


router.get("/sent", adminOrEmployeeAuth, getSentEmails);
router.get("/received", tenantAuth, getReceivedEmails);

// Mark email as read (Tenant only)
router.patch("/mark-read/:emailId", tenantAuth, markEmailAsRead);

// Delete email (Tenant/Admin)
router.delete("/delete/:emailId", tenantAuth, deleteEmail);
router.delete("/delete-admin/:emailId", adminOrEmployeeAuth, deleteEmail);


module.exports = router;
