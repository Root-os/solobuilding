const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Email = sequelize.define("Email", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: { type: DataTypes.INTEGER, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM("sent", "read"), defaultValue: "sent" }
  },
  {
    tableName: "emails",
    timestamps: true,
    paranoid: true,
    charset: 'utf8', 
    collate: 'utf8_general_ci',
  });

module.exports = Email;