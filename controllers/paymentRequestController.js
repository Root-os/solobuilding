const PaymentRequest = require('../models/paymentRequests');
const PaymentSetting = require('../models/paymentSetting');
const PaymentResponse = require('../models/verifiedPayments');
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
const axios = require('axios');
const { normalizeTransactionNumber } = require("../helpers/normalizeCbeId");
const generateAccessCode = require('../helpers/accessCodePaymentReq');



// Create a payment request
exports.createPaymentRequest = async (req, res) => {
  try {
    // 1️⃣ Validate request body
    const { error } = paymentRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { tenantId, message, paymentTypeId, level, amount, dueDate, repeatedFor } = req.body;

    // 2️⃣ Check tenant exists
    const existingTenant = await Tenant.findByPk(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // 3️⃣ Check payment type exists
    const existingPaymentType = await PaymentType.findByPk(paymentTypeId);
    if (!existingPaymentType) {
      return res.status(404).json({ message: 'Payment Type not found' });
    }

    // 4️⃣ Generate access code
    const accessCode = generateAccessCode(6);

    // 5️⃣ Create payment request
    const newPaymentRequest = await PaymentRequest.create({
      tenantId,
      message,
      paymentTypeId,
      level,
      amount,
      dueDate,
      repeatedFor,
      accessCode,
    });

    const paymentLink = `${process.env.REQUEST_LINK_URL}/${accessCode}`;

    // 6️⃣ Send notification to tenant
    await sendNotificationHelper({
      adminId: tenantId,
      title: 'New Payment Request',
      body: 'A new payment request has been submitted by apartment manager. Please check the payment requests page for more details.',
      type: 'New Payment Request',
      receiver_type: 'tenant',
    });

    // 7️⃣ Fetch floor & unit info for SMS
    const floor = await Floor.findByPk(existingTenant.floorId);
    const unit = await Unit.findByPk(existingTenant.unitId);

    const loginUrl = process.env.TENANT_PORTAL_URL;

    const smsMessage = `Hi ${existingTenant.fullName},

    A new ${existingPaymentType.name} is due by ${dueDate} for your unit (Floor ${floor?.floorNumber}, Unit ${unit?.unitNumber}).
    You can view and verify your pending payment here: ${paymentLink}
    Thank you!`;

    // 8️⃣ Send SMS safely in the background
    setImmediate(async () => {
      try {
        const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
        await smsUtil.sendSingleSMS({
          phone: existingTenant.phoneNumber,
          msg: smsMessage + `\nLogin here: ${loginUrl}`,
          callback: process.env.GEEZSMS_WEBHOOK_URL,
        });
      } catch (err) {
        console.error('SMS failed for tenant', existingTenant.id, err.message);
      }
    });

    // 9️⃣ Return response
    res.status(201).json({
      message: 'Payment request created successfully',
      data: newPaymentRequest,
    });

  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({
      message: 'Error creating payment request',
      error: error.message,
    });
  }
};


exports.getPaymentRequestsByAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.params;

    // 1️⃣ Find the request that corresponds to this accessCode
    const currentRequest = await PaymentRequest.findOne({
      where: { accessCode },
      include: [{ model: Tenant }],
    });

    if (!currentRequest) {
      return res.status(404).json({ success: false, message: 'Invalid link' });
    }

    // 2️⃣ Get phone number from the tenant
    const phoneNumber = currentRequest.Tenant.phoneNumber;

    // 3️⃣ Fetch all pending requests for this phone number
    const pendingRequests = await PaymentRequest.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Tenant,
          where: { phoneNumber },
          include: [Unit, Floor]
        },
        PaymentType
      ],
      order: [['dueDate', 'ASC']],
    });

    // 4️⃣ Identify the current request in the list
    const currentRequestId = currentRequest.id;

    return res.json({
      success: true,
      currentRequestId,
      data: pendingRequests,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch payment requests' });
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

exports.getTenantPendingRequestsByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Find tenants with this phone number
    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ['id', 'fullName'],
    });

    if (!tenants.length) {
      return res.status(404).json({
        success: false,
        message: 'No tenant found with this phone number',
      });
    }

    const tenantIds = tenants.map(t => t.id);

    // Fetch ONLY pending payment requests
    const paymentRequests = await PaymentRequest.findAll({
      where: {
        tenantId: tenantIds,
        status: 'pending',
      },
      attributes: [
        'id',
        'amount',
        'dueDate',
        'status',
        'createdAt',
      ],
      include: [
        {
          model: Tenant,
          attributes: ['fullName'],
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] },
          ],
        },
        {
          model: PaymentType,
          attributes: ['name'],
        },
      ],
      order: [['dueDate', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Pending payment requests retrieved successfully',
      data: paymentRequests,
    });

  } catch (error) {
    console.error('Public payment request fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment requests',
    });
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

