const NotificationType = require("../models/notificationType");


// Controller for creating notification type
const createNotificationType = async (req, res) => {
  try {
    
if (req.user.role!=="admin") {
  return res.status(403).json({ message: "You are not authorized to perform this action" });
}
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name of notification is required." });
    }

    // Check if name already exists (Optional)
    const existingType = await NotificationType.findOne({ where: { name } });
    if (existingType) {
      return res.status(400).json({ message: "Notification type already exists." });
    }

    const type = await NotificationType.create({ name });
    return res.status(201).json({ message: "Notification type created successfully.", type });
  } catch (error) {
    console.error("Error creating notification type:", error);
    return res.status(500).json({ message: "Failed to create notification type.",error });
  }
};

// Controller for fetching notification types
const getNotificationTypes = async (req, res) => {
  try {
    const types = await NotificationType.findAll();
    return res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching notification types:", error);
    return res.status(500).json({ message: "Failed to fetch notification types." });
  }
};

const updateNotificationType = async (req, res) => {
  try {
    const { id } = req.params;
if(!id){
    return res.status(400).json({message:"notification id to be updated is required"})
}
    const { name } = req.body;
    if(!name){
    return res.status(400).json({ message: "New Notification type name is required." });
    }
    const type = await NotificationType.findByPk(id);

    if (!type) {
      return res.status(404).json({ message: "Notification type not found." });
    }

    if(type.name===name){
      return res.status(400).json({ message: "Notification type is not changed." });
    }
    const existingType = await NotificationType.findOne({ where: { name } });
    if (existingType) {
      return res.status(400).json({ message: "Notification type already exists." });
    }
    type.name!==name&& (type.name = name);
    await type.save();

    return res.status(200).json({ message: "Notification type updated successfully.", type });
  } catch (error) {
    console.error("Error updating notification type:", error);
    return res.status(500).json({ message: "Failed to update notification type." });
  }
};

// Controller for deleting notification type
const deleteNotificationType = async (req, res) => {
  try {
    const { id } = req.params;

    const type = await NotificationType.findByPk(id);
    if (!type) {
      return res.status(404).json({ message: "Notification type not found." });
    }

    await type.destroy();
    return res.status(204).json({ message: "Notification type deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification type:", error);
    return res.status(500).json({ message: "Failed to delete notification type." });
  }
};



module.exports = {
  createNotificationType,
  getNotificationTypes,
  updateNotificationType,
  deleteNotificationType,
};
