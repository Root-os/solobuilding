const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 
const Item = require("./item"); 
const ItemType = require("./itemCategory"); 

const Purchase = sequelize.define(
  "Purchase",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
   
    vendourName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vendourPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "purchases",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = Purchase;
