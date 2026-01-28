const Email = require("../models/email");
const Tenant = require("../models/tenant");
const sendEmail = require("../middleware/sendEmail");

// Send an email to a specific tenant (Admin only)
exports.sendEmailToTenant = async (req, res) => {
  try {
    const { receiverId, subject, content } = req.body;
    const senderId = req.user.id; // Get admin ID from JWT

    // Check if receiver exists
    const receiver = await Tenant.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Save email in the database
    const email = await Email.create({ senderId, receiverId, subject, content });

    // Send real-time email
    const emailResponse = await sendEmail(receiver.email, subject, content);

    res.status(201).json({ 
      message: "Email sent successfully", 
      email, 
      emailStatus: emailResponse 
    });

  } catch (error) {
    res.status(500).json({ message: "Error sending email", error });
  }
};

// Send bulk email to all tenants (Admin only)
exports.sendBulkEmailToTenants = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const senderId = req.user.id;

    // Fetch active tenants
    const tenants = await Tenant.findAll({
      where: { status: "active" },
      attributes: ["id", "email", "createdAt"],
      order: [["createdAt", "ASC"]] // deterministic
    });

    if (!tenants.length) {
      return res.status(404).json({ message: "No active tenants found" });
    }

    // ✅ Deduplicate by email (person-based)
    const uniqueTenantMap = new Map();

    for (const tenant of tenants) {
      if (tenant.email && !uniqueTenantMap.has(tenant.email)) {
        uniqueTenantMap.set(tenant.email, tenant);
      }
    }

    const uniqueTenants = Array.from(uniqueTenantMap.values());

    // ✅ Send emails
    const emailResponses = await Promise.all(
      uniqueTenants.map(async (tenant) => {
        // Save email (person-representative tenantId)
        await Email.create({
          senderId,
          receiverId: tenant.id,
          subject,
          content
        });

        // Send actual email
        return sendEmail(tenant.email, subject, content);
      })
    );

    return res.status(201).json({
      message: "Bulk email sent successfully",
      sentCount: uniqueTenants.length,
      emailStatus: emailResponses
    });

  } catch (error) {
    console.error("Error sending bulk email:", error);
    return res.status(500).json({
      message: "Error sending bulk email",
      error: error.message || error
    });
  }
};

// Get received emails for a tenant
exports.getReceivedEmails = async (req, res) => {
  try {
    const userId = req.user.id; // Tenant ID from JWT

    const emails = await Email.findAll({
      where: { receiverId: userId },
      order: [["createdAt", "DESC"]],
            include: [
        {
          model: Tenant,
          as: "receiver",
          attributes: ["id", "fullName", "email"]
        }
      ]
    });

    res.json({ emails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching received emails", error });
  }
};

// Get sent emails (Admin only)
exports.getSentEmails = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin ID from JWT

    const emails = await Email.findAll({
      where: { senderId: adminId },
      order: [["createdAt", "DESC"]],
                  include: [
        {
          model: Tenant,
          as: "receiver",
          attributes: ["id", "fullName", "email"]
        }
      ]
    });

    res.json({ emails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching sent emails", error });
  }
};

// Mark email as read
exports.markEmailAsRead = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id; // Tenant ID from JWT

    const email = await Email.findByPk(emailId);
    if (!email || email.receiverId !== userId) {
      return res.status(404).json({ message: "Email not found" });
    }

    await email.update({ status: "read" });

    res.json({ message: "Email marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error updating email status", error });
  }
};

// Delete email (Soft delete)
exports.deleteEmail = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id; // Sender or receiver ID from JWT

    const email = await Email.findByPk(emailId);
    if (!email || (email.senderId !== userId && email.receiverId !== userId)) {
      return res.status(404).json({ message: "Email not found" });
    }
    await email.destroy(); // Soft delete (if using paranoid: true in Sequelize)

    res.json({ message: "Email deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting email", error });
  }
};

exports.deleteEmailAdmin = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id; // Sender or receiver ID from JWT

    const email = await Email.findByPk(emailId);
    if (!email || (email.senderId !== userId && email.receiverId !== userId)) {
      return res.status(404).json({ message: "Email not found" });
    }
    await email.destroy(); // Soft delete (if using paranoid: true in Sequelize)

    res.json({ message: "Email deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting email", error });
  }
};
