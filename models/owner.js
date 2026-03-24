const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Owner = sequelize.define("Owner",
{    
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNul: false
    },
    email:{
      type:DataTypes.STRING,
      
    }
})

module.exports = Owner;