const { DataTypes } = require('sequelize');
const sequelize = require("../config/database"); 
const Item = require('./item'); 
const AssetType = require('./assetType'); 

const AssetAudit = sequelize.define('AssetAudit', {
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'items', // points to the 'items' table
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    asset_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'asset_types', // points to the 'asset_types' table
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    existing_amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    damaged_amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lost_amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },{
    timestamps: true,
    tableName: 'asset_audits'
  });
  

// Associations
AssetAudit.belongsTo(Item, { foreignKey: 'item_id' });
AssetAudit.belongsTo(AssetType, { foreignKey: 'asset_type_id' });

module.exports = AssetAudit;
