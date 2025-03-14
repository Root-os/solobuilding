const { DataTypes } = require('sequelize');
const sequelize = require("../config/database"); // Import your Sequelize instance

const AssetType = sequelize.define("AssetType", {

    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Asset type with this name already exists'
      },
      validate: {
        notNull: { msg: 'Name is required' },
        len: {
          args: [2, 50],
          msg: 'Name must be between 2 and 50 characters'
        }
      }
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      validate: {
        len: {
          args: [0, 200],
          msg: 'Description cannot exceed 200 characters'
        }
      }
    }
  }, {
    timestamps: true,
    tableName: 'asset_types'
  });

  module.exports = AssetType;