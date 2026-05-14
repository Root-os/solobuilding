const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const PaymentSetting = require("./paymentSetting");

const PaymentResponse = sequelize.define(
  "PaymentResponse",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentRequestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PaymentSetting,
        key: "id",
      },
    },
    transactionNumber: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    receiverName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receiverAccount: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "payment_responses",
    timestamps: true,
    indexes: [
      { fields: ["paymentRequestId"] },
      { unique: true, fields: ["transactionNumber", "paymentTypeId"] }
    ],
  },
);

module.exports = PaymentResponse;
