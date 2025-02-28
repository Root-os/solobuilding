const { Op } = require("sequelize");
const SalaryPayment = require("../models/SalaryPayment");
const User = require("../models/user");
const { salaryPaymentSchema } = require("../helpers/schema");
const EmployeeDetails = require("../models/employeeDetail");
const sequelize = require("../config/database");

// 💵 Pay Salary
exports.paySalary = async (req, res) => {
    try {
        const { error } = salaryPaymentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { employeeId, paymentMethod, paymentDate, status } = req.body;

        if (!employeeId || !paymentMethod) {
            return res.status(400).json({ message: "Employee ID and payment method are required" });
        }

        // Ensure Employee Exists
        const user = await User.findOne({ where: { id: employeeId, role: "employee" } });
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }

        // Fetch Employee Salary
        const employeeDetails = await EmployeeDetails.findOne({ where: { userId: employeeId } });
        if (!employeeDetails || employeeDetails.salary == null) {
            return res.status(404).json({ message: "Employee salary details not found" });
        }

        // Create Salary Payment Record
        const salaryPayment = await SalaryPayment.create({
            employeeId,
            amount: employeeDetails.salary, // Use salary from EmployeeDetails
            paymentMethod,
            paymentDate: paymentDate || new Date(),
            status: status || "pending",
        });

        res.status(201).json({ message: "Salary payment recorded successfully", data: salaryPayment });
    } catch (error) {
        console.error("Error processing salary payment:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// ✅ Mass Salary Payment (Admin Only)
exports.massPaySalaries = async (req, res) => {
    try {
        const { paymentMethod, paymentDate, status } = req.body;

        if (!paymentMethod) {
            return res.status(400).json({ message: "Payment method is required" });
        }

        // Fetch all employees with role 'employee' and their salary details
        const employees = await User.findAll({
            where: { role: "employee" },
            include: [{ model: EmployeeDetails, attributes: ["salary"],required: true }],
        });

        if (employees.length === 0) {
            return res.status(404).json({ message: "No employees found for salary payment" });
        }

        // Prepare salary payment records
        const salaryPayments = [];
        const skippedPayments = [];

        for (const employee of employees) {
            if (!employee.EmployeeDetail || employee.EmployeeDetail.salary == null) {
                skippedPayments.push({
                    employeeId: employee.id,
                    reason: "Salary details missing",
                });
                continue;
            }

            salaryPayments.push({
                employeeId: employee.id,
                amount: employee.EmployeeDetail.salary,
                paymentMethod,
                paymentDate: paymentDate || new Date(),
                status: status || "pending",
            });
        }

        if (salaryPayments.length > 0) {
            await SalaryPayment.bulkCreate(salaryPayments);
        }

        res.status(201).json({
            message: "Mass salary payments processed",
            successfulPayments: salaryPayments.length,
            skippedPayments,
        });
    } catch (error) {
        console.error("Error processing mass salary payments:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 👨‍💼 Employee Views Salary Payment History
exports.getEmployeeSalaryHistory = async (req, res) => {
  try {
    const { id: employeeId, role } = req.user;

    if (role !== "employee") {
      return res.status(403).json({ message: "Only employees can access this" });
    }

    const salaryPayments = await SalaryPayment.findAll({
      where: { employeeId },
      order: [["paymentDate", "DESC"]],
    });

    if (!salaryPayments.length) {
      return res.status(404).json({ message: "No salary payments found" });
    }

    res.status(200).json({ message: "Salary history retrieved", data: salaryPayments });
  } catch (error) {
    console.error("Error retrieving salary history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📝 Admin Updates Salary Payment Record
exports.updateSalaryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, status } = req.body;

    const salaryPayment = await SalaryPayment.findByPk(id);
    if (!salaryPayment) {
      return res.status(404).json({ message: "Salary payment record not found" });
    }

    salaryPayment.paymentMethod = paymentMethod?? salaryPayment.paymentMethod;
    salaryPayment.status = status?? salaryPayment.status;

    await salaryPayment.save();

    res.status(200).json({ message: "Salary payment updated", data: salaryPayment });
  } catch (error) {
    console.error("Error updating salary payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ❌ Admin Deletes Salary Payment Record
exports.deleteSalaryPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryPayment = await SalaryPayment.findByPk(id);
    if (!salaryPayment) {
      return res.status(404).json({ message: "Salary payment record not found" });
    }

    await salaryPayment.destroy();

    res.status(200).json({ message: "Salary payment deleted" });
  } catch (error) {
    console.error("Error deleting salary payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📜 Get All Salary Payments (Admin)
exports.getAllSalaryPayments = async (req, res) => {
  try {
    const salaryPayments = await SalaryPayment.findAll({
      include: [{ model: User, attributes: ["fname", "lname", "email"] }],
      order: [["paymentDate", "DESC"]],
    });
    res.status(200).json({ message: "Salary payments retrieved", data: salaryPayments });
  } catch (error) {
    console.error("Error fetching salary payments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