// Helpers
const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
const lastN = (s, n) => s.slice(-n);
const toAmount = (v) => parseFloat(String(v).replace(/[^\d.]/g, ""));


exports.verifyPaymentRequest = async (req, res) => {
  try {
    const { paymentMethod, transactionNumber } = req.body;
    const { amount } = req.query;
    const paymentRequestId = req.params.id;

    // 1️⃣ Validate input
    if (!paymentMethod || !transactionNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod, transactionNumber, and amount are required",
      });
    }
     
    // 2️⃣ Load payment request
    const request = await PaymentRequest.findByPk(paymentRequestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Payment request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Payment request already processed" });
    }

    // 3️⃣ Load payment setting
    const setting = await PaymentSetting.findOne({
      where: { paymentMethod: paymentMethod.toUpperCase() },
    });
    if (!setting) {
      return res.status(400).json({ success: false, message: `${paymentMethod} payment setting not configured` });
    }

    const verificationEndpoint = `${process.env.PAYMENT_VERIFICATION_URL}/api/verify`;

    // 4️⃣ Call external verification endpoint
    let verificationResponse;
    try {
      const response = await axios.post(verificationEndpoint, {
        paymentMethod,
        transactionNumber, // send raw input text
      });
      verificationResponse = response.data;
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify payment: " + (err.response?.data?.message || err.message),
      });
    }

    // 5️⃣ Check verification result
    if (!verificationResponse.success || !verificationResponse.verified) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        data: verificationResponse,
      });
    }

    const verifiedTransactionNumber = verificationResponse.transactionNumber; 
    const fetchedAmount = Number(verificationResponse.amount);

    // 6️⃣ Check for duplicate transaction
    const existingResponse = await PaymentResponse.findOne({
      where: {
        transactionNumber: verifiedTransactionNumber,
        paymentMethod: paymentMethod.toUpperCase(),
      },
    });
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: "This transaction has already been processed",
      });
    }

    // 7️⃣ Validate receiver account (last 4 digits)
    if (verificationResponse.receiverAccount) {
      const expectedLast4 = setting.receiverAccountNumber.slice(-4);
      const actualLast4 = verificationResponse.receiverAccount.slice(-4);
      if (expectedLast4 !== actualLast4) {
        return res.status(400).json({
          success: false,
          message: `Receiver account mismatch. Expected last4: ${expectedLast4}, got: ${actualLast4}`,
        });
      }
    }

    // 8️⃣ Validate receiver name
    if (verificationResponse.receiver) {
      const expectedName = setting.receiverName.trim().toLowerCase();
      const actualName = verificationResponse.receiver.trim().toLowerCase();
      if (expectedName !== actualName) {
        return res.status(400).json({
          success: false,
          message: `Receiver name mismatch. Expected: ${expectedName}, got: ${actualName}`,
        });
      }
    }

    // 9️⃣ Validate amount
    const expectedAmount = Number(req.query.amount);
    if (!Number.isFinite(expectedAmount) || !Number.isFinite(fetchedAmount) || Math.abs(fetchedAmount - expectedAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch. Expected: ${expectedAmount}, got: ${fetchedAmount}`,
      });
    }

    // 🔟 Approve payment request
    await request.update({
      status: "approved",
      approvedAt: new Date(),
    });

    // 1️⃣1️⃣ Store response in PaymentResponse
    const responseRecord = await PaymentResponse.create({
      paymentRequestId,
      paymentMethod: paymentMethod.toUpperCase(),
      transactionNumber: verifiedTransactionNumber, 
      amount: fetchedAmount,
      receiverName: verificationResponse.receiver || null,
      receiverAccount: verificationResponse.receiverAccount || null,
      status: "approved",
      metadata: verificationResponse.raw || verificationResponse,
    });

    // 1️⃣2️⃣ Return success
    return res.json({
      success: true,
      message: "Payment request approved",
      data: {
        paymentRequestId,
        status: "approved",
        transactionNumber: verifiedTransactionNumber,
        paymentMethod: paymentMethod.toUpperCase(),
        responseId: responseRecord.id,
        verification: verificationResponse,
      },
    });

  } catch (err) {
    console.error("verifyPaymentRequest error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process payment request",
      error: err.message,
    });
  }
};

