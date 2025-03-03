const Maintenance = require("../models/maintenance");
const Item = require("../models/item");
const Unit = require("../models/unit");
const { maintenanceValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");

// Create a new maintenance record
exports.createMaintenance = async (req, res) => {
  try {
    const { error } = maintenanceValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.error.details[0].message });
    }

    const { date, description, cost, itemId, unitId } = req.body;
    const newMaintenance = await Maintenance.create({
      date,
      description,
      cost,
      itemId,
      unitId,
    });
    res.status(201).json(newMaintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(200).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a maintenance record
exports.updateMaintenance = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation error", error: error.details[0].message });
    }

    const { id } = req.params;

    const { error: validationError } = maintenanceValidationSchema.validate(
      req.body
    );
    
    if (validationError) {
      return res.status(400).json({ message: validationError.error.details[0].message });
    }
    const { date, description, cost, itemId, unitId } = req.body;

    const maintenance = await Maintenance.findByPk(id);
    if (!maintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    await maintenance.update({ date, description, cost, itemId, unitId });
    res.status(200).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    // const { error } = maintenanceValidationSchema.validate(req.body);
    // if (error) {
    //   return res.status(400).json({ message: error.error.details[0].message });
    // }
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

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
