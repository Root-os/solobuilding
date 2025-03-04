const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import database instance

const Letter = sequelize.define(
  "Letter",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    Date: {
      type: DataTypes.DATE,
      allowNull: true, 
    },
    status: {
      type: DataTypes.ENUM("Sent", "Recived", "Rejected"),
      defaultValue: "Sent",
    },
  },
  {
    tableName: "letters",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  }
);


module.exports = Letter;
