const Maintenance = require("../models/maintenance");
const Item = require("../models/item");
const Unit = require("../models/unit");
const { maintenanceValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");
const { Op } = require("sequelize");

// Create a new maintenance record
exports.createMaintenance = async (req, res) => {
  try {
    // Validate the request body using the updated schema
    const { error } = maintenanceValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { date, description, cost, isItem, itemId, unitId, name } = req.body;

    // Create the maintenance record
    const newMaintenance = await Maintenance.create({
      date,
      description,
      cost,
      isItem,
      itemId: isItem ? itemId : null,  // If it's not an item, itemId will be null
      unitId,
      name: isItem ? null : name,  // If it's an item, name will be null
    });

    return res.status(201).json(newMaintenance);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all maintenance records
exports.getAllMaintenances = async (req, res) => {
  try {
    const maintenances = await Maintenance.findAll({
      include: [
        {
          model: Item,
          as: "maintenanceItem",
          attributes: ["id", "itemName"],
        },
        {
          model: Unit,
          as: "maintenanceUnit",
          attributes: ["id", "unitNumber"],
        },
      ],
    });
    res.status(200).json(maintenances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single maintenance record by ID
exports.getMaintenanceById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    }

    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [
        {
          model: Item,
          as: "maintenanceItem",
          attributes: ["id", "itemName"],
        },
        {
          model: Unit,
          as: "maintenanceUnit",
          attributes: ["id", "unitNumber"],
        },
      ],
    });

    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    // Return the maintenance record with isItem and name
    res.status(200).json({
      ...maintenance.get(),
      isItem: maintenance.isItem,
      name: maintenance.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a maintenance record
exports.updateMaintenance = async (req, res) => {
  try {
    // Validate the maintenance ID parameter
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: "Validation error", error: error.details[0].message });
    }

    const { id } = req.params;

    // Validate the request body using the updated schema
    const { error: validationError } = maintenanceValidationSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError.details[0].message });
    }

    const { date, description, cost, isItem, itemId, unitId, name } = req.body;

    // Find the existing maintenance record
    const maintenance = await Maintenance.findByPk(id);
    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    // If isItem is true, validate that the itemId exists
    if (isItem && itemId) {
      const itemExists = await Item.findByPk(itemId);
      if (!itemExists) {
        return res.status(400).json({ message: `Item with ID ${itemId} does not exist` });
      }
    }

    // Ensure name is provided or forbidden based on isItem
    if (isItem && name) {
      return res.status(400).json({ message: "Name should not be provided when isItem is true" });
    }

    if (!isItem && !name) {
      return res.status(400).json({ message: "Name is required when isItem is false" });
    }

    // Update the maintenance record with the new values
    await maintenance.update({
      date,
      description,
      cost,
      isItem,
      itemId: isItem ? itemId : null,  // If it's not an item, itemId will be null
      unitId,
      name: isItem ? null : name,  // If it's an item, name will be null
    });

    // Return the updated maintenance record
    return res.status(200).json(maintenance);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
 
// Delete a maintenance record
exports.deleteMaintenance = async (req, res) => {
  try {

    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    }
    const { id } = req.params;

    const maintenance = await Maintenance.findByPk(id);
    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    await maintenance.destroy();
    res
      .status(200)
      .json({ message: "Maintenance record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaintenanceReport = async (req, res) => {
  try {
    const { startDate, itemId, unitId } = req.body;

    const report = await Maintenance.findAll({
      where: {
        ...(startDate && { date: { [Op.gte]: startDate } }),
        ...(itemId && { itemId }),
        ...(unitId && { unitId }),
      },
      include: [
        {
          model: Item,
          as: "maintenanceItem",
          attributes: ["id", "itemName"],
        },
        {
          model: Unit,
          as: "maintenanceUnit",
          attributes: ["id", "unitNumber"],
        },
      ],
    });

    res.status(200).json(report || []); // Always return an array
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
