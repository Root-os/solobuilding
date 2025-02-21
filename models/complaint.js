const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Complaint = sequelize.define("Complaint", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  assignedEmployeeId: { type: DataTypes.INTEGER, allowNull: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    urgency: { type: DataTypes.ENUM("low", "medium", "high"), defaultValue: "medium" },
    status: { type: DataTypes.ENUM("pending", "in_progress", "resolved"), defaultValue: "pending" },
    images: { type: DataTypes.JSON } ,
    tenantFeedback: { type: DataTypes.ENUM("satisfied", "not_satisfied"), allowNull: true }},
    {
    tableName: 'complaints',
    timestamps: true,
  });

module.exports = Complaint;