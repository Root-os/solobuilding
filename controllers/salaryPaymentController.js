const { Op } = require("sequelize");
const SalaryPayment = require("../models/SalaryPayment");
const User = require("../models/user");
const Role = require("../models/role");
const { salaryPaymentSchema } = require("../helpers/schema");
const EmployeeDetails = require("../models/employeeDetail");
const sequelize = require("../config/database");
const cron = require('node-cron');
const sendNotificationHelper = require('../helpers/sendAlert');

cron.schedule("0 8 * * *", async () => {
  try {
    const today = new Date();
    console.log(`Current Date: ${today.toISOString()}`);

    // Calculate the date 2 days from now to define the notification window
    const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    console.log("2 Days From Now:", twoDaysFromNow.toISOString());

    // Fetch all salary payments (both Pending and Paid)
    const salaryPayments = await SalaryPayment.findAll({
      include: [
        {
          model: User,
          attributes: ["fname", "lname", "email", "id"],
        },
      ],
    });

    if (salaryPayments.length === 0) {
      console.log("No salary payments found.");
      return;
    }

    // Fetch admins
    const admins = await User.findAll({ where: { roleId: 1 } });
    if (admins.length === 0) {
      console.log("No admins found to send notifications.");
      return;
    }

    // Process each payment to determine the next payment date
    for (const payment of salaryPayments) {
      const user = payment.User;
      if (!user) {
        console.log(`No user associated with payment ID: ${payment.id}`);
        continue;
      }

      // Extract the day of the month from paymentToDate
      const paymentDate = new Date(payment.paymentToDate);
      const paymentDay = paymentDate.getDate(); // e.g., 12 for 2025-05-12

      // Calculate the next payment date
      let nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
      if (nextPaymentDate < today) {
        // If the payment date for this month has passed, move to next month
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
      }

      // Reset notificationSent if we're in a new month
      const lastNotificationMonth = payment.notificationSentAt ? new Date(payment.notificationSentAt).getMonth() : null;
      if (lastNotificationMonth !== null && lastNotificationMonth !== today.getMonth()) {
        await payment.update({ notificationSent: false });
      }

      // Only notify if we haven't sent a notification this month and the date is within 2 days
      if (!payment.notificationSent && nextPaymentDate <= twoDaysFromNow && nextPaymentDate >= today) {
        const daysUntilPayment = Math.floor(
          (nextPaymentDate - today) / (1000 * 60 * 60 * 24)
        );
        const message = `Salary payment for employee ${user.fname} ${user.lname} is scheduled for ${nextPaymentDate.toISOString().split('T')[0]}, in ${daysUntilPayment} days.`;
        console.log(
          `Processing salary payment for ${user.fname} ${user.lname} (Payment Day: ${paymentDay}), next payment on ${nextPaymentDate.toISOString()}, in ${daysUntilPayment} days.`
        );

        await Promise.all(
          admins.map((admin) => {
            console.log(`Sending notification to admin: ${admin.id}`);
            return sendNotificationHelper({
              adminId: admin.id,
              title: `Upcoming Salary Payment in ${daysUntilPayment} Days`,
              body: message,
              type: "Salary Payment Reminder",
              receiver_type: "staff",
            });
          })
        );

        // Mark as notified
        await payment.update({ notificationSent: true, notificationSentAt: today });
      }
    }

    console.log("Salary payment notifications sent successfully to admins.");
  } catch (error) {
    console.error("Error during salary payment notification cron job:", error.message);
    console.error(error.stack);
  }
});

