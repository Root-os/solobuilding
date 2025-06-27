const express = require("express");
const {
  paySalary,
  massPaySalaries,
  getEmployeeSalaryHistory,
  updateSalaryPayment,
  deleteSalaryPayment,
  getAllSalaryPayments,
  getSalaryPaymentsByDateRange
} = require("../controllers/salaryPaymentController");
const {adminAuth,employeeAuth}= require("../middleware/auth");
const router = express.Router();

// Pay Salary (Admin Only)
router.post("/pay",adminAuth, paySalary);

//  Mass Salary Payment (Admin Only)
router.post("/mass-pay", adminAuth, massPaySalaries);

// Employee Views Salary Payment History
router.get("/my-history",employeeAuth, getEmployeeSalaryHistory);

// Admin Updates Salary Payment Record
router.put("/:id", adminAuth, updateSalaryPayment);

// Admin Deletes Salary Payment Record
router.delete("/:id", adminAuth, deleteSalaryPayment);

// Get All Salary Payments (Admin)
router.get("/all", adminAuth, getAllSalaryPayments);
router.post("/filterByDateRange", adminAuth, getSalaryPaymentsByDateRange );

module.exports = router;
