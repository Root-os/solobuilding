const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderType = sequelize.define('OrderType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price:{
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0.00,
    validate: {
      min: 0.00
    }
  }
}, {
  tableName: 'order_types',
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});

module.exports = OrderType;