const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Floor = require('./floor');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  unitNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'under_maintenance'),
    defaultValue: 'available',
  },
  availableEquipments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  problems: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  rentedDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  vacatedDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  floorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'floors', // Explicit table name
      key: 'id',
    },
    allowNull: false,
  },
}, {
  tableName: 'units', // Explicit table name
  timestamps: true,
  charset: 'utf8', 
  collate: 'utf8_general_ci',
});

module.exports = Unit;