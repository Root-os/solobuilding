const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Tenant = require("./tenant");

const TenantInventory = sequelize.define(
  "TenantInventory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Tenant,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("move-in", "move-out"),
      allowNull: false,
    },
    checkedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tenant_inventory",
    timestamps: false,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = TenantInventory;
