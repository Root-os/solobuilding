const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Tenant = require('./tenant');

const Punishment = sequelize.define('Punishment', {
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
        key: "id",
    },
    onDelete: "CASCADE",
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  negotiatedAmount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status:{
    type: DataTypes.ENUM('paid', 'unpaid', 'cleared', 'negotiated'),
    allowNull:false,
    defaultValue: 'unpaid'
  },
}, {
  timestamps: true,
});

module.exports = Punishment;