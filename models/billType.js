// models/BillPaymentType.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillType = sequelize.define('BillType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  typeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
 
}, {
  timestamps: true,
  tableName: 'bill_types',
});

module.exports = BillType;
