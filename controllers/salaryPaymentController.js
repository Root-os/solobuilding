const SalaryPayment = require("../models/SalaryPayment");
const User = require("../models/user");

// ✅ Admin Pays Salary to Employee
exports.paySalary = async (req, res) => {
  try {
    const { userId, amount, paymentMethod } = req.body;

    if (!userId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure Employee Exists
    const user = await User.findOne({ where: { id: userId, role: "employee" } });
    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Create Salary Payment Record
    const salaryPayment = await SalaryPayment.create({
      userId,
      amount,
      paymentMethod,
      status: "Paid",
    });

    res.status(201).json({ message: "Salary paid successfully", data: salaryPayment });
  } catch (error) {
    console.error("Error processing salary payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 👨‍💼 Employee Views Salary Payment History
exports.getEmployeeSalaryHistory = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    if (role !== "employee") {
      return res.status(403).json({ message: "Only employees can access this" });
    }

    const salaryPayments = await SalaryPayment.findAll({
      where: { userId },
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
    const { amount, paymentMethod, status } = req.body;

    const salaryPayment = await SalaryPayment.findByPk(id);
    if (!salaryPayment) {
      return res.status(404).json({ message: "Salary payment record not found" });
    }

    // Update salary payment details
    salaryPayment.amount = amount || salaryPayment.amount;
    salaryPayment.paymentMethod = paymentMethod || salaryPayment.paymentMethod;
    salaryPayment.status = status || salaryPayment.status;

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
