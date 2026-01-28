// controllers/billPaymentTypeController.js
const BillPaymentType = require('../models/billType');

// Create a new bill payment type
exports.createBillPaymentType = async (req, res) => {
  try {
    const { typeName, description } = req.body;

    if (!typeName) {
      return res.status(400).json({ message: 'Type name is required.' });
    }

    const billPaymentType = await BillPaymentType.create({ typeName, description });
    res.status(201).json(billPaymentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bill payment types
exports.getAllBillPaymentTypes = async (req, res) => {
  try {
    const billPaymentTypes = await BillPaymentType.findAll();
    res.status(200).json(billPaymentTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single bill payment type by ID
exports.getBillPaymentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const billPaymentType = await BillPaymentType.findByPk(id);

    if (!billPaymentType) {
      return res.status(404).json({ message: 'Bill payment type not found.' });
    }

    res.status(200).json(billPaymentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a bill payment type
exports.updateBillPaymentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeName, description } = req.body;

    const billPaymentType = await BillPaymentType.findByPk(id);
    if (!billPaymentType) {
      return res.status(404).json({ message: 'Bill payment type not found.' });
    }

    await billPaymentType.update({ typeName, description });
    res.status(200).json(billPaymentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a bill payment type
exports.deleteBillPaymentType = async (req, res) => {
  try {
    const { id } = req.params;

    const billPaymentType = await BillPaymentType.findByPk(id);
    if (!billPaymentType) {
      return res.status(404).json({ message: 'Bill payment type not found.' });
    }

    await billPaymentType.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
