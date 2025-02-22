const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Import your Sequelize instance
const Tenant = require("./tenant"); // Import Tenant model

const ElectricCarCharging = sequelize.define('ElectricCarCharging', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    carPlate: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    carName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isTenant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Tenant,
            key: "id"
        },
    },
    driverName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    driverPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    chargingStartTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    chargingEndTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    chargingCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('charging', 'completed', 'pending'),
        defaultValue: 'charging',
        allowNull: false,
    },
}, {
    tableName: 'electric_car_chargings',
    timestamps: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

module.exports = ElectricCarCharging;
