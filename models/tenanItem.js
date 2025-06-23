const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TenantItem = sequelize.define(
  "TenantItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    tenantId: {
      type: DataTypes.INTEGER,
    },
    status: {
      type:DataTypes.ENUM("Available", "Out_of_stock"),
      defaultValue: "Available",
    }
  },
  {
    tableName: "tenant_items",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = TenantItem;
