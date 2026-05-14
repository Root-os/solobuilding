const PaymentRequest = require("../models/paymentRequests");
const PaymentSetting = require("../models/paymentSetting");
const PaymentResponse = require("../models/verifiedPayments");
const Tenant = require("../models/tenant");
const Floor = require("../models/floor");
const Unit = require("../models/unit");
const BillType = require("../models/billType");
const TenantRentCollection = require("../models/tenantRentCollection");
const TenantPayment = require("../models/tenantPayments");
const { Op } = require("sequelize");
const {
  paymentRequestSchema,
  paramsSchema,
  paymentRequestStatusSchema,
} = require("../helpers/schema");
const sendNotificationHelper = require("../helpers/sendAlert");
const User = require("../models/user");
const Role = require("../models/role");
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");
const axios = require("axios");
const { normalizeTransactionNumber } = require("../helpers/normalizeCbeId");
const generateAccessCode = require("../helpers/accessCodePaymentReq");

// Create a payment request
exports.createPaymentRequest = async (req, res) => {
  try {
    // 1️⃣ Validate request body
    const { error } = paymentRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const {
      tenantId,
      message,
      billTypeId,
      level,
      amount,
      dueDate,
      repeatedFor,
      startDate,
      endDate,
      paidDays,
    } = req.body;

    // 2️⃣ Check tenant exists
    const existingTenant = await Tenant.findByPk(tenantId);
    if (!existingTenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // 3️⃣ Check payment type exists
    const existingbillType = await BillType.findByPk(billTypeId);
    if (!existingbillType) {
      return res.status(404).json({ message: "Payment Type not found" });
    }

    // 4️⃣ Generate access code
    const accessCode = generateAccessCode(6);

    // 5️⃣ Create payment request
    const newPaymentRequest = await PaymentRequest.create({
      tenantId,
      message,
      billTypeId,
      level,
      amount,
      dueDate,
      repeatedFor,
      accessCode,
      startDate,
      endDate,
      paidDays,
    });

    const paymentLink = `${process.env.REQUEST_LINK_URL}/${accessCode}`;

    // 6️⃣ Send notification to tenant
    await sendNotificationHelper({
      adminId: tenantId,
      title: "New Payment Request",
      body: "A new payment request has been submitted by apartment manager. Please check the payment requests page for more details.",
      type: "New Payment Request",
      receiver_type: "tenant",
    });

    // 7️⃣ Fetch floor & unit info for SMS
    const floor = await Floor.findByPk(existingTenant.floorId);
    const unit = await Unit.findByPk(existingTenant.unitId);

    const loginUrl = process.env.TENANT_PORTAL_URL;

    const smsMessage = `Hi ${existingTenant.fullName},

    A new ${existingbillType.name} is due by ${dueDate} for your unit (Floor ${floor?.floorNumber}, Unit ${unit?.unitNumber}).
    You can view and verify your pending payment here: ${paymentLink}
    Thank you!`;

    // 8️⃣ Send SMS safely in the background
    setImmediate(async () => {
      try {
        const smsUtil = createSingleSMSUtil({
          token: process.env.GEEZSMS_TOKEN,
        });
        await smsUtil.sendSingleSMS({
          phone: existingTenant.phoneNumber,
          msg: smsMessage + `\nLogin here: ${loginUrl}`,
          callback: process.env.GEEZSMS_WEBHOOK_URL,
        });
      } catch (err) {
        console.error("SMS failed for tenant", existingTenant.id, err.message);
      }
    });

    // 9️⃣ Return response
    res.status(201).json({
      message: "Payment request created successfully",
      data: newPaymentRequest,
    });
  } catch (error) {
    console.error("Error creating payment request:", error);
    res.status(500).json({
      message: "Error creating payment request",
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
      return res.status(404).json({ success: false, message: "Invalid link" });
    }

    // 2️⃣ Get phone number from the tenant
    const phoneNumber = currentRequest.Tenant.phoneNumber;

    // 3️⃣ Fetch all pending requests for this phone number
    const pendingRequests = await PaymentRequest.findAll({
      where: { status: "pending" },
      include: [
        {
          model: Tenant,
          where: { phoneNumber },
          include: [Unit, Floor],
        },
        BillType,
      ],
      order: [["dueDate", "ASC"]],
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
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment requests" });
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
          attributes: ["fullName"],
          include: [
            { model: Unit, attributes: ["unitNumber"] },
            { model: Floor, attributes: ["floorNumber"] },
          ],
        },
        {
          model: BillType,
          attributes: ["typeName"],
        },
      ],
    });

    res.status(200).json(paymentRequests);
  } catch (error) {
    console.error("Error fetching payment requests:", error);
    res.status(500).json({
      message: "Error fetching payment requests",
      error: error.message,
    });
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
          attributes: ["fullName"],
        },
        {
          model: BillType,
          attributes: ["typeName"],
        },
      ],
    });

    if (!paymentRequest) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    res.status(200).json(paymentRequest);
  } catch (error) {
    console.error("Error fetching payment request:", error);
    res.status(500).json({
      message: "Error fetching payment request",
      error: error.message,
    });
  }
};

