const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // adjust your DB config

const PaymentResponse = sequelize.define('PaymentResponse', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  paymentRequestId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
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
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'payment_responses',
  timestamps: true,
  indexes: [
    { fields: ['paymentRequestId'] },
    { unique: true, fields: ['transactionNumber', 'paymentMethod'] } // prevents duplicate processing
  ],
});

module.exports = PaymentResponse;
