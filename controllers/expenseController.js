const Expense = require("../models/expense");
const ExpenseType = require("../models/expenseType");
const BillType = require("../models/billType");

const { Op } = require("sequelize");

// Create an Expense
exports.createExpense = async (req, res) => {
    try {
        const { amount, date, description, expenseTypeId } = req.body;

        // Validate Expense Type
        const expenseType = await ExpenseType.findByPk(expenseTypeId);
        if (!expenseType) {
            return res.status(400).json({ message: "Invalid Expense Type ID" });
        }

        const expense = await Expense.create({ amount, date, description, expenseTypeId });
        return res.status(201).json(expense);
    } catch (error) {
        return res.status(500).json({ message: "Error creating expense", error: error.message });
    }
};

// Get All Expenses
exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            include: { model: ExpenseType, as: "expenseType" ,model: BillType, as: "billType"} // Include ExpenseType details
        });
        return res.status(200).json(expenses);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching expenses", error: error.message });
    }
};

exports.getFilteredExpenses = async (req, res) => {
    try {
        const { startDate, endDate, expenseTypeId } = req.body;
        let whereClause = {};

        // Convert string dates to proper Date objects
        let start = startDate ? new Date(startDate) : null;
        let end = endDate ? new Date(endDate) : null;

        // Fix date range filtering
        if (start && end) {
            whereClause.date = { [Op.between]: [start, end] };
        } else if (start) {
            whereClause.date = { [Op.gte]: start };
        } else if (end) {
            whereClause.date = { [Op.lte]: end };
        }

        // Apply expenseTypeId filter if provided
        if (expenseTypeId) {
            whereClause.expenseTypeId = expenseTypeId;
        }

        // Fetch filtered expenses
        const expenses = await Expense.findAll({ where: whereClause });

        return res.status(200).json(expenses);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching expenses", error: error.message });
    }
};

// Get Single Expense by ID
exports.getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findByPk(id, {
            include: { model: ExpenseType, as: "expenseType" }
        });
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        return res.status(200).json(expense);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching expense", error: error.message });
    }
};

// Update an Expense
exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, date, description, expenseTypeId } = req.body;

        // Validate Expense Type
        const expenseType = await ExpenseType.findByPk(expenseTypeId);
        if (!expenseType) {
            return res.status(400).json({ message: "Invalid Expense Type ID" });
        }

        const expense = await Expense.findByPk(id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        expense.amount = amount;
        expense.date = date;
        expense.description = description;
        expense.expenseTypeId = expenseTypeId;
        await expense.save();

        return res.status(200).json(expense);
    } catch (error) {
        return res.status(500).json({ message: "Error updating expense", error: error.message });
    }
};

// Delete an Expense
exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await Expense.findByPk(id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        await expense.destroy();
        return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting expense", error: error.message });
    }
};
