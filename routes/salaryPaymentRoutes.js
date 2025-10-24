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
const {adminAuth,employeeAuth, adminOrEmployeeAuth}= require("../middleware/auth");
const router = express.Router();

// Pay Salary (Admin Only)
router.post("/pay",adminOrEmployeeAuth, paySalary);

//  Mass Salary Payment (Admin Only)
router.post("/mass-pay", adminOrEmployeeAuth, massPaySalaries);

// Employee Views Salary Payment History
router.get("/my-history",employeeAuth, getEmployeeSalaryHistory);

// Admin Updates Salary Payment Record
router.put("/:id", adminOrEmployeeAuth, updateSalaryPayment);

// Admin Deletes Salary Payment Record
router.delete("/:id", adminOrEmployeeAuth, deleteSalaryPayment);

// Get All Salary Payments (Admin)
router.get("/all", adminOrEmployeeAuth, getAllSalaryPayments);
router.post("/filterByDateRange", adminOrEmployeeAuth, getSalaryPaymentsByDateRange );

module.exports = router;
