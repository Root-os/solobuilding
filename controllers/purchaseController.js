const Purchase=require('../models/Purchase');
const Item=require('../models/item');
const ItemType=require('../models/itemType');
const { Sequelize } = require('sequelize');

exports.createPurchase = async (req, res) => {
  try {
    const { vendourName, vendourPhone, amount, price, description, expirationDate, itemId, itemTypeId } = req.body;

    const totalPrice = amount * price;

    const newPurchase = await Purchase.create({
      vendourName,
      vendourPhone,
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
      include: [Item, ItemType], 
      attributes: ['id', 'vendourName', 'vendourPhone', 'totalPrice', 'description', 'expirationDate', 'itemId', 'itemTypeId'], 
    });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a purchase by ID (Only display totalPrice)
 exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findByPk(req.params.id, {
      include: [Item, ItemType],
      attributes: ['id', 'vendourName', 'vendourPhone', 'totalPrice', 'description', 'expirationDate', 'itemId', 'itemTypeId'], 
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
    const { vendourName, vendourPhone, amount, price, description, expirationDate, itemId, itemTypeId } = req.body;

    const purchase = await Purchase.findByPk(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Recalculate totalPrice when updating the purchase
    const totalPrice = amount * price;

    purchase.vendourName = vendourName || purchase.vendourName;
    purchase.vendourPhone = vendourPhone || purchase.vendourPhone;
    purchase.amount = amount || purchase.amount;
    purchase.price = price || purchase.price;
    purchase.totalPrice = totalPrice; // Update totalPrice
    purchase.description = description || purchase.description;
    purchase.expirationDate = expirationDate || purchase.expirationDate;
    purchase.itemId = itemId || purchase.itemId;
    purchase.itemTypeId = itemTypeId || purchase.itemTypeId;

    await purchase.save();

    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a purchase by ID
 exports.deletePurchase = async (req, res) => {
  try {
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
    const { vendourName, startDate, endDate, itemTypeId } = req.body;
  
    try {
      const whereConditions = {};
  
      if (vendourName) {
        whereConditions.vendourName = { [Sequelize.Op.like]: `%${vendourName}%` };
      }
  
      if (startDate && endDate) {
        whereConditions.date = {
          [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }
  
      if (itemTypeId) {
        whereConditions.itemTypeId = itemTypeId;
      }
  
      const report = await Purchase.findAll({
        where: whereConditions,
        include: [Item, ItemType], 
        order: [["date", "ASC"]], 
      });
  
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  


