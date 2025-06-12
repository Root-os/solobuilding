const Notification = require("../models/notification");
const NotificationType = require("../models/notificationType");
const User = require("../models/user");
const Tenant = require("../models/tenant");

const sendNotificationHelper = async ({ adminId, title, body, type = "Low Stock Alert!", receiver_type = "staff" }) => {
  try {
    // Check if the specified notification type exists
    let notificationType = await NotificationType.findOne({ where: { name: type } });

    // If it doesn't exist, create it
    if (!notificationType) {
      notificationType = await NotificationType.create({ name: type });
      console.log(`Created new notification type: ${type}`);
    }
if (receiver_type === 'tenant') {
  const tenant = await Tenant.findByPk(adminId);
  if (!tenant) throw new Error('Tenant not found');
  const notification= await Notification.create({
      title,
      body,
      type_id: notificationType.id, // Use the existing or newly created type ID
      receiver_type,
      receiver_id: adminId,
    });
        console.log(`Notification sent to Tenant with ID: ${adminId}, Notification: ${JSON.stringify(notification)}`);

} else {
  const user = await User.findByPk(adminId);
  if (!user) throw new Error('User not found');
 const notification= await Notification.create({
      title,
      body,
      type_id: notificationType.id, // Use the existing or newly created type ID
      receiver_type,
      receiver_id: adminId,
    });
        console.log(`Notification sent to admin with ID: ${adminId},  Notification: ${JSON.stringify(notification)}`);

}

   

  } catch (error) {
    console.error("Error sending notification to admin:", error);
  }
};

module.exports = sendNotificationHelper;
