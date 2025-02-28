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
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("Paid", "Pending", "Failed"),
    defaultValue: "Pending",
  },
});

module.exports = SalaryPayment;
