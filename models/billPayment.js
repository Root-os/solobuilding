const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance
const BillType = require("./billType"); // Import BillType model

const BillPayment = sequelize.define("BillPayment", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    billTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: BillType,
            key: "id"
        },
        onDelete: "CASCADE", 
        onUpdate: "CASCADE"
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("pending", "paid", "overdue"),
        defaultValue: "pending"
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: "bill_payments",
    charset: 'utf8', 
    collate: 'utf8_general_ci',
});

module.exports = BillPayment;
