const TenantPayment = require('../models/tenantPayments');
const Tenant = require('../models/tenant');
const BillType = require('../models/billType');
const Unit = require('../models/unit');
const Floor = require('../models/floor');
const moment = require('moment');
const { Op } = require('sequelize');
const User = require('../models/user');
const Role = require('../models/role');
const sendNotificationHelper = require('../helpers/sendAlert');
const cron = require('node-cron');
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");

cron.schedule('0 8 * * *', async () => {
  try {
    const today = moment().startOf('day');
    console.log(`Running utility due reminder job for date: ${today.toISOString()}`);

    const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });

    // Fetch last paid utility payments
    const lastPaidPayments = await TenantPayment.findAll({
      where: { status: 'Paid' },
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'phoneNumber'], // include phoneNumber
        },
        {
          model: BillType,
          attributes: ['typeName'],
        },
      ],
      order: [['endDate', 'DESC']],
    });

    if (!lastPaidPayments.length) {
      console.log("No paid utility payments found.");
      return;
    }

    // Fetch admins
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const admins = await User.findAll({ where: { roleId: adminRole.id } });

    for (const payment of lastPaidPayments) {
      const tenant = payment.Tenant;
      const billType = payment.BillType;
      const lastEndDate = moment(payment.endDate).startOf('day');
      const diffInDays = today.diff(lastEndDate, 'days');
      const formattedDate = lastEndDate.format('YYYY-MM-DD');

      let message = '';

      if (diffInDays < 0 && Math.abs(diffInDays) <= 2) {
        message = `${billType.typeName} bill for tenant ${tenant.fullName} is due in ${Math.abs(diffInDays)} day(s), on ${formattedDate}.`;
      } else if (diffInDays === 0) {
        message = `${billType.typeName} bill for tenant ${tenant.fullName} is due today (${formattedDate}).`;
      } else if (diffInDays > 0 && diffInDays <= 2) {
        message = `${billType.typeName} bill for tenant ${tenant.fullName} was due on ${formattedDate} and is now ${diffInDays} day(s) overdue.`;
      } else {
        continue; // Skip if not within 2-day window
      }

      console.log(`Notification content: ${message}`);

      // Notify admins (dashboard)
      await Promise.all(
        admins.map((admin) =>
          sendNotificationHelper({
            adminId: admin.id,
            title: `Utility Payment Reminder: ${billType.typeName}`,
            body: message,
            type: 'Utility Payment Reminder',
            receiver_type: 'staff',
          })
        )
      );

      await sendNotificationHelper({
        tenantId: tenant.id,
        title: `Your ${billType.typeName} Bill Reminder`,
        body: message,
        type: 'Utility Payment Reminder',
        receiver_type: 'tenant',
      });

      // SMS to admins
      await Promise.all(
        admins.map((admin) => {
          if (!admin.phone) return Promise.resolve();
          return smsUtil.sendSingleSMS({
            phone: admin.phone,
            msg: message,
            callback: process.env.GEEZSMS_WEBHOOK_URL,
          });
        })
      );

      // SMS to tenant
      if (tenant.phoneNumber) {
        const loginUrl = process.env.TENANT_PORTAL_URL;
        await smsUtil.sendSingleSMS({
          phone: tenant.phoneNumber,
          msg: `Reminder: ${message}. \nPlease log in to your tenant portal at ${loginUrl} for more details.`,
          callback: process.env.GEEZSMS_WEBHOOK_URL,
        });
      }
    }

    console.log("Utility payment notifications sent successfully.");
  } catch (error) {
    console.error("Error sending utility payment notifications:", error.message);
    console.error(error.stack);
  }
});

