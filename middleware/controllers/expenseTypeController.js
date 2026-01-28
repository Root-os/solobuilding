const ExpenseType = require("../models/expenseType");

// Create an Expense Type
exports.createExpenseType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const expenseType = await ExpenseType.create({ name, description });
        return res.status(201).json(expenseType);
    } catch (error) {
        return res.status(500).json({ message: "Error creating expense type", error: error.message });
    }
};

// Get All Expense Types
exports.getAllExpenseTypes = async (req, res) => {
    try {
        const expenseTypes = await ExpenseType.findAll();
        return res.status(200).json(expenseTypes);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching expense types", error: error.message });
    }
};

// Get Single Expense Type by ID
exports.getExpenseTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const expenseType = await ExpenseType.findByPk(id);
        if (!expenseType) {
            return res.status(404).json({ message: "Expense type not found" });
        }
        return res.status(200).json(expenseType);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching expense type", error: error.message });
    }
};

// Update an Expense Type
exports.updateExpenseType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const expenseType = await ExpenseType.findByPk(id);
        if (!expenseType) {
            return res.status(404).json({ message: "Expense type not found" });
        }

        expenseType.name = name;
        expenseType.description = description;
        await expenseType.save();

        return res.status(200).json(expenseType);
    } catch (error) {
        return res.status(500).json({ message: "Error updating expense type", error: error.message });
    }
};

// Delete an Expense Type
exports.deleteExpenseType = async (req, res) => {
    try {
        const { id } = req.params;
        const expenseType = await ExpenseType.findByPk(id);
        if (!expenseType) {
            return res.status(404).json({ message: "Expense type not found" });
        }

        await expenseType.destroy();
        return res.status(200).json({ message: "Expense type deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting expense type", error: error.message });
    }
};
