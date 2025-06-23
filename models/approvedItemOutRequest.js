const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ApprovedOutRequest = sequelize.define(
  "ApprovedOutRequest", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tenantId: {
    type: DataTypes.INTEGER
  },
  tenantItemId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM( "Approved", "Rejected"),
    allowNull: false,
    defaultValue: "Approved",
  },
}, 
{
tableName: "approved_out_request",
timestamps: true,
charset: "utf8",
collate: "utf8_general_ci",
});

module.exports = ApprovedOutRequest;
