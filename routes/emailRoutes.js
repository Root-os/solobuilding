const express = require("express");
const {
  sendEmailToTenant,
  sendBulkEmailToTenants,
  getReceivedEmails,
  getSentEmails,
  markEmailAsRead,
  deleteEmail,
} = require("../controllers/emailController");
const { adminAuth, tenantAuth } = require("../middleware/auth");
const router = express.Router();

// Send an email to a specific tenant (Admin only)
router.post("/send", adminAuth, sendEmailToTenant);

// Send bulk email to all tenants (Admin only)
router.post("/send-bulk", adminAuth, sendBulkEmailToTenants);

// Get received emails for a tenant
router.get("/received", tenantAuth, getReceivedEmails);

// Get sent emails (Admin only)
router.get("/sent", adminAuth, getSentEmails);

// Mark email as read (Tenant only)
router.patch("/mark-read/:emailId", tenantAuth, markEmailAsRead);

// Delete email (Tenant/Admin)
router.delete("/delete/:emailId", tenantAuth, deleteEmail);

module.exports = router;
