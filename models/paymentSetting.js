const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PaymentSetting = sequelize.define("PaymentSetting", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    receiverName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    receiverAccountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = PaymentSetting;
