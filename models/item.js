const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import database instance
const ItemType = require("./itemType"); // Import ItemType model

const Item = sequelize.define(
  "Item",
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
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true, // Optional field
    },
    itemAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0, // Default value is 0
    },
    itemTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ItemTypes",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "items",
    timestamps: true,
  }
);


module.exports = Item;
