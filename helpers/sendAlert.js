const Notification = require("../models/notification");
const NotificationType = require("../models/notificationType");

const sendNotificationHelper = async (adminId, title, body) => {
  try {
    // Check if the "Stock Level Low" notification type exists
    let notificationType = await NotificationType.findOne({
      where: { name: "Low Stock Alert!" },
    });

    // If it doesn't exist, create it
    if (!notificationType) {
      notificationType = await NotificationType.create({
        name: "Low Stock Alert!",
      });
      console.log("Created new notification type: Stock Level Low");
    }

    // Create notification for the specified admin
    await Notification.create({
      title,
      body,
      type_id: notificationType.id, // Use the existing or newly created type ID
      receiver_type: "staff", // Assuming admin falls under "staff"
      receiver_id: adminId,
    });

    console.log(`Notification sent to admin with ID: ${adminId}`);
  } catch (error) {
    console.error("Error sending notification to admin:", error);
  }
};

module.exports = sendNotificationHelper;
