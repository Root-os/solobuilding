const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Item = require('./item');

const Stockout = sequelize.define('Stockout', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    itemId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Item,
            key: 'id'
        }
    },
    source:{ 
        type: DataTypes.ENUM("store", "warehouse", "supplier"), 
        allowNull: false 
    },
    reason: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    requestedBy: {
        type: DataTypes.INTEGER, 
        allowNull: false
    },
    requestedQuantity: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    approvedQuantity: { 
        type: DataTypes.INTEGER, 
        allowNull: true 
    },
    approvedBy: {
        type: DataTypes.INTEGER, 
        allowNull: true 
    },
    approvalReason: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    approvedAt: {
        type: DataTypes.DATE, 
        allowNull: true 
    },
    status: { 
        type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
        allowNull: false,
        defaultValue: 'pending'
    }
}, { timestamps: true });

module.exports = Stockout;
