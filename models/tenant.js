const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Unit = require('./unit');
const Floor = require('./floor');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
phoneNumber: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    is: /^[\d+\-\s()]+$/,
  },
},
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  nationalId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  leaseStartDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  leaseEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  contractEndDate: {
    type: DataTypes.DATE,
    allowNull: false, 
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  additionalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  advance: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  tin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  document: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'terminated'),
    defaultValue: 'active',
  },
  currency: {
    type: DataTypes.ENUM('USD', 'EUR', 'ETB'),
    defaultValue: 'ETB'
  },
  floorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'floors', 
      key: 'id',
    },
    allowNull: false,
  },
  unitId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'units', 
      key: 'id',
    },
    allowNull: false,
  },
  isExisting:{
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'tenants', 
  timestamps: true,
  charset: 'utf8', 
  collate: 'utf8_general_ci',
});


module.exports = Tenant;