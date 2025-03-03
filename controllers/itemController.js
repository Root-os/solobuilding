const Item = require("../models/item");
const ItemType = require("../models/itemCategory");
const { Op } = require("sequelize");



// Valid item types
const validItemTypes = ["Purchase", "Existing"];

// Create Item

exports.createItem = async (req, res) => {
  try {
    const { itemName, expirationDate, itemAmount, itemType, unit, itemDetails,itemCategoryId,min_amount } = req.body;

    // Validate itemType
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({ message: "Invalid item type. Valid types are 'Purchase' or 'Existing'" });
    }



   

    // Create item in the database
    const newItem = await Item.create({
      itemName,
      itemCategoryId,
      expirationDate,
      itemAmount,
      itemType,  
      unit,
      itemDetails,
      min_amount,
    });

    return res.status(201).json({ message: "Item created successfully", newItem });
  } catch (error) {
    return res.status(500).json({ message: "Error creating item", error: error.message });
  }
};


// Get All Items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.findAll();
    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching items", error: error.message });
  }
};

// Get Item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item", error: error.message });
  }
};
exports.getItemByCategoryId = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item", error: error.message });
  }
};

// Get Expired Items
exports.getExpiredItems = async (req, res) => {
  try {
    const today = new Date();

    const expiredItems = await Item.findAll({
      where: {
        expirationDate: {
          [Op.lt]: today, // Less than today's date
        },
      },
    });

    return res.status(200).json(expiredItems);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching expired items", error: error.message });
  }
};

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { itemName, expirationDate, itemAmount, itemType, unit, itemCategoryId, itemDetails,min_amount } = req.body;

    // Validate itemType
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({ message: "Invalid item type. Valid types are 'Purchase' or 'Existing'" });
    }

    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    

    // Update the item in the database
    await item.update({
      itemName,
      expirationDate,
      itemAmount,
      itemType,  
      unit,
      itemCategoryId,
      itemDetails,
      min_amount,
    });

    return res.status(200).json({ message: "Item updated successfully", item });
  } catch (error) {
    return res.status(500).json({ message: "Error updating item", error: error.message });
  }
};


// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if the item amount is below the min_amount before deletion
    if (item.itemAmount < item.min_amount) {
      return res.status(400).json({
        message: `Item ${item.itemName} has low stock (Amount: ${item.itemAmount}) and cannot be deleted.`
      });
    }

    await item.destroy();

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting item", error: error.message });
  }
};





