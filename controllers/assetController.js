const  AssetAudit = require('../models/assetModel');
const Item = require('../models/item');
const AssetType  = require('../models/assetType');

exports.createAssetAudit = async (req, res) => {
  try {
    const { item_id, asset_type_id, asset_name, date, existing_amount, damaged_amount, lost_amount, status } = req.body;

    const assetAudit = await AssetAudit.create({
      item_id,
      asset_type_id,
      asset_name,
      date,
      existing_amount,
      damaged_amount,
      lost_amount,
      status
    });

    res.status(201).json({
      success: true,
      data: assetAudit
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || error.errors?.[0]?.message
    });
  }
};

exports.getAllAssetAudits = async (req, res) => {
    try {
      const assetAudits = await AssetAudit.findAll({
        include: [
          { model: Item, attributes: ['id', 'itemName'] },  
          { model: AssetType, attributes: ['id', 'name'] }
        ]
      });
      res.status(200).json({
        success: true,
        count: assetAudits.length,
        data: assetAudits
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  

exports.getAssetAudit = async (req, res) => {
  try {
    const assetAudit = await AssetAudit.findByPk(req.params.id, {
      include: [
        { model: Item, attributes: ['id', 'name'] },
        { model: AssetType, attributes: ['id', 'name'] }
      ]
    });

    if (!assetAudit) {
      return res.status(404).json({
        success: false,
        message: 'Asset Audit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assetAudit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAssetAudit = async (req, res) => {
  try {
    const { item_id, asset_type_id, asset_name, date, existing_amount, damaged_amount, lost_amount, status } = req.body;

    const assetAudit = await AssetAudit.findByPk(req.params.id);
    if (!assetAudit) {
      return res.status(404).json({
        success: false,
        message: 'Asset Audit not found'
      });
    }

    await assetAudit.update({
      item_id,
      asset_type_id,
      asset_name,
      date,
      existing_amount,
      damaged_amount,
      lost_amount,
      status
    });

    res.status(200).json({
      success: true,
      data: assetAudit
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || error.errors?.[0]?.message
    });
  }
};

exports.deleteAssetAudit = async (req, res) => {
  try {
    const assetAudit = await AssetAudit.findByPk(req.params.id);
    if (!assetAudit) {
      return res.status(404).json({
        success: false,
        message: 'Asset Audit not found'
      });
    }

    await assetAudit.destroy();

    res.status(200).json({
      success: true,
      message: 'Asset Audit deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
