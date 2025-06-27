const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Vendor = require('./Vendor'); 
const Purchase = require('./purchase'); 

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Vendor,
      key: 'id',
    },
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'credit', 'bank transfer', 'other'),
    allowNull: false,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('complete', 'partial', 'pending'),
    allowNull: false,
    defaultValue: 'pending',
  },
  leftMoney: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  item: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  purchaseId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: Purchase, 
      key: 'id',
    },
  },
}, {
  tableName: 'payments',
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});

// Payment.sync({ alter: true })
//   .then(() => {
//     console.log('Payment table synced (altered if needed).');
//   })
//   .catch((err) => {
//     console.error('Error syncing Payment model:', err);
//   });

module.exports = Payment;