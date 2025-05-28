const  AssetAudit = require('../models/assetModel');
const Item = require('../models/item');
const AssetType  = require('../models/assetType');
const { Op } = require('sequelize');


exports.createAssetAudit = async (req, res) => {
  try {
    const { item_id, asset_type_id, date, existing_amount, damaged_amount, lost_amount, status } = req.body;

    const assetAudit = await AssetAudit.create({
      item_id,
      asset_type_id,
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
    const { item_id, asset_type_id, date, existing_amount, damaged_amount, lost_amount, status } = req.body;

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

    res.status(204).json({
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

exports.getAssetAuditsByDate = async (req, res) => {
    try {
      const { date } = req.body; 
  
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date field is required in the request body.'
        });
      }
  
      // Convert the date string to a Date object to ensure correct formatting
      const parsedDate = new Date(date);
  
      // Validate the date
      if (isNaN(parsedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please provide a valid date.'
        });
      }
  
      // Find asset audits by date
      const assetAudits = await AssetAudit.findAll({
        where: {
          date: parsedDate // Filter audits by the exact date
        },
        include: [
          { model: Item, attributes: ['id', 'itemName'] }, // Adjust field name to 'itemName'
          { model: AssetType, attributes: ['id', 'name'] }
        ]
      });
  
      // If no records are found
      if (assetAudits.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No asset audits found for the date ${date}.`
        });
      }
  
      // Return the response
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
  
 exports.getAssetAuditsByStatus = async (req, res) => {
  try {
    const { status } = req.body;
    console.log('Received status:', status);
    
    if (!status) {
        console.log('Status field is missing');
      return res.status(400).json({
        success: false,
        message: 'Status field is required in the request body.'
      });
    }

    // Validate the status
    const validStatuses = ['confirmed', 'to_be_checked', 'fail'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}.`
      });
    }

    // Find asset audits by status
    const assetAudits = await AssetAudit.findAll({
      where: {
        status: status
      },
      include: [
        { model: Item, attributes: ['id', 'itemName'] }, 
        { model: AssetType, attributes: ['id', 'name'] }
      ]
    });

    // If no records are found
    if (assetAudits.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No asset audits found with the status '${status}'.`
      });
    }

    // Return the response
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

exports.getAssetAuditsByStatusAndDateRange = async (req, res) => {
  try {
    const { status, startDate, endDate, itemId, assetTypeId } = req.body;

    const whereClause = {};

    if (status) {
      const validStatuses = ['confirmed', 'to_be_checked', 'fail'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}.`
        });
      }
      whereClause.status = status;
    }

    if (startDate || endDate) {
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;

      if ((parsedStartDate && isNaN(parsedStartDate)) || (parsedEndDate && isNaN(parsedEndDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please ensure dates are in YYYY-MM-DD format.'
        });
      }

      whereClause.date = {};
      if (parsedStartDate) whereClause.date[Op.gte] = parsedStartDate;
      if (parsedEndDate) whereClause.date[Op.lte] = parsedEndDate;
    }

    if (itemId) {
      whereClause.itemId = itemId;
    }

    if (assetTypeId) {
      whereClause.assetTypeId = assetTypeId;
    }

    const assetAudits = await AssetAudit.findAll({
      where: whereClause,
      include: [
        { model: Item, attributes: ['id', 'itemName'] },
        { model: AssetType, attributes: ['id', 'name'] }
      ]
    });

    if (assetAudits.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No asset audits found for the given criteria.`
      });
    }

    res.status(200).json({
      success: true,
      count: assetAudits.length,
      data: assetAudits
    });
  } catch (error) {
    console.error('Error occurred while fetching asset audits:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

   
  
  
