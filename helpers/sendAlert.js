const Notification = require("../models/notification");
const NotificationType = require("../models/notificationType");

const sendNotificationHelper = async ({ adminId, title, body, type = "Low Stock Alert!", receiver_type = "staff" }) => {
  try {
    // Check if the specified notification type exists
    let notificationType = await NotificationType.findOne({ where: { name: type } });

    // If it doesn't exist, create it
    if (!notificationType) {
      notificationType = await NotificationType.create({ name: type });
      console.log(`Created new notification type: ${type}`);
    }

    // Create the notification
    await Notification.create({
      title,
      body,
      type_id: notificationType.id, // Use the existing or newly created type ID
      receiver_type,
      receiver_id: adminId,
    });

    console.log(`Notification sent to admin with ID: ${adminId}`);
  } catch (error) {
    console.error("Error sending notification to admin:", error);
  }
};

module.exports = sendNotificationHelper;
