const { Op } = require('sequelize');
const ElectricCarCharging = require('../models/charging');
const Parking = require('../models/parking');
const BillPayment = require('../models/billPayment');
const Expense = require('../models/expense');
const Maintenance = require('../models/maintenance');
const Payment = require('../models/payment');
const Purchase = require('../models/purchase');
const SalaryPayment = require('../models/SalaryPayment');
const TenantRentCollection = require('../models/tenantRentCollection');
const Tenant = require('../models/tenant');
const Order = require('../models/order');
const User = require('../models/user');
const EmployeeDetail = require('../models/employeeDetail');
const OrderType = require('../models/orderType');
const Vendor = require('../models/Vendor');

const getReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // Build separate date filters for `createdAt` and `paymentDate`
    const createdAtFilter = {};
    const paymentDateFilter = {};

    if (startDate && endDate) {
      createdAtFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
      paymentDateFilter.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      createdAtFilter.createdAt = {
        [Op.gte]: new Date(startDate),
      };
      paymentDateFilter.paymentDate = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      createdAtFilter.createdAt = {
        [Op.lte]: new Date(endDate),
      };
      paymentDateFilter.paymentDate = {
        [Op.lte]: new Date(endDate),
      };
    }

    // Fetch individual records for incomes
    const chargingRecords = await ElectricCarCharging.findAll({
      where: createdAtFilter,
      attributes: ['id', 'chargingCost', 'createdAt'],
    });
    const parkingRecords = await Parking.findAll({
      where: createdAtFilter,
      attributes: ['id', 'price', 'createdAt'],
    });
    const orderRecords = await Order.findAll({  
      where: createdAtFilter,
       include: [
        {
          model: OrderType,
          attributes: ['name'], 
        },
      ],
      attributes: ['id', 'totalprice', 'createdAt'],
    });

    // Fetch TenantRentCollection records with associated Tenant data
    const rentCollectionRecords = await TenantRentCollection.findAll({
      where: {
        ...paymentDateFilter,
        status: 'paid', 
      }, 
      include: [
        {
          model: Tenant,
          attributes: ['amount', 'fullName'],
        },
      ],
      attributes: ['id', 'paymentDate', 'tenantId', 'amountPaid'],
    });

    // Fetch individual records for outcomes
    // const billPaymentRecords = await BillPayment.findAll({
    //   where: {
    //     ...createdAtFilter,
    //     status: 'paid',
    //   },
    //   attributes: ['id', 'amount', 'createdAt'],
    // });
    const expenseRecords = await Expense.findAll({
      where: createdAtFilter,
      attributes: ['id', 'amount', 'createdAt', 'description'],
    });
    const maintenanceRecords = await Maintenance.findAll({
      where: createdAtFilter,
      attributes: ['id', 'cost', 'createdAt', 'description'],
    });
    const paymentRecords = await Payment.findAll({
      where: {
        ...createdAtFilter,
        status: 'complete', 
      },
      include: [
        {
          model: Vendor,
          attributes: ['fname', 'lname'],
        },
      ],
      attributes: ['id', 'price', 'createdAt', 'item'],
       
    });
    const purchaseRecords = await Purchase.findAll({
      where: createdAtFilter,
      attributes: ['id', 'totalPrice', 'createdAt'],
    });
    const salaryPaymentRecords = await SalaryPayment.findAll({
    where: {
      ...createdAtFilter,
      status: 'paid',
    },
    include: [
      {
        model: User,
        as: 'User', // must match the alias in your association
        attributes: ['fname', 'lname', 'email'],
      },
    ],
    attributes: ['id', 'netSalary', 'allowance', 'createdAt'],
  });


    // Aggregate income sources
    const totalCharging = await ElectricCarCharging.sum('chargingCost', {
      where: createdAtFilter,
    });
    const totalParking = await Parking.sum('price', {
      where: createdAtFilter,
    });

    const totalOrder = await Order.sum('totalprice', {
      where: createdAtFilter,
    });

    // Aggregate rent collection income by summing the `amount` from Tenant
    const totalRentCollection = rentCollectionRecords.reduce((sum, record) => {
      return sum + (parseFloat(record.amountPaid) || 0);
    }, 0);
    
    // Aggregate outcomes
    // const totalBillPayments = await BillPayment.sum('amount', {
    //   where: createdAtFilter,
    // });
    const totalExpenses = await Expense.sum('amount', {
      where: createdAtFilter,
    });
    const totalMaintenance = await Maintenance.sum('cost', {
      where: createdAtFilter,
    });
    const totalPayments = await Payment.sum('price', {
      where: createdAtFilter,
    });

    const totalNetSalary = await SalaryPayment.sum('netSalary', {
      where: {
        ...createdAtFilter,
        status: 'paid',
      },
    });

    const totalAllowance = await SalaryPayment.sum('allowance', {
      where: {
        ...createdAtFilter,
        status: 'paid',
      },
    });

    const totalSalaryPayments = (totalNetSalary || 0) + (totalAllowance || 0);


    // Calculate totals safely
    const income = (totalCharging || 0) + (totalParking || 0) + (totalRentCollection || 0) + (totalOrder || 0);
    const outcome =  (totalExpenses || 0) + (totalMaintenance || 0) + (totalPayments || 0) + (totalSalaryPayments || 0);
    const netIncome = income - outcome;

    // Prepare detailed report
    const report = {
      incomes: {
        charging: {
          totalCharging: totalCharging || 0,
          records: chargingRecords.map(record => ({
            amount: record.chargingCost,
            date: record.createdAt,
          })),
        },
        parking: {
          totalParking: totalParking || 0,
          records: parkingRecords.map(record => ({
            amount: record.price,
            date: record.createdAt,
          })),
        },
        orders: {
          totalOrder: totalOrder || 0,
          records: orderRecords.map(record => ({
            orderType: record.OrderType?.name || '',
            amount: record.totalprice,
            date: record.createdAt,
          })),
        },
        rentCollection: {
          totalRent: totalRentCollection || 0,
          records: rentCollectionRecords.map(record => ({
            tenant: `${record.Tenant?.fullName || ''}`,
            amount: parseFloat(record.amountPaid) || 0,
            date: record.paymentDate,
            
          }))          
        },
        totalIncome: income,
      },
      outcomes: {
       
        expenses: {
          totalExpenses: totalExpenses || 0,
          records: expenseRecords.map(record => ({
            description: record.description || '',
            amount: record.amount,
            date: record.createdAt,
          })),
        },
        maintenance: {
          totalMaintenance: totalMaintenance || 0,
          records: maintenanceRecords.map(record => ({
            description: record.description || '',
            amount: record.cost,
            date: record.createdAt,
          })),
        },
        payments: {
          totalPayments: totalPayments || 0,
          records: paymentRecords.map(record => ({
            vendor: `${record.Vendor?.fname || ''} ${record.Vendor?.lname || ''}`,
            item: record.item || '',
            amount: record.price,
            date: record.createdAt,
          })),
        },
       salaryPayments: {
        totalSalary: totalSalaryPayments,
        records: salaryPaymentRecords.map(record => ({
          user: `${record.User?.fname || ''} ${record.User?.lname || ''}`,
          netSalary: record.netSalary,
          allowance: record.allowance,
          total: parseFloat(record.netSalary || 0) + parseFloat(record.allowance || 0),
          date: record.createdAt,
        })),
      },

        totalOutcome: outcome,
      },
      netIncome,
    };
    

    // Return the detailed report
    res.json(report);
  } catch (error) {
    console.error('Error in getReport:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  getReport,
};