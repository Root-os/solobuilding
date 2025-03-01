const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const EmployeeDetails = sequelize.define(
    "EmployeeDetails",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        unique: true,
        references: { model: User, key: "id" }
      },
      salary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      position: { type: DataTypes.STRING, allowNull: false },
      hireDate: { type: DataTypes.DATE, allowNull: false },
      shift: { type: DataTypes.ENUM("day", "night", "flexible"), allowNull: false, defaultValue: "flexible" },
      department: { type: DataTypes.STRING, allowNull: false },
      employeementType: { type: DataTypes.ENUM("full-time", "part-time", "contract"), allowNull: false, defaultValue: "full-time" },
      emergencyContact: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      bankAccount: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: "employee_details",
      timestamps: true,
      charset: "utf8",
      collate: "utf8_general_ci",
    }
  );
  
  User.hasOne(EmployeeDetails, { foreignKey: "userId", onDelete: "CASCADE" });
EmployeeDetails.belongsTo(User, { foreignKey: "userId" });

module.exports = EmployeeDetails;