const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Otp = sequelize.define(
  "Otp",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    phone: { type: DataTypes.STRING(13), allowNull: false },
    hashedSecret: { type: DataTypes.STRING(64), allowNull: false },
    expiresAt: { type: DataTypes.BIGINT, allowNull: false },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "verified", "expired", "locked"),
      defaultValue: "pending",
      allowNull: false,
    },
    referenceType: { type: DataTypes.ENUM("Tenant", "User"), allowNull: false },
    referenceId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "otps",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
    indexes: [
      { fields: ["phone"] },
      { fields: ["expiresAt"] },
      { fields: ["referenceType", "referenceId"] },
    ],
  }
);

module.exports = Otp;
