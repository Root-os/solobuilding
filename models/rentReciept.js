const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const TenantRentCollection = require("./tenantRentCollection");

const RentReciept = sequelize.define(
  "RentReciept",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rentCollectionId: {
      type: DataTypes.INTEGER,
      references: {
        model: TenantRentCollection,
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "cutted"),
      defaultValue: "pending",
    },
    fsNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryStatus: {
      type: DataTypes.ENUM("pending", "delivered"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "rent-reciept",
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = RentReciept;
