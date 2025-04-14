const Purchase = require("../models/purchase");
const Item = require("../models/item");
const ItemType = require("../models/itemCategory");
const { Sequelize } = require("sequelize");
const { purchaseValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const Vendor = require("../models/Vendor");

exports.createPurchase = async (req, res) => {
  try {
    const { error } = purchaseValidationSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    const {
      vendorId,
      amount,
      price,
      description,
      expirationDate,
      itemId,
      itemTypeId,
    } = req.body;

    const totalPrice = amount * price;

    const newPurchase = await Purchase.create({
      vendorId,
      amount,
      price,
      totalPrice,
      description,
      expirationDate,
      itemId,
      itemTypeId,
    });

    res.status(201).json(newPurchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all purchases (Only display totalPrice)
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      include: [Item, ItemType, Vendor],
    
      attributes: [
        "id",
        "vendorId",
        "amount",
        "price",
        "totalPrice",
        "description",
        "date",
        "expirationDate",
        "itemId",
        "ItemCategoryId",
      ],
    });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a purchase by ID (Only display totalPrice)
exports.getPurchaseById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    }
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [Item, ItemType],
      attributes: [
        "id",
        "vendorId",
        "totalPrice",
        "description",
        "expirationDate",
        "itemId",
        "ItemCategoryId",
      ],
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a purchase by ID (Recalculate totalPrice if amount or price changes)
exports.updatePurchase = async (req, res) => {
  try {
    const { error } = purchaseValidationSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    }
    const {
      vendorId,
      amount,
      price,
      description,
      expirationDate,
      itemId,
      ItemCategoryId,
    } = req.body;
    const { error: paramsError } = paramsSchema.validate(req.params);
    if (paramsError) {
      return res
        .status(400)
        .json({
          message: "Validation error",
          error: paramsError.details[0].message,
        });
    }
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Recalculate totalPrice when updating the purchase
    const totalPrice = amount * price;

    purchase.vendorId = vendorId || purchase.vendorId;
    purchase.amount = amount || purchase.amount;
    purchase.price = price || purchase.price;
    purchase.totalPrice = totalPrice; // Update totalPrice
    purchase.description = description || purchase.description;
    purchase.expirationDate = expirationDate || purchase.expirationDate;
    purchase.itemId = itemId || purchase.itemId;
    purchase.ItemCategoryId = ItemCategoryId || purchase.ItemCategoryId;

    await purchase.save();

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a purchase by ID
exports.deletePurchase = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    }
    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    await purchase.destroy();
    res.status(200).json({ message: "Purchase deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate report based on vendourName, startDate, endDate, and itemTypeId
exports.generatePurchaseReport = async (req, res) => {
  const error = purchaseValidationSchema.validate(req.body);
  // if (error)
  //   return res
  //     .status(400)
  //     .json({ message: "Validation error", error: error.details[0].message });
  const { vendorId, startDate, endDate, ItemCategoryId } = req.body;

  try {
    const whereConditions = {};

    if (vendorId) {
      whereConditions.vendorId = { [Sequelize.Op.like]: `%${vendorId}%` };
    }

    if (startDate && endDate) {
      whereConditions.date = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (ItemCategoryId) {
      whereConditions.ItemCategoryId = ItemCategoryId;
    }

    const report = await Purchase.findAll({
      where: whereConditions,
      include: [Item, ItemType, Vendor],
      order: [["date", "ASC"]],
    });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
