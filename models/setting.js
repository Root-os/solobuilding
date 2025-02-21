const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Setting = sequelize.define("Setting", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: "settings",
    timestamps: false
});

module.exports = Setting;
