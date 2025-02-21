const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WithdrawalRequest = sequelize.define("WithdrawalRequest", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  terminationDate: { type: DataTypes.DATE, allowNull: false }, // Added
  status: { type: DataTypes.ENUM("pending", "approved", "rejected"), defaultValue: "pending" },
  adminResponse: { type: DataTypes.TEXT, allowNull: true }, // Reason for approval/rejection
  tenantFeedback: { type: DataTypes.TEXT, allowNull: true }, // Tenant response
  assignedEmployeeId: { type: DataTypes.INTEGER, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: false },// Reason for withdrawal
  },
  {
    tableName: 'withdrawal_requests',
    timestamps: true,
  });
  
module.exports = WithdrawalRequest;
