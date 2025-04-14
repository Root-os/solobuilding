const Payment = require("../models/payment");
const Vendor = require("../models/Vendor");
const Purchase = require("../models/Purchase");
const { paymentValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const Joi = require('joi');
const { Op } = require('sequelize');
// Create Payment
exports.createPayment = async (req, res) => {
  try {
    const { error } = paymentValidationSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const { vendorId, price, paymentMethod, status ,paymentDate} = req.body;

    // Fetch the total price from the purchase table for the vendor
    const purchase = await Purchase.findOne({ where: { vendorId } });

    if (!purchase) {
      return res
        .status(404)
        .json({ message: "Purchase not found for the vendor" });
    }

    const leftMoney = purchase.totalPrice - price;

    const payment = await Payment.create({
      vendorId,
      price,
      paymentMethod,
      status,
      leftMoney,
      paymentDate,
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Vendor,
          attributes: ["id", "fname", "lname", "phone", "email","address"], // Correctly place attributes inside the Vendor model
        },
      ],
    });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get Payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const payment = await Payment.findByPk(req.params.id, {
      include: [Vendor],
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Payment
exports.updatePayment = async (req, res) => {
  try {
    const { error } = paymentValidationSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const { vendorId, price, paymentMethod, status,paymentDate } = req.body;
    const { errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Fetch the total price from the purchase table for the vendor
    const purchase = await Purchase.findOne({ where: { vendorId } });

    if (!purchase) {
      return res
        .status(404)
        .json({ message: "Purchase not found for the vendor" });
    }

    const leftMoney = purchase.totalPrice - price;
    payment.paymentDate = paymentDate;
    payment.vendorId = vendorId;
    payment.price = price;
    payment.paymentMethod = paymentMethod;
    payment.status = status;
    payment.leftMoney = leftMoney;

    await payment.save();

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Payment
exports.deletePayment = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation Error", error: error.details[0].message });
    }
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.destroy();

    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Payments Report by Vendor and Status (Using req.body)
exports.getPaymentsReport = async (req, res) => {
  try {
    // Define validation schema for startDate and endDate
    const dateSchema = Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional()
    });

   

    const { vendorId, status, startDate, endDate } = req.body;

    // Define query conditions
    let whereConditions = {};

    if (vendorId) whereConditions.vendorId = vendorId;
    if (status) whereConditions.status = status;

    // Add date filtering to the conditions
    if (startDate) {
      whereConditions.paymentDate = { [Op.gte]: new Date(startDate) }; // Greater than or equal to startDate
    }

    if (endDate) {
      whereConditions.paymentDate = {
        ...whereConditions.paymentDate,
        [Op.lte]: new Date(endDate), // Less than or equal to endDate
      };
    }

    // Fetch payments based on conditions
    const payments = await Payment.findAll({
      where: whereConditions,
      include: [Vendor], // Include vendor details
    });

    if (payments.length === 0) {
      return res
        .status(404)
        .json({ message: "No payments found with the given criteria" });
    }

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
