const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance

const NotificationType = sequelize.define("NotificationType", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false }
  },   {
    tableName: "notification_types",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
});

module.exports = NotificationType;
