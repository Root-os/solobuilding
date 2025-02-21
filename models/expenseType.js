const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust the path based on your setup

const ExpenseType = sequelize.define("ExpenseType", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: "expense_types",
});

module.exports = ExpenseType;
