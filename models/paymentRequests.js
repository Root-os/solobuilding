const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant');
const PaymentType = require('./paymentType');

const PaymentRequest = sequelize.define('PaymentRequest', {
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
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  level: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high']],
    },
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0.01, // Prevent negative payments
    },
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter: new Date().toISOString(), // Ensure due date is in the future
    },
  },
  repeatedFor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  receipt: {
    type: DataTypes.STRING, // Store file path for payment proof
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
  tableName: 'payment_requests',
  charset: 'utf8',
  collate: 'utf8_general_ci',
});

module.exports = PaymentRequest;
