const Notification = require("../models/NotificationModel");
const NotificationType = require("../models/notificationType");
// Generic function to create a notification
const createNotification = async (data) => {
  try {
  
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Helper function to get NotificationType by name
const getNotificationTypeId = async (typeName) => {
  try {
    const type = await NotificationType.findOne({ where: { name: typeName } });
    if (!type) {
      throw new Error(`Notification type "${typeName}" does not exist.`);
    }
    return type.id;
  } catch (error) {
    console.error("Error fetching notification type:", error);
    throw error;
  }
};

// Create a notification for a book
const createBookNotification = async (bookData, userId) => {
  console.log(`Creating book notification for user ID: ${userId}`);
  if (!userId) {
    throw new Error("User ID is required for creating a notification.");
  }

  if (!bookData.title || !bookData.description) {
    throw new Error("Invalid book data passed for notification.");
  }

  try {
    // Get the type_id for "BOOK"
    const typeId = await getNotificationTypeId("BOOK");

    const notificationData = {
      title: bookData.title,
      body: bookData.description,
      type_id: typeId,
      user_id: userId,
    };

    return await createNotification(notificationData);
  } catch (error) {
    console.error("Error creating book notification:", error);
    throw error;
  }
};

// Create a notification for an announcement
const createAnnouncementNotification = async (announcement, userId) => {
  console.log(`Creating announcement notification for user ID: ${userId}`);
  if (!userId) {
    throw new Error("User ID is required for creating a notification.");
  }

  if (!announcement.title || !announcement.content) {
    throw new Error("Invalid announcement data passed for notification.");
  }

  try {
    // Get the type_id for "ANNOUNCEMENT"
    const typeId = await getNotificationTypeId("ANNOUNCEMENT");

    const notificationData = {
      title: announcement.title,
      body: announcement.content,
      type_id: typeId,
      user_id: userId,
    };

    return await createNotification(notificationData);
  } catch (error) {
    console.error("Error creating announcement notification:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createBookNotification,
  createAnnouncementNotification,
};