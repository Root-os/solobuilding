const TenantVehicle = require('../models/tenantVehicle');
const { Op } = require("sequelize");
const  Tenant  = require('../models/tenant');
// Create a new vehicle for a tenant
exports.createVehicle = async (req, res) => {
  try {
    const { tenantId, carPlate, carName } = req.body;

    // Validate required fields
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }
if (!carPlate) {
      return res.status(400).json({ success: false, message: 'Car plate is required' });
    }
    if(!carName) {
      return res.status(400).json({ success: false, message: 'Car name is required' });
    }
    // if (!color) {
    //   return res.status(400).json({ success: false, message: 'Color of the car is required' });
    // }
    // Create the vehicle
    const vehicle = await TenantVehicle.create({
      tenantId,
      carPlate,
      carName,
      // color,
    });

    res.status(201).json({ success: true, message: 'Vehicle created successfully', vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create vehicle', error: error.message });
  }
};

// Get all vehicles for a tenant
exports.getAllVehiclesOfTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Validate tenantId
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    // Fetch all vehicles for the tenant
    const vehicles = await TenantVehicle.findAll({ where: { tenantId } });

    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles', error: error.message });
  }
};

// Get a specific vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate vehicle ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    // Fetch the vehicle
    const vehicle = await TenantVehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle', error: error.message });
  }
};

// Update a vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { carPlate, carName, color } = req.body;

    // Validate vehicle ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    // Find the vehicle
    const vehicle = await TenantVehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Update the vehicle
    vehicle.carPlate = carPlate || vehicle.carPlate;
    vehicle.carName = carName || vehicle.carName;
    vehicle.color = color || vehicle.color;

    await vehicle.save();

    res.status(200).json({ success: true, message: 'Vehicle updated successfully', vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update vehicle', error: error.message });
  }
};

// Delete a vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate vehicle ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'Vehicle ID is required' });
    }

    // Find the vehicle
    const vehicle = await TenantVehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Delete the vehicle
    await vehicle.destroy();

    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete vehicle', error: error.message });
  }
};

exports.getVehicleByPlate = async (req, res) => {
  try {
    const { carPlate } = req.params;

    // Validate carPlate
    if (!carPlate) {
      return res.status(400).json({ success: false, message: 'Car plate is required' });
    }

    // Fetch the vehicle
    const vehicle = await TenantVehicle.findOne({ where: { carPlate } });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle', error: error.message });
  }
};

exports.getAllVehicles= async (req, res) => {
  try {
    // Fetch all vehicles
    const vehicles = await TenantVehicle.findAll();

    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles', error: error.message });
  }
};

exports.getVehiclesWithFilter = async (req, res) => {
  try {
    const { tenantId, startDate, endDate, color, carPlate } = req.query;

    // Build filter conditions dynamically
    let whereClause = {};

    if (tenantId) whereClause.tenantId = tenantId;
    if (color) whereClause.color = color;
    if (carPlate) whereClause.carPlate = carPlate;

    // Date range filtering
    if (startDate && endDate) {
      whereClause.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.createdAt = { [Op.lte]: new Date(endDate) };
    }

    // Fetch vehicles with tenant details
    const vehicles = await TenantVehicle.findAll({
      where: whereClause,
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName", "email", "phoneNumber","nationalId"],
        },
      ],
    });

    res.status(200).json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch vehicles", error: error.message });
  }
};
