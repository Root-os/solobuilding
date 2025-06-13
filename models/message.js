const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    phoneNumber: { type: DataTypes.STRING(13), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    apiLogId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "sent", "delivered", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
    referenceType: {
      type: DataTypes.ENUM("Tenant", "User", "System"),
      allowNull: false,
    },
    referenceId: { type: DataTypes.INTEGER, allowNull: true },
    type: {
      type: DataTypes.ENUM("single", "bulk", "otp"),
      allowNull: false,
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "messages",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
    indexes: [
      { fields: ["phoneNumber", "apiLogId"], unique: true },
      { fields: ["referenceType", "referenceId"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = Message;
