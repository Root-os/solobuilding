const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Import your Sequelize instance
const Tenant = require("./tenant"); // Import Tenant model

const Parking = sequelize.define("Parking", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    parkingSpaceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
    },
    carPlate: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    carName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    driverName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    driverPhone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Tenant,
            key: "id"
        },
    },
    timeIn: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notNull: { msg: 'Time in is required' },
            notEmpty: { msg: 'Time in cannot be empty' }
        }
    },
    timeOut: {
        type: DataTypes.DATE,
        allowNull: true
    },
    price: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isTenant: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("completed", "onparking", "ready to out"),
        defaultValue: "onparking",
        allowNull: false
    }
}, {
    tableName: "parkings"
});


module.exports = Parking;
