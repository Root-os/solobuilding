const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 
const Item = require("./item");
const User = require("./user");
const Unit = require("./unit");

const ItemAssignment = sequelize.define(
  "ItemAssignment",
  {
   
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    assignType: {
      type: DataTypes.ENUM("Unit", "User"),
      allowNull: false,
    },
    assignDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "itemAssignments",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);

module.exports = ItemAssignment;
