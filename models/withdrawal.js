const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WithdrawalRequest = sequelize.define("WithdrawalRequest", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    terminationDate: { type: DataTypes.DATE, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { 
        type: DataTypes.ENUM("pending",'in_progress', "approved", "rejected", "processed"),
        defaultValue: "pending"
    },
    adminResponse: { type: DataTypes.TEXT, allowNull: true }, // Admin's decision reason
    tenantFeedback: { type: DataTypes.TEXT, allowNull: true }, // Tenant's feedback after approval/rejection
    assignedEmployeeId: { type: DataTypes.INTEGER, allowNull: true }, // Employee handling the process
    depositRefundStatus: { 
        type: DataTypes.ENUM("not_processed", "partial", "full"), 
        defaultValue: "not_processed" 
    }, // Tracks security deposit refund
    processedAt: { type: DataTypes.DATE, allowNull: true }, 
    attachment: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
}, {
    tableName: 'withdrawal_requests',
    timestamps: true,
    charset: 'utf8', 
    collate: 'utf8_general_ci',
});

module.exports = WithdrawalRequest;
