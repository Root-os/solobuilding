const Purchase = require("../models/purchase");
const Item = require("../models/item");
const ItemCategory = require("../models/itemCategory");
const { Sequelize } = require("sequelize");
const { purchaseValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const Vendor = require("../models/Vendor");

exports.createPurchase = async (req, res) => {
  const t = await Purchase.sequelize.transaction(); // Start a transaction
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
      ItemCategoryId ,
    } = req.body;
console.log(req.body);
    const totalPrice = amount * price;

    // 1. Create purchase record
    const newPurchase = await Purchase.create(
      {
        vendorId,
        amount,
        price,
        totalPrice,
        description,
        expirationDate,
        itemId,
        ItemCategoryId,
      },
      { transaction: t }
    );

    // 2. Update item stock (itemAmount)
    const item = await Item.findByPk(itemId, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the itemAmount
    item.itemAmount = parseFloat(item.itemAmount) + parseFloat(amount);
    await item.save({ transaction: t });

    await t.commit();
    res.status(201).json(newPurchase);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Get all purchases (Only display totalPrice)
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      include: [Item, ItemCategory, Vendor],
    
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
      include: [Item, ItemCategory],
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

// Get a purchase by ID (Only display totalPrice)
exports.getPurchaseByVenderId = async (req, res) => {
  try {
   
    const purchase = await Purchase.findOne({
      where: { vendorId: req.params.vendorId },
      attributes: ["id", "totalPrice", "description"],
      include: [
        {
          model: Item,
          attributes: ["itemName"], // Only return the item name
        },
        {
          model: ItemCategory,
          attributes: ["categoryName"], // Only return the itemCategory name
        },
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

// Generate report based on vendourName, startDate, endDate, and itemCategoryId
exports.generatePurchaseReport = async (req, res) => {
  const { vendorId, startDate, endDate, itemCategoryId } = req.body;

  try {
    const whereConditions = {};

    if (vendorId) {
      whereConditions.vendorId = { [Sequelize.Op.like]: `%${vendorId}%` };
    }

    // Date range filtering
    if (startDate && endDate) {
      whereConditions.date = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Build item include
    const itemInclude = {
      model: Item,
      required: true,
      include: [
        {
          model: ItemCategory,
          required: true,
        }
      ]
    };

    // Add category filter if specified
    if (itemCategoryId) {
      itemInclude.include[0].where = { id: itemCategoryId };
    }

    // Run query
    const report = await Purchase.findAll({
      where: whereConditions,
      include: [
        itemInclude,
        Vendor
      ],
      order: [["date", "ASC"]],
    });

    // Respond with result
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