// Update a payment request
exports.updatePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, level, amount, dueDate, status } = req.body;

    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    await paymentRequest.update({ message, level, amount, dueDate, status });

    res.status(200).json({
      message: "Payment request updated successfully",
      data: paymentRequest,
    });
  } catch (error) {
    console.error("Error updating payment request:", error);
    res.status(500).json({
      message: "Error updating payment request",
      error: error.message,
    });
  }
};

// Delete a payment request
exports.deletePaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    await paymentRequest.destroy();
    res.status(200).json({ message: "Payment request deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment request:", error);
    res.status(500).json({
      message: "Error deleting payment request",
      error: error.message,
    });
  }
};

// Approve or Reject Payment
exports.reviewPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Use approved or rejected." });
    }

    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    paymentRequest.status = status;
    await paymentRequest.save();

    res.status(200).json({
      message: `Payment ${status} successfully`,
      data: paymentRequest,
    });
  } catch (error) {
    console.error("Error reviewing payment:", error);
    res
      .status(500)
      .json({ message: "Error reviewing payment", error: error.message });
  }
};

exports.getMyRequestFromAdmin = async (req, res) => {
  try {
    // Validate user ID
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const phoneNumber = req.user.phone;
    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ["id"],
    });
    // console.log('Fetching payment requests for tenant ID:', id);

    const tenantIds = tenants.map((t) => t.id);

    // Fetch payment requests that belong to the user
    const paymentRequests = await PaymentRequest.findAll({
      where: { tenantId: tenantIds },
      include: [
        {
          model: Tenant,
          attributes: ["fullName"],
          include: [
            { model: Unit, attributes: ["unitNumber"] },
            { model: Floor, attributes: ["floorNumber"] },
          ],
        },
        { model: BillType, attributes: ["typeName"] },
      ],
    });
    res.status(200).json({
      message: "Payment requests retrieved successfully",
      data: paymentRequests,
    });
  } catch (error) {
    console.error("Error retrieving payment requests:", error);
    res.status(500).json({
      message: "Error retrieving payment requests",
      error: error.message,
    });
  }
};

exports.getTenantPendingRequestsByPhone = async (req, res) => {
  try {
    const { phoneNumber } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Find tenants with this phone number
    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ["id", "fullName"],
    });

    if (!tenants.length) {
      return res.status(404).json({
        success: false,
        message: "No tenant found with this phone number",
      });
    }

    const tenantIds = tenants.map((t) => t.id);

    // Fetch ONLY pending payment requests
    const paymentRequests = await PaymentRequest.findAll({
      where: {
        tenantId: tenantIds,
        status: "pending",
      },
      attributes: ["id", "amount", "dueDate", "status", "createdAt"],
      include: [
        {
          model: Tenant,
          attributes: ["fullName"],
          include: [
            { model: Unit, attributes: ["unitNumber"] },
            { model: Floor, attributes: ["floorNumber"] },
          ],
        },
        {
          model: PaymentType,
          attributes: ["name"],
        },
      ],
      order: [["dueDate", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Pending payment requests retrieved successfully",
      data: paymentRequests,
    });
  } catch (error) {
    console.error("Public payment request fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment requests",
    });
  }
};

