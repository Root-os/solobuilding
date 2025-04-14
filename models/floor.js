const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Floor = sequelize.define('Floor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  floorNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  noUnits: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inActive', 'under_construction'),
    defaultValue: 'active',
  },
}, {
  tableName: 'floors',
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});

module.exports = Floor;
