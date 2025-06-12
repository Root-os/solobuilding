const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LetterResponse = sequelize.define("LetterResponse", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tenantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  letterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("Pending", "Accepted", "Rejected"),
    defaultValue: "Pending",
  },
}, {
  tableName: "letter_responses",
  timestamps: true,
  charset: "utf8",
  collate: "utf8_general_ci",
});

module.exports = LetterResponse;
