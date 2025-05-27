const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import database instance

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
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // Default value is 0
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
   
    itemDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    itemType: {
      type: DataTypes.ENUM,
      values: ['Purchase', 'Existing'],
      allowNull: false,
    },
    min_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "items",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);


module.exports = Item;
