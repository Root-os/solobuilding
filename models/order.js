const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalprice:{
        type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "canceled"),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receiptImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      orderTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
  },
  {
    tableName: "orders",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = Order;