const { Op } = require("sequelize");
const PurchaseRequest = require("../models/purchaseRequest");
const User = require("../models/user");
const Item = require("../models/item");
const Vendor = require("../models/Vendor");
const Role = require("../models/role");
const { purchaseRequestValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const sendNotificationHelper= require('../helpers/sendAlert');


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
      vendorId,
    } = req.body;

    const newRequest = await PurchaseRequest.create({
      itemId,
      requestedBy,
      status,
      amount,
      requestDate,
      reason,
      approvedBy,
      vendorId,
    });
    const admins = await User.findAll({
      include: [{
        model: Role,
        as: 'Role', 
        where: { name: 'admin' },
      }],
    });
    
         const user = await User.findByPk(requestedBy, {
      attributes: ['fname', 'lname'],
    });

    const fullName = user ? `${user.fname} ${user.lname}` : `User ID: ${requestedBy}`;

     // Fetch all admins
    if (newRequest && admins.length > 0) {
      // Send notification to each admin
      await Promise.all(
        admins.map((admin) =>
          sendNotificationHelper({
            adminId: admin.id,
            title: `New Purchase Request from ${fullName}`,
            body: `A new purchase request has been submitted by ${fullName}. Please check the purchase requests page for more details.`,
            type: 'New Purchase Request',
            receiver_type: 'staff',
          })
        )
      );
    }

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
        {
          model: Vendor,
          as: "vendor", 
          attributes: ["id", "fname", "lname", "email","phone","address"],
        }
      ],
    });
    res.status(200).json(purchaseRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a PurchaseRequest by ID
exports.updatePurchaseRequest = async (req, res) => {
  try {
    // Validate request body
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
      vendorId,
      approvedAmount,
    } = req.body;

    // Validate request parameters (ID)
    const { errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }

    // Find the purchase request by ID
    const purchaseRequest = await PurchaseRequest.findByPk(req.params.id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: "PurchaseRequest not found" });
    }

    // Check if the vendorId exists if provided
    if (vendorId) {
      const vendorExists = await Vendor.findByPk(vendorId);
      if (!vendorExists) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    // Update the fields
    purchaseRequest.itemId = itemId || purchaseRequest.itemId;
    purchaseRequest.requestedBy = requestedBy || purchaseRequest.requestedBy;
    purchaseRequest.status = status || purchaseRequest.status;
    purchaseRequest.amount = amount || purchaseRequest.amount;
    purchaseRequest.requestDate = requestDate || purchaseRequest.requestDate;
    purchaseRequest.reason = reason || purchaseRequest.reason;
    purchaseRequest.approvedBy = approvedBy || purchaseRequest.approvedBy;
    purchaseRequest.vendorId = vendorId || purchaseRequest.vendorId;
    purchaseRequest.approvedAmount = approvedAmount || purchaseRequest.approvedAmount;

    // Save the updated purchase request
    await purchaseRequest.save();

    // Fetch the item's name
    const item = await Item.findByPk(itemId || purchaseRequest.itemId, {
      attributes: ['itemName']
    });
    const itemName = item ? item.itemName : 'the item';

    // Notify user about the update
    await sendNotificationHelper({
      adminId: purchaseRequest.requestedBy,
      title: 'Purchase Request Updated',
      body: `Your purchase request for  ${itemName} has been ${status}.`,
      type: 'Purchase Request Update',
      receiver_type: 'staff', 
    });

    // Fetch the updated purchase request with the related data (Item, requestedBy, approvedBy, vendor)
    const updatedRequest = await PurchaseRequest.findByPk(req.params.id, {
      include: [
        { model: Item, as: "item" }, // Include related item details
        {
          model: User,
          as: "requestedby",
          attributes: ["id", "fname", "lname", "email"], // Include requestedBy details
        },
        {
          model: User,
          as: "approvedby",
          attributes: ["id", "fname", "lname", "email"], // Include approvedBy details
        },
        {
          model: Vendor,
          as: "vendor", // Include vendor details if necessary
          attributes: ["id", "fname", "lname", "email", "phone", "address"],
        },
      ],
    });

    // Send the updated purchase request with related data in the response
    res.status(200).json(updatedRequest);
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

exports.getPurchaseRequestsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const purchaseRequests = await PurchaseRequest.findAll({
      where: { requestedBy: userId },
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
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "fname", "lname", "email", "phone", "address"],
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

exports.generatePurchaseRequestReport = async (req, res) => {
  const { error } = purchaseRequestValidationSchema.validate(req.body);
  // if (error) {
  //   return res
  //     .status(400)
  //     .json({ message: "Validation Error", error: error.details[0].message });
  // }
  const { vendorId, startDate, endDate, itemId } = req.body;

  try {
    const whereConditions = {};

    if (vendorId) {
      whereConditions.vendorId = { [Op.like]: `%${vendorId}%` };
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
