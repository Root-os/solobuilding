const Floor = require('../models/floor');
// Get all floors

const Unit = require("../models/unit");

// Create a new floor
exports.createFloor = async (req, res) => {
  try {
    const {  floorNumber, noUnits, status } = req.body;
    const newFloor = await Floor.create({  floorNumber, noUnits, status });
    res.status(201).json(newFloor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAllFloors = async (req, res) => {
  try {
    const floors = await Floor.findAll({
      include: [
        {
          model: Unit,
          attributes: ["id", "status"],
        },
      ],
    });

    // Process data to count total, rented, and available units per floor
    const floorData = floors.map((floor) => {
      const totalUnits = floor.Units.length;
      const rentedUnits = floor.Units.filter(unit => unit.status === "occupied").length;
      const freeUnits = floor.Units.filter(unit => unit.status === "available").length;

      return {
        id: floor.id,
        name: floor.floorNumber,
        totalUnits,
        rentedUnits,
        freeUnits,
      };
    });

    res.status(200).json(floorData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get a single floor by ID
exports.getFloorById = async (req, res) => {
  try {
    // Find the floor by its ID
    const floor = await Floor.findByPk(req.params.id);

    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    // Get free units on that floor
    const freeUnits = await Unit.findAll({
      where: {
        floorId: req.params.id,  // Ensure we are filtering by the correct floor
        status: 'available',     // Filter units by available status
      },
    });

    res.status(200).json({
      freeUnits: freeUnits,  // Return the free units along with floor details
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update a floor
exports.updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const {  floorNumber, noUnits, status } = req.body;

    const floor = await Floor.findByPk(id);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    await floor.update({ floorNumber, noUnits, status });
    res.status(200).json(floor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a floor
exports.deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByPk(id);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found' });
    }

    await floor.destroy();
    res.status(204).json({ message: 'Floor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
