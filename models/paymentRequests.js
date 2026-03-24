const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Tenant = require("./tenant");
const BillType = require("./billType");

const PaymentRequest = sequelize.define(
  "PaymentRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Tenant,
        key: "id",
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "medium",
      validate: {
        isIn: [["low", "medium", "high"]],
      },
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    billTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: BillType,
        key: "id",
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isFuture(value) {
          if (new Date(value) <= new Date()) {
            throw new Error("Due date must be in the future.");
          }
        },
      },
    },
    repeatedFor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receipt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    accessCode: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true,
    },
    linkUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidDays: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "payment_requests",
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = PaymentRequest;
