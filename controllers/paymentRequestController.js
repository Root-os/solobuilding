const PaymentRequest = require('../models/paymentRequests');
const Tenant = require('../models/tenant');
const BillType = require('../models/billType');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');

// Create a payment request
exports.createPaymentRequest = async (req, res) => {
  try {
    const { tenantId, message, PaymentTypeId, level, amount, dueDate, repeatedFor } = req.body;

    const newPaymentRequest = await PaymentRequest.create({
      tenantId,
      message,
      PaymentTypeId,
      level,
      amount,
      dueDate,
      repeatedFor,
    });

    res.status(201).json({ message: 'Payment request created successfully', data: newPaymentRequest });
  } catch (error) {
    console.error("Error creating payment request:", error);
    res.status(500).json({ message: 'Error creating payment request', error: error.message });
  }
};

// Get all payment requests
exports.getAllPaymentRequests = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const paymentRequests = await PaymentRequest.findAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          attributes: ['fullName'],
        },
        {
          model: BillType,
          attributes: ['typeName'],
        },
      ],
    });

    res.status(200).json(paymentRequests);
  } catch (error) {
    console.error("Error fetching payment requests:", error);
    res.status(500).json({ message: 'Error fetching payment requests', error: error.message });
  }
};

// Get a single payment request by ID
exports.getPaymentRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentRequest = await PaymentRequest.findByPk(id, {
      include: [
        {
          model: Tenant,
          attributes: ['fullName'],
        },
        {
          model: BillType,
          attributes: ['typeName'],
        },
      ],
    });

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    res.status(200).json(paymentRequest);
  } catch (error) {
    console.error("Error fetching payment request:", error);
    res.status(500).json({ message: 'Error fetching payment request', error: error.message });
  }
};

// Update a payment request
exports.updatePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, level, amount, dueDate, status } = req.body;

    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    await paymentRequest.update({ message, level, amount, dueDate, status });

    res.status(200).json({ message: 'Payment request updated successfully', data: paymentRequest });
  } catch (error) {
    console.error("Error updating payment request:", error);
    res.status(500).json({ message: 'Error updating payment request', error: error.message });
  }
};

// Delete a payment request
exports.deletePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    await paymentRequest.destroy();
    res.status(200).json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error("Error deleting payment request:", error);
    res.status(500).json({ message: 'Error deleting payment request', error: error.message });
  }
};


// Approve or Reject Payment
exports.reviewPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use approved or rejected.' });
    }

    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    paymentRequest.status = status;
    await paymentRequest.save();

    res.status(200).json({ message: `Payment ${status} successfully`, data: paymentRequest });
  } catch (error) {
    console.error("Error reviewing payment:", error);
    res.status(500).json({ message: 'Error reviewing payment', error: error.message });
  }
};
// Upload Payment Receipt
exports.uploadReceipt = async (req, res) => {
  upload.single('receipt')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }

    try {
      const { id } = req.params;
      const paymentRequest = await PaymentRequest.findByPk(id);

      if (!paymentRequest) {
        return res.status(404).json({ message: 'Payment request not found' });
      }

      // Update with receipt path
      paymentRequest.receipt = `/uploads/receipts/${req.file.filename}`;
      await paymentRequest.save();

      res.status(200).json({ message: 'Receipt uploaded successfully', data: paymentRequest });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: 'Error uploading receipt', error: error.message });
    }
  });
};

const storage = multer.diskStorage({
  destination: './uploads/receipts',
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });