const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BuildingRule = sequelize.define('BuildingRule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image : {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'building_rules',
  charset: 'utf8',
  collate: 'utf8_general_ci',
});

module.exports = BuildingRule;
