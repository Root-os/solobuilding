
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PaymentType = sequelize.define("PaymentType", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  });

module.exports = PaymentType;