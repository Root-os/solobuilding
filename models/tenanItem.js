const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const TenantInventory = require("./tenantInventory");

const TenantItem = sequelize.define(
  "TenantItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    inventoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
        model: 'tenant_inventory',
        key: 'id',
      },
      onDelete: "CASCADE",
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
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
        indexes: [
      {
        unique: true,
        fields: ["inventoryId", "itemName"], // ensures only one row per item per inventory
      },
    ],
  }
);

module.exports = TenantItem;
