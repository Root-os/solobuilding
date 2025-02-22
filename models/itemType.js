// models/BillPaymentType.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemType = sequelize.define('ItemType', {
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
  tableName: 'item_types',
  charset: 'utf8', 
    collate: 'utf8_general_ci',
});

module.exports = ItemType;
