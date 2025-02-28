const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant');

const TenantPayment = sequelize.define('TenantPayment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Tenant,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  amountPaid: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('paid', 'due', 'overdue'),
    defaultValue: 'due',
  },
  proofOfPayment: { type: DataTypes.STRING },
}, {
  timestamps: true,
  tableName: 'tenant_payments',
  charset: 'utf8', 
  collate: 'utf8_general_ci',
});

module.exports = TenantPayment;
