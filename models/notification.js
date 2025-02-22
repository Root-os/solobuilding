const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const NotificationType = require("./notificationType");
const Tenant = require("./tenant");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: NotificationType,
        key: "id",
      },
    },
    receiver_type: { 
      type: DataTypes.ENUM("tenant", "staff"), 
      allowNull: false 
    }, 
    receiver_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "notifications",
    timestamps: true,
  }
);

module.exports = Notification;