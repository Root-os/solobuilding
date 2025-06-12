const Unit = require('../models/unit');
const Floor = require('../models/floor');
const { unitSchema } = require('../helpers/schema');

// Create a new unit
exports.createUnit = async (req, res) => {
  try {
    const { error } = unitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUnit = await Unit.findOne({ where: { unitNumber: req.body.unitNumber } });
    if (existingUnit) {
      return res.status(400).json({ error: "Unit number must be unique." });
    }

    const floor = await Floor.findByPk(req.body.floorId);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found." });
    }

    // Count how many units are already registered on this floor
    const currentUnitCount = await Unit.count({ where: { floorId: req.body.floorId } });

    // Check if max number of units has been reached
    if (floor.noUnits && currentUnitCount >= parseInt(floor.noUnits)) {
      return res.status(400).json({ error: "Maximum number of units for this floor has been reached." });
    }

    const unit = await Unit.create(req.body);
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all units
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll();
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single unit by ID with floor info
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
      include: {
        model: Floor,
        attributes: ['id', 'floorNumber', 'noUnits', 'status'], // Return relevant floor info
      },
    });
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all units by floorId
exports.getUnitsByFloorId = async (req, res) => {
  try {
    const units = await Unit.findAll({
      where: { floorId: req.params.floorId },
    });

    if (units.length === 0) {
      return res.status(404).json({ message: 'No units found for this floor' });
    }

    // Calculate counts
    const availableCount = units.filter(unit => unit.status === 'available').length;
    const occupiedCount = units.filter(unit => unit.status === 'occupied').length;
    const under_maintenance = units.filter(unit => unit.status === 'under_maintenance').length;

    res.status(200).json({
      units,
      availableUnits: availableCount,
      occupiedUnits: occupiedCount,
      under_maintenance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a unit
exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    await unit.update(req.body);
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a unit
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    await unit.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFreeUnits = async (req, res) => {
  try {
    // Find all free units (available units)
    const freeUnits = await Unit.findAll({
      where: {
        status: 'available',  // Only include units with 'available' status
      },
    });

    if (!freeUnits.length) {
      return res.status(404).json({ message: 'No free units available' });
    }

    res.status(200).json(freeUnits);  // Return the list of free units
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getRentedUnits = async (req, res) => {
  try {
    // Find all rented units (occupied units)
    const rentedUnits = await Unit.findAll({
      where: {
        status: 'occupied',  
      },
    });

    if (!rentedUnits.length) {
      return res.status(404).json({ message: 'No rented units found' });
    }

    res.status(200).json(rentedUnits);  // Return the list of rented units
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Report: Get summary of units by status
exports.getUnitStatusReport = async (req, res) => {
  try {
    const units = await Unit.findAll();

    const statusCounts = {
      totalUnits: units.length,
      availableUnits: units.filter(u => u.status === 'available').length,
      occupiedUnits: units.filter(u => u.status === 'occupied').length,
      underMaintenanceUnits: units.filter(u => u.status === 'under_maintenance').length,
    };

    res.status(200).json({ unitsReport: statusCounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
