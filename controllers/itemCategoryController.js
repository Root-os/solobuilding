// controllers/ItemCategoryController.js
const ItemCategory  = require('../models/itemCategory');

exports.createItemCategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    // Check if ItemCategory already exists
    const existingItemCategory = await ItemCategory.findOne({ where: { categoryName } });
    if (existingItemCategory) {
      return res.status(400).json({ message: "Item type already exists." });
    }

    const itemCategory = await ItemCategory.create({ categoryName, description });

    return res.status(201).json(itemCategory);
  } catch (error) {
    return res.status(500).json({ message: "Error creating item type", error: error.message });
  }
};

exports.getAllItemCategorys = async (req, res) => {
  try {
    const itemCategory = await ItemCategory.findAll();
    return res.status(200).json(itemCategory);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item types", error: error.message });
  }
};

exports.getItemCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const itemCategory = await ItemCategory.findByPk(id);

    if (!itemCategory) {
      return res.status(404).json({ message: "Item type not found" });
    }

    return res.status(200).json(itemCategory);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching item type", error: error.message });
  }
};

exports.updateItemCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = req.body;

    const itemCategory = await ItemCategory.findByPk(id);

    if (!itemCategory) {
      return res.status(404).json({ message: "Item type not found" });
    }

    itemCategory.categoryName = categoryName || itemCategory.categoryName;
    itemCategory.description = description || itemCategory.description;

    await ItemCategory.save();

    return res.status(200).json(itemCategory);
  } catch (error) {
    return res.status(500).json({ message: "Error updating item type", error: error.message });
  }
};

exports.deleteItemCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const itemCategory = await ItemCategory.findByPk(id);

    if (!itemCategory) {
      return res.status(404).json({ message: "Item type not found" });
    }

    await ItemCategory.destroy();

    return res.status(200).json({ message: "Item type deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting item type", error: error.message });
  }
};
