const PaymentType = require("../models/paymentType");

// Create a new payment type
exports.createPaymentType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Payment type name is required." });
    }

    const paymentType = await PaymentType.create({ name, description });
    res.status(201).json(paymentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all payment types
exports.getAllPaymentTypes = async (req, res) => {
  try {
    const paymentTypes = await PaymentType.findAll();
    res.status(200).json(paymentTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single payment type by ID
exports.getPaymentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentType = await PaymentType.findByPk(id);

    if (!paymentType) {
      return res.status(404).json({ message: "Payment type not found." });
    }

    res.status(200).json(paymentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a payment type
exports.updatePaymentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const paymentType = await PaymentType.findByPk(id);
    if (!paymentType) {
      return res.status(404).json({ message: "Payment type not found." });
    }

    await paymentType.update({ name, description });
    res.status(200).json(paymentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a payment type
exports.deletePaymentType = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentType = await PaymentType.findByPk(id);
    if (!paymentType) {
      return res.status(404).json({ message: "Payment type not found." });
    }

    await paymentType.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
