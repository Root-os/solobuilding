const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Item = require('./item');
const Unit = require('./unit');

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cost: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true, // Will be null if isItem is true
  },
  isItem: {
    type: DataTypes.BOOLEAN,
    allowNull: false, // Ensure this is always set when creating/updating a record
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Will be null if isItem is false
  },
 
}, {
  tableName: 'maintenances', // Table name for the model
  timestamps: true,
});

module.exports = Maintenance;
