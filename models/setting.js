const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Setting = sequelize.define("Setting", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    buildingName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    buildingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    chargingCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    parkingCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    logos: {
        type: DataTypes.STRING, 
        allowNull: true,
    },
    seal: { 
        type: DataTypes.STRING,
        allowNull: true,
    },
    postOfficeAddress: {  // New field for PO Box address
        type: DataTypes.STRING,
        allowNull: true,
    },
      qrImage: {  
        type: DataTypes.STRING,
        allowNull: true, 
    },
    punishmentPercentage: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    isGregorian: {            
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    applyPunishment: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: "settings",
    timestamps: true,
    charset: 'utf8', 
    collate: 'utf8_general_ci',
});

module.exports = Setting;