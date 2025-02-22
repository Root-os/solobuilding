const Notification = require("../models/notification");
const PaymentRequest = require("../models/paymentRequests");
const Complaint = require("../models/complaint");

exports.getDashboardStats = async (req, res) => {
  try {
    // Notifications
    const totalNotifications = await Notification.count();
    const sentNotifications = await Notification.count({ where: { isRead: false } });
    const readNotifications = await Notification.count({ where: { isRead: true } });

    // Payments
    const totalPayments = await PaymentRequest.count();
    const pendingPayments = await PaymentRequest.count({ where: { status: "pending" } });
    const completedPayments = await PaymentRequest.count({ where: { status: "approved" } });

    // Complaints
    const totalComplaints = await Complaint.count();
    const inProgressComplaints = await Complaint.count({ where: { status: "in_progress" } });
    const resolvedComplaints = await Complaint.count({ where: { status: "resolved" } });
    const notResolvedComplaints = await Complaint.count({ where: { status: "pending" } });

    res.json({
      notifications: { totalNotifications, sentNotifications, readNotifications },
      payments: { totalPayments, pendingPayments, completedPayments },
      complaints: { totalComplaints, inProgressComplaints, resolvedComplaints, notResolvedComplaints }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
