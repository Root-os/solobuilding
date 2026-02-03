const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PunishmentSetting = sequelize.define("PunishmentSetting", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    rules: {
        type: DataTypes.JSON,
        allowNull: true,
    },
       singleton: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        unique: true,
    },

}, {
    tableName: "punishment_settings",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
});

module.exports = PunishmentSetting;