// Upload Payment Receipt
exports.uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { id } = req.params;
    const paymentRequest = await PaymentRequest.findByPk(id);
    if (!paymentRequest) {
      return res.status(404).json({ message: "Payment request not found" });
    }

    const tenant = await Tenant.findByPk(paymentRequest.tenantId);
    const unit = await Unit.findByPk(tenant.unitId);
    const floor = await Floor.findByPk(tenant.floorId);

    const isFirstUpload = !paymentRequest.receipt;

    // Update receipt URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    paymentRequest.receipt = `${baseUrl}/uploads/receipts/${req.file.filename}`;
    await paymentRequest.save();

    const admins = await User.findAll({
      include: {
        model: Role,
        where: { name: "admin" },
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
            title: "Payment Receipt Upload",
            body: notificationBody,
            type: "Payment Receipt Upload",
            receiver_type: "staff",
          }),
        ),
      );

      await Promise.all(
        admins.map((admin) =>
          smsUtil.sendSingleSMS({
            phone: admin.phone,
            msg: smsMessage,
            callback: process.env.GEEZSMS_WEBHOOK_URL,
          }),
        ),
      );
    }

    res
      .status(200)
      .json({ message: "Receipt uploaded successfully", data: paymentRequest });
  } catch (error) {
    console.error("Error uploading receipt:", error);
    res
      .status(500)
      .json({ message: "Error uploading receipt", error: error.message });
  }
};

// ================================================================================================

// Helpers
const digitsOnly = (s) => String(s || "").replace(/\D/g, "");
const lastN = (s, n) => s.slice(-n);
const toAmount = (v) => parseFloat(String(v).replace(/[^\d.]/g, ""));

const METHOD_ALIASES = {
  // CBE
  cbe: "cbe",
  "commercial bank of ethiopia": "cbe",
  "nigid bank": "cbe",
  "commertial bank": "cbe",

  // CBEBirr
  cbebirr: "cbebirr",
  "cbe birr": "cbebirr",
  "cbe mobile": "cbebirr",

  // Abyssinia
  abyssinia: "abyssinia",
  "abssinia bank": "abyssinia",

  // Dashen
  dashen: "dashen",
  "dashen bank": "dashen",

  // TeleBirr
  telebirr: "telebirr",
  "tele birr": "telebirr",
};

exports.verifyPaymentRequest = async (req, res) => {
  try {
    const { paymentMethodId, transactionNumber } = req.body;
    const { amount } = req.query;
    const paymentRequestId = req.params.id;

    // 1️⃣ Validate input
    if (!paymentMethodId || !transactionNumber) {
      return res.status(400).json({
        success: false,
        message: "paymentMethodId and transactionNumber are required",
      });
    }

    // 2️⃣ Load payment request
    const request = await PaymentRequest.findByPk(paymentRequestId, {
      include: [{ model: BillType }],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Payment request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment request already processed",
      });
    }

    // 3️⃣ Load payment setting
    const setting = await PaymentSetting.findByPk(paymentMethodId);

    if (!setting) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const paymentMethodName = setting.paymentMethod;

    const normalizedMethod =
      METHOD_ALIASES[paymentMethodName?.trim().toLowerCase()];

    const useExternalVerification = !!normalizedMethod;

    // 4️⃣ Manual verification requires amount
    if (!useExternalVerification && !amount) {
      return res.status(400).json({
        success: false,
        message: "amount is required for manual verification",
      });
    }

    let verificationResponse;

    // 5️⃣ EXTERNAL VERIFICATION FLOW
    if (useExternalVerification) {
      const verificationEndpoint = `${process.env.PAYMENT_VERIFICATION_URL}/api/verify`;

      try {
        const response = await axios.post(verificationEndpoint, {
          paymentMethod: paymentMethodName,
          transactionNumber,
        });

        verificationResponse = response.data;
      } catch (err) {
        return res.status(500).json({
          success: false,
          message:
            "Failed to verify payment: " +
            (err.response?.data?.message || err.message),
        });
      }

      if (!verificationResponse.success || !verificationResponse.verified) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
          data: verificationResponse,
        });
      }
    }

    // 6️⃣ MANUAL VERIFICATION FLOW
    else {
      verificationResponse = {
        success: true,
        verified: true,
        transactionNumber,
        amount: Number(amount),
        receiver: null,
        receiverAccount: null,
        raw: {
          manualVerification: true,
        },
      };
    }

    // 7️⃣ Final verification safety check
    if (!verificationResponse.success || !verificationResponse.verified) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        data: verificationResponse,
      });
    }

    const verifiedTransactionNumber = verificationResponse.transactionNumber;

    const fetchedAmount = Number(verificationResponse.amount);

