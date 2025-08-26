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

// Send an email to a specific tenant (Admin only)
router.post("/send", adminOrEmployeeAuth, sendEmailToTenant);

// Send bulk email to all tenants (Admin only)
router.post("/send-bulk", adminOrEmployeeAuth, sendBulkEmailToTenants);

// Get received emails for a tenant
router.get("/received", tenantAuth, getReceivedEmails);

// Get sent emails (Admin only)
router.get("/sent", adminOrEmployeeAuth, getSentEmails);

// Mark email as read (Tenant only)
router.patch("/mark-read/:emailId", tenantAuth, markEmailAsRead);

// Delete email (Tenant/Admin)
router.delete("/delete/:emailId", tenantAuth, deleteEmail);
router.delete("/delete-admin/:emailId", adminOrEmployeeAuth, deleteEmail);


module.exports = router;
