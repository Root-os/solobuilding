const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
 unitId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'units',
      key: 'id',
    },
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
        is: /^(\+?[0-9]{1,15}|0[0-9]{9,14})$/  
    },
    },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
    startDate: {
    type: DataTypes.DATE,
    allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
}, {
  tableName: 'booking',
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});

module.exports = Booking;
