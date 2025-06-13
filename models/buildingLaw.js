const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BuildingRule = sequelize.define(
  "BuildingRule",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "building_rules",
    charset: "utf8",
    collate: "utf8_general_ci",
    indexes: [
      {
        unique: true,
        fields: [{ name: "description", length: 1000 }],
      },
    ],
  }
);

module.exports = BuildingRule;
