const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant');  // Assuming Tenant model is defined elsewhere
const PaymentType = require('./paymentType');  // Assuming BillType model is defined elsewhere

const PaymentRequest = sequelize.define('PaymentRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Tenant ID associated with the request (foreign key)
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Tenant,   // Reference to Tenant model
      key: 'id',       // The key in the Tenant model
    },
  },
  // A message or note related to the request
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // ID referencing the bill type (foreign key to BillType model)
  PaymentTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PaymentType,  // Reference to BillType model
      key: 'id',        // The key in the BillType model
    },
  },
  // The priority level of the payment request: 'low', 'medium', 'high'
  level: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'medium', // Default level can be 'medium'
    validate: {
      isIn: [['low', 'medium', 'high']],
    },
  },
  // The amount of money requested
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  // Payment due date
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  repeatedFor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Status of the request: 'pending', 'approved', 'rejected'
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']],
    },
  },
}, {
  timestamps: true,
});

module.exports = PaymentRequest;
