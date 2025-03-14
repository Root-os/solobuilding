const  AssetType  = require('../models/assetType');

exports.createAssetType = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const assetType = await AssetType.create({ name, description });
    
    res.status(201).json({
      success: true,
      data: assetType
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || error.errors?.[0]?.message
    });
  }
};

exports.getAllAssetTypes = async (req, res) => {
  try {
    const assetTypes = await AssetType.findAll();
    res.status(200).json({
      success: true,
      count: assetTypes.length,
      data: assetTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAssetType = async (req, res) => {
  try {
    const assetType = await AssetType.findByPk(req.params.id);
    if (!assetType) {
      return res.status(404).json({
        success: false,
        message: 'Asset type not found'
      });
    }
    res.status(200).json({
      success: true,
      data: assetType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateAssetType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const assetType = await AssetType.findByPk(req.params.id);
    if (!assetType) {
      return res.status(404).json({
        success: false,
        message: 'Asset type not found'
      });
    }

    // Check if new name already exists (excluding current asset type)
    if (name && name !== assetType.name) {
      const existingType = await AssetType.findOne({ where: { name } });
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Another asset type with this name already exists'
        });
      }
    }

    await assetType.update({ name, description });

    res.status(200).json({
      success: true,
      data: assetType
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || error.errors?.[0]?.message
    });
  }
};

exports.deleteAssetType = async (req, res) => {
  try {
    const assetType = await AssetType.findByPk(req.params.id);
    if (!assetType) {
      return res.status(404).json({
        success: false,
        message: 'Asset type not found'
      });
    }
    
    await assetType.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Asset type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};