const expectedAmount = Number(request.amount);

const extraAmount =
  fetchedAmount > expectedAmount
    ? fetchedAmount - expectedAmount
    : 0;

    // 8️⃣ Duplicate check
    const existingResponse = await PaymentResponse.findOne({
      where: {
        transactionNumber: verifiedTransactionNumber,
        paymentTypeId: paymentMethodId,
      },
    });

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: "This transaction has already been processed",
      });
    }

    // 9️⃣ STRICT VALIDATION ONLY FOR EXTERNAL METHODS
    if (useExternalVerification) {
      // Receiver account check
      if (verificationResponse.receiverAccount) {
        const expectedLast4 = setting.receiverAccountNumber.slice(-4);

        const actualLast4 = verificationResponse.receiverAccount.slice(-4);

        if (expectedLast4 !== actualLast4) {
          return res.status(400).json({
            success: false,
            message:
              `Receiver account mismatch. Expected last4: ` +
              `${expectedLast4}, got: ${actualLast4}`,
          });
        }
      }

      // Receiver name check
      if (verificationResponse.receiver) {
        const expectedName = setting.receiverName.trim().toLowerCase();

        const actualName = verificationResponse.receiver.trim().toLowerCase();

        if (expectedName !== actualName) {
          return res.status(400).json({
            success: false,
            message:
              `Receiver name mismatch. Expected: ` +
              `${expectedName}, got: ${actualName}`,
          });
        }
      }

      // Amount check (allow equal or greater payment)
      const expectedAmount = Number(request.amount);

      if (
        !Number.isFinite(expectedAmount) ||
        !Number.isFinite(fetchedAmount) ||
        fetchedAmount < expectedAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Insufficient payment amount. Expected at least: ` +
            `${expectedAmount}, got: ${fetchedAmount}`,
        });
      }
    }

    // 🔟 Approve payment request
    await request.update({
      status: "approved",
      approvedAt: new Date(),
    });

    const billTypeName = request.BillType?.typeName?.trim().toLowerCase() || "";

    // Rent flow
    if (/\brent\b/i.test(billTypeName)) {
      const existingRent = await TenantRentCollection.findOne({
        where: {
          tenantId: request.tenantId,
          paymentDate: request.startDate,
          nextDueDate: request.endDate,
        },
      });

      if (!existingRent) {
        await TenantRentCollection.create({
          tenantId: request.tenantId,
          paymentDate: request.startDate,
          nextDueDate: request.endDate,
          paidDays: request.paidDays || "0",
          paymentTypeId: paymentMethodId,
          amountPaid: expectedAmount.toString(),
extraAmount: extraAmount,
          status: "Paid",
          isPaid: true,
          punishment: 0,
        });

        await Tenant.update(
          { leaseEndDate: request.endDate },
          { where: { id: request.tenantId } },
        );

        const updatedTenant = await Tenant.findByPk(request.tenantId);
        console.log("LEASE FINAL:", updatedTenant.leaseEndDate);
      }
    }

    // Other payments flow
    else {
      const existingPayment = await TenantPayment.findOne({
        where: {
          tenantId: request.tenantId,
          startDate: request.startDate,
          endDate: request.endDate,
        },
      });

      if (!existingPayment) {
        await TenantPayment.create({
          tenantId: request.tenantId,
          billTypeId: request.billTypeId,
          amountPaid: fetchedAmount,
          startDate: request.startDate,
          endDate: request.endDate || null,
          paymentTypeId: paymentMethodId,
          status: "paid",
          proofOfPayment: verifiedTransactionNumber,
        });
      }
    }

    // 1️⃣1️⃣ Store response
    const responseRecord = await PaymentResponse.create({
      paymentRequestId,
      paymentTypeId: paymentMethodId,
      transactionNumber: verifiedTransactionNumber,
      amount: fetchedAmount,
      receiverName: verificationResponse.receiver || null,
      receiverAccount: verificationResponse.receiverAccount || null,
      status: "approved",
      metadata: verificationResponse.raw || verificationResponse,
    });

    // 1️⃣2️⃣ Response
    return res.json({
      success: true,
      message: "Payment request approved",
      data: {
        paymentRequestId,
        status: "approved",
        transactionNumber: verifiedTransactionNumber,
        paymentTypeId: paymentMethodId,
        paymentMethod: paymentMethodName,
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
