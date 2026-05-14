const RentReciept = require("../models/rentReciept");
const TenantRentCollection = require("../models/tenantRentCollection");
const TenantPayment = require("../models/tenantPayments");


// ✅ CREATE receipt
exports.createReceipt = async (req, res) => {
  try {
    const { rentCollectionId, tenantPaymentId, fsNo, status, deliveryStatus } = req.body;

    // ❗ Ensure ONLY ONE is provided
    if (!rentCollectionId && !tenantPaymentId) {
      return res.status(400).json({
        message: "Either rentCollectionId or tenantPaymentId is required",
      });
    }

    if (rentCollectionId && tenantPaymentId) {
      return res.status(400).json({
        message: "Provide only one: rentCollectionId OR tenantPaymentId, not both",
      });
    }

    let whereCondition = {};

    // ✅ Handle rent collection
    if (rentCollectionId) {
      const collection = await TenantRentCollection.findByPk(rentCollectionId);
      if (!collection) {
        return res.status(404).json({ message: "Rent collection not found" });
      }

      const existing = await RentReciept.findOne({ where: { rentCollectionId } });
      if (existing) {
        return res.status(400).json({
          message: "Receipt already exists for this collection",
        });
      }

      whereCondition.rentCollectionId = rentCollectionId;
    }

    // ✅ Handle tenant payment
    if (tenantPaymentId) {
      const payment = await TenantPayment.findByPk(tenantPaymentId);
      if (!payment) {
        return res.status(404).json({ message: "Tenant payment not found" });
      }

      const existing = await RentReciept.findOne({ where: { tenantPaymentId } });
      if (existing) {
        return res.status(400).json({
          message: "Receipt already exists for this tenant payment",
        });
      }

      whereCondition.tenantPaymentId = tenantPaymentId;
    }

    // ✅ RULE 1
    if (status === "cutted" && !fsNo) {
      return res.status(400).json({
        message: "fsNo is required when status is 'cutted'",
      });
    }

    // ✅ RULE 2
    if (deliveryStatus === "delivered") {
      if (status !== "cutted" || !fsNo) {
        return res.status(400).json({
          message:
            "Cannot mark as delivered unless status is 'cutted' and fsNo is provided",
        });
      }
    }

    const receipt = await RentReciept.create({
      ...whereCondition,
      fsNo,
      status: status || "pending",
      deliveryStatus: deliveryStatus || "pending",
    });

    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ GET ALL receipts
exports.getAllReceipts = async (req, res) => {
  try {
    const receipts = await RentReciept.findAll({
      include:[ {
        model: TenantRentCollection,
        as: "rentCollection",
      },

      {
        model: TenantPayment,
        as: "tenantPayment",
      }
    
    ]
    });

    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ GET ONE receipt
exports.getReceiptById = async (req, res) => {
  try {
    const receipt = await RentReciept.findByPk(req.params.id, {
      include: {
        model: TenantRentCollection,
        as: "rentCollection",
      },
    });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReceiptByTenantPaymentId = async (req, res) => {
  try {
    const receipt = await RentReciept.findOne({
      where: { tenantPaymentId: req.params.tenantPaymentId },
      include: [
        { model: TenantRentCollection, as: "rentCollection" },
        { model: TenantPayment, as: "tenantPayment" },
      ],
    });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found for this payment" });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReceiptByRentCollectionId = async (req, res) => {
  try {
    const receipt = await RentReciept.findOne({
      where: { rentCollectionId: req.params.rentCollectionId },
      include: [
        { model: TenantRentCollection, as: "rentCollection" },
        { model: TenantPayment, as: "tenantPayment" },
      ],
    });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found for this collection" });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE receipt
exports.updateReceipt = async (req, res) => {
  try {
    const receipt = await RentReciept.findByPk(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const { status, fsNo, deliveryStatus } = req.body;

    // use current values if not provided
    const newStatus = status || receipt.status;
    const newFsNo = fsNo !== undefined ? fsNo : receipt.fsNo;
    const newDeliveryStatus = deliveryStatus || receipt.deliveryStatus;

    // ✅ RULE 1
    if (newStatus === "cutted" && !newFsNo) {
      return res.status(400).json({
        message: "fsNo is required when status is 'cutted'",
      });
    }

    // ✅ RULE 2
    if (newDeliveryStatus === "delivered") {
      if (newStatus !== "cutted" || !newFsNo) {
        return res.status(400).json({
          message: "Cannot mark as delivered unless status is 'cutted' and fsNo exists",
        });
      }
    }

    await receipt.update(req.body);

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ DELETE receipt
exports.deleteReceipt = async (req, res) => {
  try {
    const receipt = await RentReciept.findByPk(req.params.id);

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    await receipt.destroy();

    res.json({ message: "Receipt deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};