const Return = require("../models/return");
const Vendor = require("../models/Vendor");
const Item = require("../models/item");
const { returnValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");

// Create Return
exports.createReturn = async (req, res) => {
  try {
    const { error } = returnValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { vendorId, itemId, quantity, reason } = req.body;

    // Fetch the item to check its current amount
    const item = await Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Validate the return quantity
    if (quantity > item.itemAmount) {
      return res.status(400).json({
        message: `Return quantity (${quantity}) exceeds available item amount (${item.itemAmount}). Please adjust the quantity.`,
      });
    }

    // Create the return process
    const returnedItem = await Return.create({
      vendorId,
      itemId,
      quantity,
      reason,
    });

    // Update the item amount in the Item table
    item.itemAmount -= quantity;
    await item.save();

    res.status(201).json(returnedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Returns
exports.getAllReturns = async (req, res) => {
  try {
    const returns = await Return.findAll({
      include: [Vendor, Item],
    });
    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Return by ID
exports.getReturnById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const returnedItem = await Return.findByPk(req.params.id, {
      include: [Vendor, Item],
    });

    if (!returnedItem) {
      return res.status(404).json({ message: "Return not found" });
    }

    res.status(200).json(returnedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Return
exports.updateReturn = async (req, res) => {
  try {
    const { error } = returnValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { vendorId, itemId, quantity, reason } = req.body;
    const { errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res.status(400).json({ message: errorId.details[0].message });
    }
    const returnedItem = await Return.findByPk(req.params.id);

    if (!returnedItem) {
      return res.status(404).json({ message: "Return not found" });
    }

    // Fetch the item to check its current amount
    const item = await Item.findByPk(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Validate the return quantity
    if (quantity > item.itemAmount) {
      return res.status(400).json({
        message: `Return quantity (${quantity}) exceeds available item amount (${item.itemAmount}). Please adjust the quantity.`,
      });
    }

    returnedItem.vendorId = vendorId;
    returnedItem.itemId = itemId;
    returnedItem.quantity = quantity;
    returnedItem.reason = reason;

    await returnedItem.save();

    // Update the item amount in the Item table
    item.itemAmount -= quantity;
    await item.save();

    res.status(200).json(returnedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Return
exports.deleteReturn = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const returnedItem = await Return.findByPk(req.params.id);

    if (!returnedItem) {
      return res.status(404).json({ message: "Return not found" });
    }

    // Fetch the item to update its amount
    const item = await Item.findByPk(returnedItem.itemId);

    if (item) {
      // Update the item amount in the Item table
      item.itemAmount += returnedItem.quantity;
      await item.save();
    }

    await returnedItem.destroy();

    res.status(200).json({ message: "Return deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
