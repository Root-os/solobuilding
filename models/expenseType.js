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
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

module.exports = ExpenseType;
