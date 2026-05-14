const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Tenant = require("./tenant");
const PaymentSetting = require("./paymentSetting");

const TenantRentCollection = sequelize.define(
  "TenantRentCollection",
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
      onDelete: "CASCADE",
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paidDays: {
      type: DataTypes.STRING,
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
    amountPaid: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    extraAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    nextDueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Paid", "Pending", "Overdue"),
      defaultValue: "Pending",
      allowNull: false,
    },
    punishment: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    proofOfPayment: { type: DataTypes.STRING },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "tenant_rent_collections",
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = TenantRentCollection;
