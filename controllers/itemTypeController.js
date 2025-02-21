// controllers/itemTypeController.js
const ItemType  = require('../models/itemType');

exports.createItemType = async (req, res) => {
  try {
    const { typeName, description } = req.body;

    // Check if ItemType already exists
    const existingItemType = await ItemType.findOne({ where: { typeName } });
    if (existingItemType) {
      return res.status(400).json({ message: "Item type already exists." });
    }

    const itemType = await ItemType.create({ typeName, description });

    return res.status(201).json(itemType);
  } catch (error) {
    return res.status(500).json({ message: "Error creating item type", error: error.message });
  }
};

exports.getAllItemTypes = async (req, res) => {
  try {
    const itemTypes = await ItemType.findAll();
    return res.status(200).json(itemTypes);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item types", error: error.message });
  }
};

exports.getItemTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const itemType = await ItemType.findByPk(id);

    if (!itemType) {
      return res.status(404).json({ message: "Item type not found" });
    }

    return res.status(200).json(itemType);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item type", error: error.message });
  }
};

exports.updateItemType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeName, description } = req.body;

    const itemType = await ItemType.findByPk(id);

    if (!itemType) {
      return res.status(404).json({ message: "Item type not found" });
    }

    itemType.typeName = typeName || itemType.typeName;
    itemType.description = description || itemType.description;

    await itemType.save();

    return res.status(200).json(itemType);
  } catch (error) {
    return res.status(500).json({ message: "Error updating item type", error: error.message });
  }
};

exports.deleteItemType = async (req, res) => {
  try {
    const { id } = req.params;

    const itemType = await ItemType.findByPk(id);

    if (!itemType) {
      return res.status(404).json({ message: "Item type not found" });
    }

    await itemType.destroy();

    return res.status(200).json({ message: "Item type deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting item type", error: error.message });
  }
};