//  Pay Salary
exports.paySalary = async (req, res) => {
  try {
    const { error } = salaryPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { employeeId, paymentMethod, paymentFromDate, paymentToDate, status, allowance } = req.body;

    if (!employeeId || !paymentMethod) {
      return res.status(400).json({ message: "Employee ID and payment method are required" });
    }

    // Check if user exists and is not admin
    const user = await User.findOne({
      where: {
        id: employeeId,
      },
      include: [
        {
          model: Role,
          attributes: ['name'],
          where: {
            name: { [Op.ne]: 'admin' },
          },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Employee not found or is an admin" });
    }

    // Check salary info
    const employeeDetails = await EmployeeDetails.findOne({ where: { userId: employeeId } });
    if (!employeeDetails || employeeDetails.salary == null) {
      return res.status(404).json({ message: "Employee salary details not found" });
    }

    if (new Date(paymentFromDate) > new Date(paymentToDate)) {
      return res.status(400).json({ message: 'The payment "From Date" must be earlier than or equal to the "To Date".' });
    }

    if (allowance && isNaN(allowance)) {
      return res.status(400).json({ message: "Allowance must be a valid number" });
    }

    const validAllowance = parseFloat(allowance) || 0;

    // Check for duplicate payments
    const existingPayment = await SalaryPayment.findOne({
      where: {
        employeeId,
        paymentToDate: { [Op.gte]: paymentFromDate },
        paymentFromDate: { [Op.lte]: paymentToDate },
        status: 'Paid',
      },
    });

    if (existingPayment) {
      return res.status(409).json({ message: 'Duplicate payment detected within the specified date range.' });
    }

    // Calculate salary deductions
    const { pensionContribution, incomeTax, netSalary } =
      SalaryPayment.calculateDeductions(employeeDetails.salary, validAllowance);

    const salaryPayment = await SalaryPayment.create({
      employeeId,
      amount: employeeDetails.salary,
      paymentMethod,
      paymentFromDate,
      paymentToDate,
      status: status || "pending",
      pensionContribution,
      incomeTax,
      netSalary,
      allowance: validAllowance,
    });

    return res.status(201).json({
      message: "Salary payment recorded successfully",
      data: salaryPayment,
    });
  } catch (error) {
    console.error("Error processing salary payment:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

//  Mass Salary Payment (Admin Only)
exports.massPaySalaries = async (req, res) => {
  try {
      const { paymentMethod, paymentToDate, paymentFromDate, status, allowance } = req.body;

      if (!paymentMethod) {
          return res.status(400).json({ message: "Payment method is required" });
      }

      // Fetch all employees with role 'employee' and their salary details
      const employees = await User.findAll({
          include: [
              {
                  model: Role,
                  where: { name: "employee" }, // Only get users with the role 'employee'
                  required: true, // Ensures it filters based on this condition
              },
            
          ],
      });

      if (employees.length === 0) {
          return res.status(404).json({ message: "No employees found for salary payment" });
      }

      // Prepare salary payment records
      const salaryPayments = [];
      const skippedPayments = [];

      // Loop through each employee to calculate their salary details
      for (const employee of employees) {
          if (!employee.EmployeeDetail || employee.EmployeeDetail.salary == null) {
              skippedPayments.push({
                  employeeId: employee.id,
                  reason: "Salary details missing",
              });
              continue;
          }

          const fromDate = new Date(paymentFromDate);
          const toDate = new Date(paymentToDate);

          if (isNaN(fromDate) || isNaN(toDate)) {
              return res.status(400).json({ message: "Invalid date format" });
          }

          if (fromDate > toDate) {
              return res.status(400).json({ message: 'The payment "From Date" must be earlier than or equal to the "To Date".' });
          }

          // Ensure allowance is a valid number (if provided)
          if (allowance && isNaN(allowance)) {
              return res.status(400).json({ message: "Allowance must be a valid number" });
          }

          const validAllowance = parseFloat(allowance) || 0;

          // Check if there's already a payment for the same employee within the same date range
          const existingPayment = await SalaryPayment.findOne({
              where: {
                  employeeId: employee.id,
                  paymentToDate: { [Op.gte]: paymentFromDate },  // payments that overlap on or after the given `paymentFromDate`
                  paymentFromDate: { [Op.lte]: paymentToDate },  // payments that overlap on or before the given `paymentToDate`
                  status: 'Paid',
              },
          });

          if (existingPayment) {
              return res.status(404).json({ message: 'Duplicate payment detected within the specified date range.' });
          }

          // Calculate pension, income tax, and net salary using the salary calculation method
          const { pensionContribution, incomeTax, netSalary } = SalaryPayment.calculateDeductions(employee.EmployeeDetail.salary, validAllowance);

          // Add the calculated details to the salary payment record
          salaryPayments.push({
              employeeId: employee.id,
              amount: employee.EmployeeDetail.salary,  // Gross salary from EmployeeDetails
              paymentMethod,
              paymentFromDate: paymentFromDate,
              paymentToDate: paymentToDate,
              status: status || "pending",  // Default status to "pending"
              pensionContribution,          // Calculated pension contribution
              incomeTax,                    // Calculated income tax
              netSalary,                    // Calculated net salary after all deductions and allowance
              allowance: validAllowance,    // Transport allowance or bonuses
          });
      }

      // Bulk create salary payments
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

//  Employee Views Salary Payment History
exports.getEmployeeSalaryHistory = async (req, res) => {
  try {
    const { id: employeeId, role } = req.user;

    if (role !== "employee") {
      return res.status(403).json({ message: "Only employees can access this" });
    }

    const salaryPayments = await SalaryPayment.findAll({
      where: { employeeId },
      order: [["paymentToDate", "DESC"]],
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

//  Admin Updates Salary Payment Record
exports.updateSalaryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, status } = req.body;

    const salaryPayment = await SalaryPayment.findByPk(id);
    if (!salaryPayment) {
      return res.status(404).json({ message: "Salary payment record not found" });
    }

    salaryPayment.paymentMethod = paymentMethod|| salaryPayment.paymentMethod;
    salaryPayment.status = status||salaryPayment.status;

    await salaryPayment.save();

    res.status(200).json({ message: "Salary payment updated", data: salaryPayment });
  } catch (error) {
    console.error("Error updating salary payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//  Admin Deletes Salary Payment Record
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

//  Get All Salary Payments (Admin)
exports.getAllSalaryPayments = async (req, res) => {
  try {
    const salaryPayments = await SalaryPayment.findAll({
      include: [{ model: User, attributes: ["fname", "lname", "email"] }],
      order: [["paymentToDate", "DESC"]],
    });
    res.status(200).json({ message: "Salary payments retrieved", data: salaryPayments });
  } catch (error) {
    console.error("Error fetching salary payments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
