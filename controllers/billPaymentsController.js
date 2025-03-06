const { Op } = require("sequelize");

const BillPayment = require("../models/billPayment");
const BillType = require("../models/billType");
const  Expense  = require('../models/expense');


exports.createBillPayment = async (req, res) => {
  try {
    const {billTypeId, amount, startDate, endDate, status, paymentMethod, description} = req.body;
    const billType = await BillType.findByPk(billTypeId);
    if (!billType) {
      return res.status(404).json({ message: "Bill type not found" });
    }
    if(!amount || !startDate || !endDate || !status || !paymentMethod || !description) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }
    if(amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }
    if(new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Start date cannot be greater than end date" });
    }
    // Create the BillPayment
    const billPayment = await BillPayment.create(req.body);


    // Create the corresponding Expense
    const expense = await Expense.create({
      amount, 
       date: new Date(),  
      description: `Bill payment for ${description}`,
      expenseTypeId: billTypeId,
    });

    return res.status(201).json({
      message: "Bill payment and corresponding expense created successfully",
      billPayment,
      expense
    });
  } catch (error) {
    return res.status(500).json({ message: "Error creating bill payment and expense", error: error.message });
  }
};

// Get Bill Payments Report (Filter by Date Range, Bill Type ID, or Both)
exports.getBillPaymentsReport = async (req, res) => {
    try {
        const { startDate, endDate, billTypeId, createdAt } = req.body;

        let whereCondition = {};

        // Filter by date range
        if (startDate && endDate) {
            whereCondition.startDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        } else if (startDate) {
            whereCondition.startDate = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            whereCondition.endDate = { [Op.lte]: new Date(endDate) };
        }

        // Filter by billTypeId if provided
        if (billTypeId) {
            whereCondition.billTypeId = billTypeId;
        }

        // Filter by createdAt date range if provided
        if (createdAt) {
            whereCondition.createdAt = { [Op.gte]: new Date(createdAt) };
        }

        // Fetch data from the database
        const billPayments = await BillPayment.findAll({
            where: whereCondition,
            include: [{ model: BillType, attributes: ["typeName"] }],
        });

        return res.status(200).json(billPayments);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching bill payments report", error: error.message });
    }
};


// ✅ Get all bill payments
exports.getAllBillPayments = async (req, res) => {
    try {
        const billPayments = await BillPayment.findAll({
            include: [{ model: BillType}] // Include Bill Type Name
        });
        res.status(200).json(billPayments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bill payments", error: error.message });
    }
};

// ✅ Get a single bill payment by ID
exports.getBillPaymentById = async (req, res) => {
    try {
        const billPayment = await BillPayment.findByPk(req.params.id, {
            include: [{ model: BillType}]
        });

        if (!billPayment) {
            return res.status(404).json({ message: "Bill payment not found" });
        }

        res.status(200).json(billPayment);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bill payment", error: error.message });
    }
};

// ✅ Update a bill payment
exports.updateBillPayment = async (req, res) => {
    try {
        const billPayment = await BillPayment.findByPk(req.params.id);

        if (!billPayment) {
            return res.status(404).json({ message: "Bill payment not found" });
        }

        await billPayment.update(req.body);
        res.status(200).json({ message: "Bill payment updated successfully", billPayment });
    } catch (error) {
        res.status(500).json({ message: "Error updating bill payment", error: error.message });
    }
};

// ✅ Delete a bill payment (Cascade will delete related data if applicable)
exports.deleteBillPayment = async (req, res) => {
    try {
        const billPayment = await BillPayment.findByPk(req.params.id);

        if (!billPayment) {
            return res.status(404).json({ message: "Bill payment not found" });
        }

        await billPayment.destroy();
        res.status(200).json({ message: "Bill payment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting bill payment", error: error.message });
    }
};

// ✅ Get bill payments by tenant ID
exports.getBillPaymentsByTenant = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const billPayments = await BillPayment.findAll({
            where: { tenantId },
            include: [{ model: BillType, attributes: ["name"] }]
        });

        if (billPayments.length === 0) {
            return res.status(404).json({ message: "No bill payments found for this tenant" });
        }

        res.status(200).json(billPayments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bill payments by tenant", error: error.message });
    }
};

// ✅ Get bill payments by status (pending, paid, overdue)
exports.getPaymentsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const billPayments = await BillPayment.findAll({
            where: { status },
            include: [{ model: BillType }]
        });

        if (billPayments.length === 0) {
            return res.status(404).json({ message: "No bill payments found with this status" });
        }

        res.status(200).json(billPayments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bill payments by status", error: error.message });
    }
};
