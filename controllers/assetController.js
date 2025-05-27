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
    const { status, startDate, endDate } = req.body;

    // Log incoming request data
    // console.log('Received parameters:', { status, startDate, endDate });

    // Validate input
    if (!status || !startDate || !endDate) {
      console.log('Missing parameters in request body');
      return res.status(400).json({
        success: false,
        message: 'Status, startDate, and endDate are required fields in the request body.'
      });
    }

    const validStatuses = ['confirmed', 'to_be_checked', 'fail'];
    if (!validStatuses.includes(status)) {
      console.log('Invalid status received:', status);
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}.`
      });
    }

    // Parse dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
      console.log('Invalid date format');
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please ensure startDate and endDate are in YYYY-MM-DD format.'
      });
    }

    // Log the query filter values
    console.log('Filtering by status:', status);
    console.log('Date range:', { startDate: parsedStartDate, endDate: parsedEndDate });

    // Query the database for asset audits by status and date range
    const assetAudits = await AssetAudit.findAll({
      where: {
        status: status,
        date: {
          [Op.gte]: parsedStartDate,  // greater than or equal to startDate
          [Op.lte]: parsedEndDate     // less than or equal to endDate
        }
      },
      include: [
        { model: Item, attributes: ['id', 'itemName'] },
        { model: AssetType, attributes: ['id', 'name'] }
      ]
    });

    // Log the result of the query
    console.log('Asset audits retrieved:', assetAudits);

    if (assetAudits.length === 0) {
      console.log('No asset audits found for the given criteria');
      return res.status(404).json({
        success: false,
        message: `No asset audits found for the status '${status}' within the given date range.`
      });
    }

    // Respond with the results
    res.status(200).json({
      success: true,
      count: assetAudits.length,
      data: assetAudits
    });
  } catch (error) {
    // Log any error that occurs during the process
    console.error('Error occurred while fetching asset audits:', error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
   
  
  
