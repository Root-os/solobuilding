const PaymentRequest = require('../models/paymentRequests');
const Tenant = require('../models/tenant');
const PaymentType=require('../models/paymentType');
const { Op } = require('sequelize');
const {paymentRequestSchema,paramsSchema,paymentRequestStatusSchema} = require('../helpers/schema')
const sendNotificationHelper= require('../helpers/sendAlert');
const User = require('../models/user.js');

// Create a payment request
exports.createPaymentRequest = async (req, res) => {
  try {
    const {error}=paymentRequestSchema.validate(req.body)
    if(error){
      return res.status(400).json({message:error.details[0].message})
    }
    const { tenantId, message, paymentTypeId , level, amount, dueDate, repeatedFor } = req.body;
    const existingTenant = await Tenant.findByPk(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    const existingPaymentType = await PaymentType.findByPk(paymentTypeId);
    if (!existingPaymentType) {
      return res.status(404).json({ message: 'Payment Type not found' });
    }
    const newPaymentRequest = await PaymentRequest.create({
      tenantId,
      message,
      paymentTypeId,
      level,
      amount,
      dueDate,
      repeatedFor,
    });
 await sendNotificationHelper({
  adminId: tenantId,
  title: 'New Payment Request',
  body: `A new payment request has been submitted by apartment manager. Please check the payment requests page for more details.`,
  type: 'New Payment Request',
  receiver_type: 'tenant',
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
          model: PaymentType,
          attributes: ['name'],
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
          model: PaymentType,
          attributes: ['name'],
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

exports.getMyRequestFromAdmin = async (req, res) => {
  try {
    // Validate user ID
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const  id  = Number(req.user.id);
    console.log('Fetching payment requests for tenant ID:', id);

    // Fetch payment requests that belong to the user
    const paymentRequests = await PaymentRequest.findAll({
      where: { tenantId: id },
      order: [['createdAt', 'DESC']],
    });

    // Check if there are any payment requests
    if (!paymentRequests || paymentRequests.length === 0) {
      return res.status(404).json({ message: 'No payment requests found' });
    }

    res.status(200).json({ message: 'Payment requests retrieved successfully', data: paymentRequests });

  } catch (error) {
    console.error('Error retrieving payment requests:', error);
    res.status(500).json({ message: 'Error retrieving payment requests', error: error.message });
  }
};

// Upload Payment Receipt
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { id } = req.params;
    const paymentRequest = await PaymentRequest.findByPk(id);

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    // Update with receipt path
    paymentRequest.receipt = `/uploads/receipts/${req.file.filename}`;
    await paymentRequest.save();
    const admins = await User.findAll({ where: { role: 'admin' } }); // Fetch all admins
    if(admins.length > 0){await Promise.all(
      admins.map((admin) =>
        sendNotificationHelper({
          adminId: admin.id,
          title: 'New Payment Receipt',
          body: `A new payment receipt has been uploaded by tenant. Please check the payment requests page for more details.`,
          type: 'New Payment Receipt',
          receiver_type: 'staff',
        })
      )
    );}
        res.status(200).json({ message: 'Receipt uploaded successfully', data: paymentRequest });
      } catch (error) {
        console.error('Error uploading receipt:', error);
        res.status(500).json({ message: 'Error uploading receipt', error: error.message });
      }
    };