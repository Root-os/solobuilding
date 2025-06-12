const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PurchaseRequest = sequelize.define(
  "PurchaseRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false, 
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
     approvedAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    requestDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER, 
      allowNull: true,
    },
   vendorId:{
      type: DataTypes.INTEGER,
      allowNull: true,
   },
  },
  {
    tableName: "purchase_requests",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = PurchaseRequest;
