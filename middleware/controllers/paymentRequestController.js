const PaymentRequest = require('../models/paymentRequests');
const PaymentSetting = require('../models/paymentSetting');
const Tenant = require('../models/tenant');
const Floor = require("../models/floor");
const Unit = require("../models/unit");
const PaymentType=require('../models/paymentType');
const { Op } = require('sequelize');
const {paymentRequestSchema,paramsSchema,paymentRequestStatusSchema} = require('../helpers/schema')
const sendNotificationHelper= require('../helpers/sendAlert');
const User = require('../models/user');
const Role = require('../models/role');
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");
const { verifyCBE } = require('../services/paymentRequestVerifier');
const { getCBE_TransactionDetail } = require('../utils/cbepdfParser');

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
  //send sms to tenant
  const floor = await Floor.findByPk(existingTenant.floorId);
  const unit = await Unit.findByPk(existingTenant.unitId);

  // Compose enriched SMS
  const loginUrl = process.env.TENANT_PORTAL_URL;
  const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
  const smsMessage = `Hi ${existingTenant.fullName}, 
        a new ${existingPaymentType.name} is due by ${dueDate} for your unit (Floor ${floor?.floorNumber}, 
        Unit ${unit?.unitNumber}). Kindly check your tenant dashboard for more info.`;
   

  await smsUtil.sendSingleSMS({
    phone: existingTenant.phoneNumber,
    msg: smsMessage + `\nLogin here: ${loginUrl}`,
    callback: process.env.GEEZSMS_WEBHOOK_URL,
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
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] }
          ],
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

        const phoneNumber = req.user.phone; 

    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ['id'],
      
    });
    // console.log('Fetching payment requests for tenant ID:', id);

    const tenantIds = tenants.map(t => t.id);

    // Fetch payment requests that belong to the user
    const paymentRequests = await PaymentRequest.findAll({
       where: { tenantId: tenantIds, },
             include: [
               { model: Tenant, attributes: ['fullName'],
                 include: [
                   { model: Unit, attributes: ['unitNumber'] },
                   { model: Floor, attributes: ['floorNumber'] }
                 ],
               },
               { model: PaymentType, attributes: ['name'],},
             ]
    });
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

    const tenant = await Tenant.findByPk(paymentRequest.tenantId);
    const unit = await Unit.findByPk(tenant.unitId);
    const floor = await Floor.findByPk(tenant.floorId);

    const isFirstUpload = !paymentRequest.receipt;

    // Update receipt URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    paymentRequest.receipt = `${baseUrl}/uploads/receipts/${req.file.filename}`;
    await paymentRequest.save();

    const admins = await User.findAll({
      include: {
        model: Role,
        where: { name: 'admin' },
      },
    });

    const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });

    const smsMessage = isFirstUpload
      ? `New receipt uploaded by ${tenant.fullName} (Floor ${floor.floorNumber}, Unit ${unit.unitNumber}). Please review the payment request.`
      : `Updated receipt uploaded by ${tenant.fullName} (Floor ${floor.floorNumber}, Unit ${unit.unitNumber}). Please review the changes in the payment request.`;

    const notificationBody = isFirstUpload
      ? `A new payment receipt has been uploaded by ${tenant.fullName} (Floor ${floor.floorNumber}, Unit ${unit.unitNumber}).`
      : `An updated payment receipt has been uploaded by ${tenant.fullName} (Floor ${floor.floorNumber}, Unit ${unit.unitNumber}).`;

    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          sendNotificationHelper({
            adminId: admin.id,
            title: 'Payment Receipt Upload',
            body: notificationBody,
            type: 'Payment Receipt Upload',
            receiver_type: 'staff',
          })
        )
      );

      await Promise.all(
        admins.map((admin) =>
          smsUtil.sendSingleSMS({
            phone: admin.phone,
            msg: smsMessage,
            callback: process.env.GEEZSMS_WEBHOOK_URL,
          })
        )
      );
    }

    res.status(200).json({ message: 'Receipt uploaded successfully', data: paymentRequest });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ message: 'Error uploading receipt', error: error.message });
  }
};

// ================================================================================================

exports.verifyCBEPaymentRequest = async (req, res) => {
  try {
    const { transactionNumber } = req.body;
    const paymentRequestId = req.params.id;

    if (!transactionNumber) {
      return res.status(400).json({
        message: "Transaction number is required",
      });
    }

    const result = await verifyCBE(
      paymentRequestId,
      transactionNumber
    );

    return res.json({
      success: true,
      message: "Payment request approved",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
const lastN = (s, n) => s.slice(-n);
const toAmount = (v) => parseFloat(String(v).replace(/[^\d.]/g, ""));

exports.verifyCBETest = async (req, res) => {
  try {
    const { transactionNumber } = req.body;
    if (!transactionNumber) {
      return res.status(400).json({ message: "transactionNumber is required" });
    }

    // Load CBE PaymentSetting
    const setting = await PaymentSetting.findOne({ where: { paymentMethod: "CBE" } });
    if (!setting) return res.status(400).json({ message: "CBE payment setting not found" });

    // Fetch and parse the CBE transaction
    const parsed = await getCBE_TransactionDetail(transactionNumber);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    // Check receiver account
    const expectedLast4 = lastN(digitsOnly(setting.receiverAccountNumber), 4);
    const actualLast4 = lastN(digitsOnly(parsed.receiverAccount), 4);
    const accountOk = expectedLast4 === actualLast4;

    // Check receiver name
    const expectedName = setting.receiverName.trim().toLowerCase();
    const actualName = parsed.receiver.trim().toLowerCase();
    const nameOk = expectedName === actualName;

    // You can skip amount check for now, or use a dummy amount
    const fetchedAmount = toAmount(parsed.transferredAmount);

    return res.json({
      success: accountOk && nameOk,
      accountOk,
      nameOk,
      fetchedAmount,
      parsed,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
