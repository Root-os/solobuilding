const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PaymentType = sequelize.define(
  "PaymentType",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true }, // Added description
  },
  {
    tableName: "payment_types",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = PaymentType;
