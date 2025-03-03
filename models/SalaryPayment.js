const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const SalaryPayment = sequelize.define("SalaryPayment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },//gross salary
  paymentFromDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue:DataTypes.NOW,
  },
  paymentToDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue:DataTypes.NOW,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("Paid", "Pending", "Failed"),
    defaultValue: "Pending",
  },
  pensionContribution: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  incomeTax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  netSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  allowance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,  // This will store the transport allowance and bonuses
    defaultValue: 0,
  },
},{
  tableName: 'employee_salaries',
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});


// Method to calculate deductions and net salary based on the Ethiopian guidelines
SalaryPayment.calculateDeductions = function(grossSalary, allowance) {
  // Pension Contribution: 7% of the gross salary
  const pensionContribution = grossSalary * 0.07;

  // Determine the applicable tax bracket and calculate income tax
  let incomeTax = 0;

  // Progressive tax brackets for Ethiopia
  if (grossSalary <= 600) {
    incomeTax = 0;  // No tax for income up to 600
  } else if (grossSalary <= 1650) {
    incomeTax = grossSalary * 0.10 - 60;  // 10% tax for income between 601 - 1650
  } else if (grossSalary <= 3200) {
    incomeTax = grossSalary * 0.15 - 142.53;  // 15% tax for income between 1651 - 3200
  } else if (grossSalary <= 5250) {
    incomeTax = grossSalary * 0.20 - 302.55;  // 20% tax for income between 3201 - 5250
  } else if (grossSalary <= 7800) {
    incomeTax = grossSalary * 0.25 - 565;  // 25% tax for income between 5251 - 7800
  } else if (grossSalary <= 10900) {
    incomeTax = grossSalary * 0.30 - 955;  // 30% tax for income between 7801 - 10900
  } else {
    incomeTax = grossSalary * 0.35 - 1500;  // 35% tax for income above 10900
  }

  // Add allowances to the net salary calculation
  let salary = (grossSalary) - (pensionContribution + incomeTax);
const netSalary=salary+allowance;
  // Return an object with calculated values
  return {
    pensionContribution,
    incomeTax,
    netSalary,
    allowance,
  };
};

module.exports = SalaryPayment;
