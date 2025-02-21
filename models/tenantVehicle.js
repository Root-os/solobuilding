const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TenantVehicle = sequelize.define("TenantVehicle", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    carPlate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      carName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      color: { type: DataTypes.STRING, allowNull: true }
  });
module.exports = TenantVehicle;