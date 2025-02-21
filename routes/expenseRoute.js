const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

// Existing CRUD routes
router.post("/", expenseController.createExpense);
router.get("/", expenseController.getAllExpenses);
router.get("/:id", expenseController.getExpenseById);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

// New route for filtering expenses
router.post("/filter", expenseController.getFilteredExpenses);

module.exports = router;
