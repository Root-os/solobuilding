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

cron.schedule('0 8 * * *', async () => {
  try {
    const today = moment().startOf('day');
    console.log(`Running utility due reminder job for date: ${today.toISOString()}`);

    // Fetch last paid utility payments along with their bill type
    const lastPaidPayments = await TenantPayment.findAll({
      where: { status: 'Paid' },
      include: [
        {
          model: Tenant,
          attributes: ['fullName'],
        },
        {
          model: BillType, // Include the BillType model to get the typeName
          attributes: ['typeName'],
        },
      ],
      order: [['endDate', 'DESC']],
    });

    if (!lastPaidPayments.length) {
      console.log("No paid utility payments found.");
      return;
    }

    // Get admins by role name
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const admins = await User.findAll({ where: { roleId: adminRole.id } });

    for (const payment of lastPaidPayments) {
      const tenant = payment.Tenant;
      const billType = payment.BillType; // Access the bill type info
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
        continue;
      }

      console.log(`Notification content: ${message}`);

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
    }
  } catch (error) {
    console.error("Error sending utility payment notifications:", error.message);
    console.error(error.stack);
  }
});

// Create a new tenant payment
exports.createPayment = async (req, res) => {
  try {
    const { tenantId, billPaymentTypeId, amount, startDate, endDate, status, amountPaid, paymentMethod, paymentDate } = req.body;

    // Ensure all required fields are provided
    if (!tenantId || !billPaymentTypeId || !amount || !startDate || !endDate || !amountPaid || !paymentMethod || !paymentDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Proceed with payment creation
    const payment = await TenantPayment.create({
      tenantId,
      paymentTypeId: billPaymentTypeId,
      amount,
      startDate,
      endDate,
      status,
      amountPaid,
      paymentMethod,
      paymentDate
    });

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment', error });
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


// Get a specific payment by ID
exports.getPaymentByTenantId = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const payment = await TenantPayment.findAll({
      where: { tenantId }, // Correct way to filter by tenantId
      include: [
        { model: Tenant, attributes: ['fullName'] },
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


// Update a tenant payment
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, billPaymentTypeId, amount, startDate, endDate, status } = req.body;

    const payment = await TenantPayment.findByPk(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await payment.update({ tenantId, paymentTypeId:billPaymentTypeId, amount, startDate, endDate, status });
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
      const { startDate, endDate, billPaymentTypeId, tenantId, createdAt } = req.body;

      let whereCondition = {};

      // Filter by startDate & endDate range
      if (startDate && endDate) {
          whereCondition.startDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      } else if (startDate) {
          whereCondition.startDate = { [Op.gte]: new Date(startDate) };
      } else if (endDate) {
          whereCondition.endDate = { [Op.lte]: new Date(endDate) };
      }

      // Filter by bill type
      if (billPaymentTypeId) {
          whereCondition.paymentTypeId = billPaymentTypeId;
      }

      // Filter by tenant ID
      if (tenantId) {
          whereCondition.tenantId = tenantId;
      }

      // Filter by createdAt (Exact Date or Range)
      if (createdAt) {
          const createdAtDate = new Date(createdAt);
          whereCondition.createdAt = {
              [Op.gte]: new Date(createdAtDate.setHours(0, 0, 0, 0)), // Start of the day
              [Op.lte]: new Date(createdAtDate.setHours(23, 59, 59, 999)), // End of the day
          };
      }

      // Fetch data from the database
      const tenantPayments = await TenantPayment.findAll({
          where: whereCondition,
          include: [
              { model: Tenant, attributes: ["id", "fullName"] }, // Fetch tenant name
              { model: BillType, attributes: ["id", "typeName"] } // Fetch bill type
          ],
          order: [["startDate", "DESC"]]
      });

      return res.status(200).json(tenantPayments);
  } catch (error) {
      return res.status(500).json({ message: "Error fetching tenant payments report", error: error.message });
  }
};