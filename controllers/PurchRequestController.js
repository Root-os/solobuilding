const { Op } = require("sequelize");
const PurchaseRequest = require("../models/purchaseRequest");
const User = require("../models/user");
const Item = require("../models/item");
const { purchaseRequestValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");

// Create a new PurchaseRequest
exports.createPurchaseRequest = async (req, res) => {
  try {
    const { error } = purchaseRequestValidationSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    const {
      itemId,
      requestedBy,
      status,
      amount,
      requestDate,
      reason,
      approvedBy,
      vendorName,
      vendorPhone,
    } = req.body;

    const newRequest = await PurchaseRequest.create({
      itemId,
      requestedBy,
      status,
      amount,
      requestDate,
      reason,
      approvedBy,
      vendorName,
      vendorPhone,
    });

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPurchaseRequests = async (req, res) => {
  try {
    const purchaseRequests = await PurchaseRequest.findAll({
      include: [
        { model: Item, as: "item" },
        {
          model: User,
          as: "requestedby",
          attributes: ["id", "fname", "lname", "email"],
        },
        {
          model: User,
          as: "approvedby",
          attributes: ["id", "fname", "lname", "email"],
        },
      ],
    });
    res.status(200).json(purchaseRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single PurchaseRequest by ID with related Item and User (requestedBy and approvedBy)
exports.getPurchaseRequestById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }

    const purchaseRequest = await PurchaseRequest.findByPk(req.params.id, {
      include: [
        { model: Item, as: "item" },
        {
          model: User,
          as: "requestedby",
          attributes: ["id", "fname", "lname", "email"],
        },
        {
          model: User,
          as: "approvedby",
          attributes: ["id", "fname", "lname", "email"],
        },
      ],
    });

    if (!purchaseRequest) {
      return res.status(404).json({ message: "PurchaseRequest not found" });
    }

    res.status(200).json(purchaseRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a PurchaseRequest by ID
exports.updatePurchaseRequest = async (req, res) => {
  try {
    const { error } = purchaseRequestValidationSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    const {
      itemId,
      requestedBy,
      status,
      amount,
      requestDate,
      reason,
      approvedBy,
      vendorName,
      vendorPhone,
    } = req.body;
    const { errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const purchaseRequest = await PurchaseRequest.findByPk(req.params.id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: "PurchaseRequest not found" });
    }

    purchaseRequest.itemId = itemId || purchaseRequest.itemId;
    purchaseRequest.requestedBy = requestedBy || purchaseRequest.requestedBy;
    purchaseRequest.status = status || purchaseRequest.status;
    purchaseRequest.amount = amount || purchaseRequest.amount;
    purchaseRequest.requestDate = requestDate || purchaseRequest.requestDate;
    purchaseRequest.reason = reason || purchaseRequest.reason;
    purchaseRequest.approvedBy = approvedBy || purchaseRequest.approvedBy;
    purchaseRequest.vendorName = vendorName || purchaseRequest.vendorName;
    purchaseRequest.vendorPhone = vendorPhone || purchaseRequest.vendorPhone;

    await purchaseRequest.save();

    res.status(200).json(purchaseRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a PurchaseRequest by ID
exports.deletePurchaseRequest = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const purchaseRequest = await PurchaseRequest.findByPk(req.params.id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: "PurchaseRequest not found" });
    }

    await purchaseRequest.destroy();
    res.status(200).json({ message: "PurchaseRequest deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generatePurchaseRequestReport = async (req, res) => {
  const { error } = purchaseRequestValidationSchema.validate(req.body);
  // if (error) {
  //   return res
  //     .status(400)
  //     .json({ message: "Validation Error", error: error.details[0].message });
  // }
  const { vendorName, startDate, endDate, itemId } = req.body;

  try {
    const whereConditions = {};

    if (vendorName) {
      whereConditions.vendorName = { [Op.like]: `%${vendorName}%` };
    }

    if (startDate && endDate) {
      whereConditions.requestDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (itemId) {
      whereConditions.itemId = itemId;
    }

    const report = await PurchaseRequest.findAll({
      where: whereConditions,
      include: [
        { model: Item, as: "item" },
        {
          model: User,
          as: "requestedby",
          attributes: ["id", "fname", "lname", "email"],
        },
        {
          model: User,
          as: "approvedby",
          attributes: ["id", "lname", "lname", "email"],
        },
      ],
      order: [["requestDate", "ASC"]],
    });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
