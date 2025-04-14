const { Op } = require('sequelize');
const ElectricCarCharging = require('../models/charging');
const Parking = require('../models/parking');
const BillPayment = require('../models/billPayment');
const Expense = require('../models/expense');
const Maintenance = require('../models/maintenance');
const Payment = require('../models/payment');
const Purchase = require('../models/purchase');
const SalaryPayment = require('../models/SalaryPayment');



const getReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    // Build date filter using `createdAt`
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      dateFilter.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      dateFilter.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    console.log(' Date Filter:', dateFilter);

    // Fetch individual records for incomes
    const chargingRecords = await ElectricCarCharging.findAll({
      where: dateFilter,
      attributes: ['id', 'chargingCost', 'createdAt'],
    });
    const parkingRecords = await Parking.findAll({
      where: dateFilter,
      attributes: ['id', 'price', 'createdAt'],
    });

    console.log(' Matching Income Records:', {
      chargingRecords: chargingRecords.map(r => r.toJSON()),
      parkingRecords: parkingRecords.map(r => r.toJSON()),
    });

    // Fetch individual records for outcomes
    const billPaymentRecords = await BillPayment.findAll({
      where: dateFilter,
      attributes: ['id', 'amount', 'createdAt'],
    });
    const expenseRecords = await Expense.findAll({
      where: dateFilter,
      attributes: ['id', 'amount', 'createdAt'],
    });
     
    const maintenanceRecords = await Maintenance.findAll({
      where: dateFilter,
      attributes: ['id', 'cost', 'createdAt'],
    });

    const paymentRecords = await Payment.findAll({
      where: dateFilter,
      attributes: ['id', 'price', 'createdAt'],
    });

    const purchaseRecords = await Purchase.findAll({
      where: dateFilter,
      attributes: ['id', 'totalPrice', 'createdAt'],
    });
    const salaryPaymentRecords = await SalaryPayment.findAll({
      where: dateFilter,
      attributes: ['id', 'amount', 'createdAt'],
    });

    console.log(' Matching Outcome Records:', {
      billPaymentRecords: billPaymentRecords.map(r => r.toJSON()),
      expenseRecords: expenseRecords.map(r => r.toJSON()),
      maintenanceRecords: maintenanceRecords.map(r => r.toJSON()),
    });

    // Aggregate income sources
    const totalCharging = await ElectricCarCharging.sum('chargingCost', {
      where: dateFilter,
    });
    const totalParking = await Parking.sum('price', {
      where: dateFilter,
    });

    console.log(' Income Sources:', {
      totalCharging,
      totalParking,
    });

    // Aggregate outcomes
    const totalBillPayments = await BillPayment.sum('amount', {
      where: dateFilter,
    });
    const totalExpenses = await Expense.sum('amount', {
      where: dateFilter,
    });
    const totalMaintenance = await Maintenance.sum('cost', {
      where: dateFilter,
    });
    const totalPayments = await Payment.sum('price', {
      where: dateFilter,
    });
    const totalPurchases = await Purchase.sum('totalPrice', {
      where: dateFilter,
    });
    const totalSalaryPayments = await SalaryPayment.sum('amount', {
      where: dateFilter,
    });

    console.log(' Outcome Sources:', {
      totalBillPayments,
      totalExpenses,
      totalMaintenance,
    });

    // Calculate totals safely
    const income = (totalCharging || 0) + (totalParking || 0);
    const outcome = (totalBillPayments || 0) + (totalExpenses || 0) + (totalMaintenance || 0) + (totalPayments || 0) + (totalPurchases || 0);
    const netIncome = income - outcome;

    // Prepare detailed report
    const report = {
      incomes: {
        charging: chargingRecords.map(record => ({
          id: record.id,
          amount: record.chargingCost,
          date: record.createdAt,
          type: 'Electric Car Charging',
        })),
        parking: parkingRecords.map(record => ({
          id: record.id,
          amount: record.price,
          date: record.createdAt,
          type: 'Parking',
        })),
        total: income,
      },
      outcomes: {
        billPayments: billPaymentRecords.map(record => ({
          id: record.id,
          amount: record.amount,
          date: record.createdAt,
          type: 'Bill Payment',
        })),
        expenses: expenseRecords.map(record => ({
          id: record.id,
          amount: record.amount,
          date: record.createdAt,
          type: 'Expense',
        })),
        maintenance: maintenanceRecords.map(record => ({
          id: record.id,
          amount: record.cost,
          date: record.createdAt,
          type: 'Maintenance',
        })),   
        payments: paymentRecords.map(record => ({
          id: record.id,
          amount: record.price,
          date: record.createdAt,
          type: 'Payment',
        })),
        purchases: purchaseRecords.map(record => ({
          id: record.id,
          amount: record.totalPrice,
          date: record.createdAt,
          type: 'Purchase',
        })),
        salaryPayments: salaryPaymentRecords.map(record => ({
          id: record.id,
          amount: record.amount,
          date: record.createdAt,
          type: 'Salary Payment',
        })),
        total: outcome,
      },
      netIncome,
    };

    // Return the detailed report
    res.json(report);

  } catch (error) {
    console.error(' Error in getReport:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = {
  getReport,
};