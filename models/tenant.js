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
    unique:true,
    validate: {
      is: /^[0-9]{10}$/,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  nationalId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique:true,
  },
  leaseStartDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  leaseEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentStatus: {
    type: DataTypes.ENUM('paid', 'due', 'overdue'),
    defaultValue: 'due',
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
    allowNull: false,
    unique:true,
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
  floorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'floors', // Explicit table name
      key: 'id',
    },
    allowNull: false,
  },
  unitId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'units', // Explicit table name
      key: 'id',
    },
    allowNull: false,
  },
}, {
  tableName: 'tenants', // Explicit table name
  timestamps: true,
  charset: 'utf8', 
  collate: 'utf8_general_ci',
});


module.exports = Tenant;