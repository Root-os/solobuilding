const express = require("express");
const router = express.Router();
const expenseTypeController = require("../controllers/expenseTypeController");

router.post("/", expenseTypeController.createExpenseType); // Create
router.get("/", expenseTypeController.getAllExpenseTypes); // Read All
router.get("/:id", expenseTypeController.getExpenseTypeById); // Read One
router.put("/:id", expenseTypeController.updateExpenseType); // Update
router.delete("/:id", expenseTypeController.deleteExpenseType); // Delete

module.exports = router;