// Create a new tenant payment
exports.createPayment = async (req, res) => {
  try {
    const {
      tenantId,
      billTypeId, 
      startDate,
      endDate,
      status,
      amountPaid,
      paymentMethod
    } = req.body;

    // Ensure all required fields are provided
    if (!tenantId || !billTypeId || !startDate || !endDate || !amountPaid || !paymentMethod) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date.' });
    }

    // Check for exact duplicate for same tenant, type, and exact date range
    const existingPayment = await TenantPayment.findOne({
      where: {
        tenantId,
        billTypeId,
        startDate: startDate,
        endDate: endDate
      }
    });

    if (existingPayment) {
      return res.status(409).json({
        message: 'A payment for this tenant, type, and date range already exists.'
      });
    }

    // Proceed with payment creation
    const payment = await TenantPayment.create({
      tenantId,
      billTypeId,
      startDate,
      endDate,
      status,
      amountPaid,
      paymentMethod
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
};

// Get all tenant payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await TenantPayment.findAll({
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'document', 'leaseStartDate', 'leaseEndDate'],
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] }
          ],
        },
        {
          model: BillType,
          attributes: ['typeName'],
        },
      ],
    });

    // Process tenants with detailed information
    const paymentsWithDetails = payments.map(payment => {
      const tenant = payment.Tenant;
      const leaseStartDate = tenant ? moment(tenant.leaseStartDate) : null;
      const leaseEndDate = tenant ? moment(tenant.leaseEndDate) : null;
      const currentDate = moment();
      const remainingDays = leaseEndDate ? leaseEndDate.diff(currentDate, 'days') : null;

      return {
        ...payment.toJSON(),
        Tenant: tenant
          ? {
              ...tenant.toJSON(),
              monthsPaid: leaseStartDate && leaseEndDate ? leaseEndDate.diff(leaseStartDate, 'months') : 0,
              remainingDays: remainingDays > 0 ? remainingDays : 0,
            }
          : null,
      };
    });

    res.status(200).json(paymentsWithDetails);
  } catch (error) {
    console.error("Error fetching payments:", error); // Log the error
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

exports.getAllPaymentByDate = async (req, res) => {
  try {
    // Extract date range from query parameters
    const { startDate, endDate } = req.query;

    // Build the date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [moment(startDate).startOf('day').toDate(), moment(endDate).endOf('day').toDate()],
      };
    }

    const payments = await TenantPayment.findAll({
      where: dateFilter,
      include: [
        {
          model: Tenant,
          attributes: ['fullName', 'document', 'leaseStartDate', 'leaseEndDate'],
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] },
          ],
        },
        {
          model: BillType,
          attributes: ['typeName'],
        },
      ],
    });

    // Process tenants with detailed information
    const paymentsWithDetails = payments.map(payment => {
      const tenant = payment.Tenant;
      const leaseStartDate = tenant ? moment(tenant.leaseStartDate) : null;
      const leaseEndDate = tenant ? moment(tenant.leaseEndDate) : null;
      const currentDate = moment();
      const remainingDays = leaseEndDate ? leaseEndDate.diff(currentDate, 'days') : null;

      return {
        ...payment.toJSON(),
        Tenant: tenant
          ? {
              ...tenant.toJSON(),
              monthsPaid: leaseStartDate && leaseEndDate ? leaseEndDate.diff(leaseStartDate, 'months') : 0,
              remainingDays: remainingDays > 0 ? remainingDays : 0,
            }
          : null,
      };
    });

    res.status(200).json(paymentsWithDetails);
  } catch (error) {
    console.error('Error fetching payments:', error); // Log the error
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

exports.getPaymentByTenantId = async (req, res) => {
  try {
    const phoneNumber = req.user.phone; 

    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ['id'],
    });
    
    const tenantIds = tenants.map(t => t.id);

    const payment = await TenantPayment.findAll({
       where: { tenantId: tenantIds, },
      include: [
        { model: Tenant, attributes: ['fullName'],
          include: [
            { model: Unit, attributes: ['unitNumber'] },
            { model: Floor, attributes: ['floorNumber'] }
          ],
        },
        { model: BillType, attributes: ['typeName'] }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
};

// Get last paid payment for tenant + bill type
exports.getLastTenantPayment = async (req, res) => {
  try {
    const { tenantId, billTypeId } = req.query;

    if (!tenantId || !billTypeId) {
      return res.status(400).json({
        message: "tenantId and billTypeId are required",
      });
    }

    const lastPayment = await TenantPayment.findOne({
      where: {
        tenantId,
        billTypeId,
        status: "paid", 
      },
      order: [["endDate", "DESC"]],
    });

    if (!lastPayment) {
      return res.json(null); 
    }

    return res.status(200).json({
      startDate: lastPayment.startDate,
      endDate: lastPayment.endDate,
    });
  } catch (error) {
    console.error("Error fetching last tenant payment:", error);
    return res.status(500).json({
      message: "Error fetching last tenant payment",
      error: error.message,
    });
  }
};

// Update a tenant payment
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, billTypeId, amountPaid, startDate, endDate, status } = req.body;

    const payment = await TenantPayment.findByPk(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await payment.update({ tenantId, billTypeId, amountPaid, startDate, endDate, status });
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment', error });
  }
};

// Delete a tenant payment
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await TenantPayment.findByPk(id);

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await payment.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment', error });
  }
};

exports.getTenantPaymentsReport = async (req, res) => {
  try {
    const { startDate, endDate, billTypeId, tenantId, createdAt } = req.body;

    let whereCondition = {};
    let tenantWhere = {};

    // Date filters
    if (startDate && endDate) {
  whereCondition[Op.and] = [
    { startDate: { [Op.gte]: new Date(startDate) } },
    { endDate: { [Op.lte]: new Date(endDate) } },
  ];
    } else if (startDate) {
      whereCondition.startDate = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.endDate = { [Op.lte]: new Date(endDate) };
    }

    if (billTypeId) {
      whereCondition.billTypeId = billTypeId;
    }

    if (createdAt) {
      const d = new Date(createdAt);
      whereCondition.createdAt = {
        [Op.between]: [
          new Date(d.setHours(0, 0, 0, 0)),
          new Date(d.setHours(23, 59, 59, 999)),
        ],
      };
    }

    // 🔑 Resolve phone number from tenantId
    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId, {
        attributes: ["phoneNumber"],
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      tenantWhere.phoneNumber = tenant.phoneNumber;
    }

    const tenantPayments = await TenantPayment.findAll({
      where: whereCondition,
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName", "phoneNumber"],
          where: tenantWhere, // 🔥 group/filter by phone number
          include: [
            { model: Unit, attributes: ["unitNumber"] },
            { model: Floor, attributes: ["floorNumber"] },
          ],
        },
        { model: BillType, attributes: ["id", "typeName"] },
      ],
      order: [["startDate", "DESC"]],
    });

    res.status(200).json(tenantPayments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching tenant payments report",
      error: error.message,
    });
  }
};
