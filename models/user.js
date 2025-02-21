const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM("admin", "employee"), allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" }
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);
module.exports = User;