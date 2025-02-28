const Item = require("../models/item");
const ItemType = require("../models/itemCategory");
const { Op } = require("sequelize");



// Valid item types
const validItemTypes = ["Purchase", "Existing"];

// Create Item
// Create Item
exports.createItem = async (req, res) => {
  try {
    const { itemName, expirationDate, itemAmount, itemType, unit, itemDetails,itemCategoryId } = req.body;

    // Validate itemType
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({ message: "Invalid item type. Valid types are 'Purchase' or 'Existing'" });
    }

    // Set default min_amount if it's not provided in the request (it's set to 10 in model by default)
    const minAmount = 10;  // Default value set in the model

    // Check if itemAmount is below the min_amount
    if (itemAmount < minAmount) {
      return res.status(400).json({
        message: `Item amount (${itemAmount}) is less than the minimum required amount of ${minAmount}. Please update the amount.`
      });
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
    const { itemName, expirationDate, itemAmount, itemType, unit, itemCategoryId, itemDetails } = req.body;

    // Validate itemType
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({ message: "Invalid item type. Valid types are 'Purchase' or 'Existing'" });
    }

    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if the updated itemAmount is less than the min_amount
    const minAmount = 10;  // Default min_amount value
    if (itemAmount < minAmount) {
      return res.status(400).json({
        message: `Updated item amount (${itemAmount}) is less than the minimum required amount of ${minAmount}. Please update the amount.`
      });
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



// Check Low Stock Alerts for All Items
exports.checkItemAmountAlert = async (req, res) => {
  try {
    const items = await Item.findAll();
    const lowStockItems = items.filter(item => item.itemAmount < item.min_amount);  // Check if itemAmount is less than min_amount

    if (lowStockItems.length > 0) {
      lowStockItems.forEach(item => {
        console.log(`ALERT: Item ${item.itemName} has low stock (Amount: ${item.itemAmount}, Min: ${item.min_amount}).`);
      });

      return res.status(200).json({
        message: "Low stock alert triggered.",
        lowStockItems: lowStockItems
      });
    } else {
      return res.status(200).json({ message: "No items with low stock." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error checking item amount alert", error: error.message });
  }
};

