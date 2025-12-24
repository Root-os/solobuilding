const Payment = require("../models/payment");
const Vendor = require("../models/Vendor");
const Purchase = require("../models/purchase");
const { paymentValidationSchema, updatePaymentValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const Joi = require('joi');
const { Op } = require('sequelize');
// Create Payment

exports.createPayment = async (req, res) => {
  try {
    const { error } = paymentValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: "Validation Error", error: error.details[0].message });
    }

    const { vendorId, price, paymentMethod, status, paymentDate, item, description, purchaseId } = req.body;

    // Fetch the specific purchase by purchaseId and vendorId
    const purchase = await Purchase.findOne({ where: { id: purchaseId, vendorId } });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found for the vendor" });
    }

    // Calculate total amount paid so far for this purchase
    const payments = await Payment.findAll({ where: { purchaseId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.price, 0);

    // Calculate remaining balance
    const remainingBalance = purchase.totalPrice - totalPaid;

    if (price > remainingBalance) {
      return res.status(400).json({
        message: "Overpayment not allowed",
        remainingBalance,
      });
    }

    // Calculate new leftMoney after this payment
    const leftMoney = remainingBalance - price;

    // Create the payment record
    const payment = await Payment.create({
      vendorId,
      price,
      paymentMethod,
      status,
      leftMoney,
      paymentDate,
      item,
      description,
      purchaseId,
    });

    // Respond with detailed info including total, paid, and remaining
    res.status(201).json({
      payment,
      totalPrice: purchase.totalPrice,
      paidPrice: totalPaid + price,
      remaining: leftMoney,
    });
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
    // Validate body
    const { error } = updatePaymentValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        message: "Validation Error", 
        error: error.details[0].message 
      });
    }

    // Validate params
    const { error: paramError } = paramsSchema.validate(req.params);
    if (paramError) {
      return res.status(400).json({ 
        message: "Validation Error", 
        error: paramError.details[0].message 
      });
    }

    const { vendorId, price, paymentMethod, status, paymentDate, description } = req.body;

    // Fetch existing payment
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Fetch the purchase linked to this payment & vendor
    const purchase = await Purchase.findOne({ 
      where: { id: payment.purchaseId, vendorId } 
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found for the vendor" });
    }

    // Calculate all other payments for this purchase
    const payments = await Payment.findAll({ 
      where: { 
        purchaseId: payment.purchaseId,
        id: { [Op.ne]: payment.id } // exclude current payment
      } 
    });

    const totalPaidExcludingCurrent = payments.reduce((sum, p) => sum + p.price, 0);

    // New total with the updated payment
    const newTotalPaid = totalPaidExcludingCurrent + price;
    const remainingBalance = purchase.totalPrice - newTotalPaid;

    if (remainingBalance < 0) {
      return res.status(400).json({
        message: "Overpayment not allowed",
        remainingBalance: purchase.totalPrice - totalPaidExcludingCurrent
      });
    }

    // Update fields
    payment.vendorId = vendorId;
    payment.price = price;
    payment.paymentMethod = paymentMethod;
    payment.status = status;
    payment.paymentDate = paymentDate;
    payment.leftMoney = remainingBalance;
    payment.description = description;

    await payment.save();

    res.status(200).json({
      payment,
      totalPrice: purchase.totalPrice,
      paidPrice: newTotalPaid,
      remaining: remainingBalance
    });
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
      return res.status(200).json([]);
    }

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
