const Item = require("../models/item");
const ItemType = require("../models/itemType");
const { Op } = require("sequelize");
// Create Item
exports.createItem = async (req, res) => {
  try {
    const { itemName, expirationDate, itemAmount, itemTypeId, unit, itemCategory, itemDetails } = req.body;

    // Validate item type
    const itemType = await ItemType.findByPk(itemTypeId);
    if (!itemType) {
      return res.status(400).json({ message: "Invalid Item Type ID" });
    }

    // Create item
    const newItem = await Item.create({
      itemName,
      expirationDate,
      itemAmount,
      itemTypeId,
      unit,
      itemCategory,
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
    const items = await Item.findAll({
      include: [{ model: ItemType, attributes: ["typeName"] }], // Get item type name only
    });

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching items", error: error.message });
  }
};

// Get Item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id, {
      include: [{ model: ItemType, attributes: ["typeName"] }],
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    return res.status(200).json(item);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item", error: error.message });
  }
};
exports.getExpiredItems = async (req, res) => {
    try {
      const today = new Date();
  
      const expiredItems = await Item.findAll({
        where: {
          expirationDate: {
            [Op.lt]: today, // Less than today's date
          },
        },
        include: [{ model: ItemType, attributes: ["typeName"] }],
      });
  
      return res.status(200).json(expiredItems);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching expired items", error: error.message });
    }
  };

// Update Item
exports.updateItem = async (req, res) => {
  try {
    const { itemName, expirationDate, itemAmount, itemTypeId, unit, itemCategory, itemDetails } = req.body;

    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.update({ itemName, expirationDate, itemAmount, itemTypeId, unit, itemCategory, itemDetails });

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

    await item.destroy();

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting item", error: error.message });
  }
};
