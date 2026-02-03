const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Gallery = sequelize.define(
  "Gallery",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isSelected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // only one image should have true
    },
  },
  
  {
    tableName: "gallery",
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);
module.exports = Gallery;
