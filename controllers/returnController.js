const Return = require("../models/return");
const Vendor = require("../models/Vendor");
const Item = require("../models/item");
const { returnValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const { Op } = require('sequelize');

// Create Return
exports.createReturn = async (req, res) => {
  try {
    const { error } = returnValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { vendorId, itemId, quantity, reason,returnDate } = req.body;

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
      returnDate,
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
    const { vendorId, itemId, quantity, reason,returnDate } = req.body;
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
    // Update the return process
    returnedItem.returnDate = returnDate,
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

// Generate Return Report by Close Match Item ID and Vendor ID with Date Filter and date
exports.generateReturnReport = async (req, res) => {
  try {
    const { vendorId, itemId, startDate, endDate } = req.body;

    // Date validation: Ensure that startDate is before endDate
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "startDate cannot be later than endDate." });
    }

    let whereConditions = {};

    if (vendorId) {
      whereConditions.vendorId = vendorId;
    }

    if (itemId) {
      whereConditions.itemId = itemId;
    }

    // Add the date range condition to the query
    if (startDate && endDate) {
      whereConditions.returnDate = {
        [Op.gte]: new Date(startDate),  // Greater than or equal to startDate
        [Op.lte]: new Date(endDate),    // Less than or equal to endDate
      };
    } else if (startDate) {
      whereConditions.returnDate = {
        [Op.gte]: new Date(startDate),  // Only filter after startDate
      };
    }

    const returns = await Return.findAll({
      where: whereConditions,
      include: [
        {
          model: Vendor,
          required: true,
        },
        {
          model: Item,
          required: true,
        },
      ],
    });

    if (!returns || returns.length === 0) {
      return res.status(404).json({ message: "No returns found for the given filters." });
    }

    // Return the matched data
    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Return by Item ID
exports.getReturnsByItemId = async (req, res) => {
  try {
    const returns = await Return.findAll({
      where: { itemId: req.params.itemId },
      include: [Item, Vendor],
    });

    if (!returns || returns.length === 0) {
      return res
        .status(404)
        .json({ message: "No returns found for this item" });
    }

    // Group returns by itemId
    const groupedReturns = {};

    returns.forEach((returnItem) => {
      const itemId = returnItem.itemId;

      // Initialize item if not already in the groupedReturns object
      if (!groupedReturns[itemId]) {
        groupedReturns[itemId] = {
          item: returnItem.Item,
          vendors: [],
        };
      }

      // Push the vendor to the corresponding item's vendor list
      groupedReturns[itemId].vendors.push(returnItem.Vendor);
    });

    // Format the response
    const response = Object.values(groupedReturns).map((itemData) => ({
      item: itemData.item,
      vendors: itemData.vendors,
    }));

    // Return the grouped data
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getReturnsByVendorId = async (req, res) => {
  try {
    // Fetch returns based on the provided vendorId
    const returns = await Return.findAll({
      where: { vendorId: req.params.vendorId },
      include: [
        {
          model: Vendor,
          required: true,
        },
        {
          model: Item,
          required: true,
        },
      ],
    });

    // Check if any returns were found
    if (!returns || returns.length === 0) {
      return res
        .status(404)
        .json({ message: "No returns found for the given Vendor ID." });
    }

    // Group returns by vendorId
    const groupedReturns = {};

    returns.forEach((returnItem) => {
      const vendorId = returnItem.vendorId;

      // Initialize vendor if not already in the groupedReturns object
      if (!groupedReturns[vendorId]) {
        groupedReturns[vendorId] = {
          vendor: returnItem.Vendor,
          items: [],
        };
      }

      // Push the item to the corresponding vendor's item list
      groupedReturns[vendorId].items.push(returnItem.Item);
    });

    // Format the response
    const response = Object.values(groupedReturns).map((vendorData) => ({
      vendor: vendorData.vendor,
      items: vendorData.items,
    }));

    // Return the grouped data
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


