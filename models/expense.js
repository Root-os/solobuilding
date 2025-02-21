const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const ExpenseType = require("./expenseType");

const Expense = sequelize.define("Expense", {
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    expenseTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ExpenseType,
            key: "id",
        },
        onDelete: "CASCADE",
    },
}, {
    timestamps: true,
    tableName: "expenses",
});


module.exports = Expense;
