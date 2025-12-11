const Unit = require("../models/unit");
const Floor = require("../models/floor");
const { unitSchema } = require("../helpers/schema");
const { BASE_URL } = require("../config/config");

// Create a new unit
exports.createUnit = async (req, res) => {
  try {
    // Parse availableEquipments if it's a string (because form-data sends arrays as strings)
    if (
      req.body.availableEquipments &&
      typeof req.body.availableEquipments === "string"
    ) {
      try {
        req.body.availableEquipments = JSON.parse(req.body.availableEquipments);
      } catch (err) {
        return res
          .status(400)
          .json({ error: '"availableEquipments" must be a valid JSON array' });
      }
    }

    // Similarly parse problems field if it exists and is string
    if (req.body.problems && typeof req.body.problems === "string") {
      try {
        req.body.problems = JSON.parse(req.body.problems);
      } catch (err) {
        return res
          .status(400)
          .json({ error: '"problems" must be a valid JSON array' });
      }
    }

    // Now validate after parsing
    const { error } = unitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Collect image paths from uploaded files
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path); // Or use file.filename if you want relative names
    }

    // Add images array to req.body for creating unit
    const unitData = { ...req.body, images };

    // Existing validation and creation logic
    const existingUnit = await Unit.findOne({
      where: { unitNumber: req.body.unitNumber },
    });
    if (existingUnit) {
      return res.status(400).json({ error: "Unit number must be unique." });
    }

    const floor = await Floor.findByPk(req.body.floorId);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found." });
    }
    if (floor.status === "inActive" || floor.status === "under_construction") {
      return res.status(400).json({
        error: "Cannot add unit to an inactive or under-construction floor.",
      });
    }
    const currentUnitCount = await Unit.count({
      where: { floorId: req.body.floorId },
    });
    // if (floor.noUnits && currentUnitCount >= parseInt(floor.noUnits)) {
    //   return res.status(400).json({
    //     error: "Maximum number of units for this floor has been reached.",
    //   });
    // }

    const unit = await Unit.create(unitData);
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all units
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      include: {
        model: Floor,
        attributes: ["id", "floorNumber"],
      },
    });

    const unitsWithFullImageUrls = units.map((unit) => {
      let imageUrls = [];

      try {
        const imagePaths = JSON.parse(unit.images || "[]");
        imageUrls = imagePaths.map(
          (img) => `${BASE_URL}/${img.replace(/\\\\/g, "/")}`
        );
      } catch (err) {
        imageUrls = [];
      }

      return {
        ...unit.toJSON(),
        images: imageUrls,
      };
    });

    res.status(200).json(unitsWithFullImageUrls);
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
        attributes: ["id", "floorNumber", "status"], // Return relevant floor info
      },
    });
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
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
      return res.status(404).json({ message: "No units found for this floor" });
    }

    // Calculate counts
    const availableCount = units.filter(
      (unit) => unit.status === "available"
    ).length;
    const occupiedCount = units.filter(
      (unit) => unit.status === "occupied"
    ).length;
    const under_maintenance = units.filter(
      (unit) => unit.status === "under_maintenance"
    ).length;

    res.status(200).json({
      units,
      availableUnits: availableCount,
      occupiedUnits: occupiedCount,
      under_maintenance,
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
      return res.status(404).json({ message: "Unit not found" });
    }

    const newFloorId = req.body.floorId;

    if (newFloorId && newFloorId.toString() !== unit.floorId.toString()) {
      const floor = await Floor.findByPk(newFloorId);

      if (!floor) {
        return res.status(400).json({ message: "Target floor not found" });
      }

      if (floor.status !== "active") {
        return res.status(400).json({
          message: `Cannot assign unit to floor with status '${floor.status}'. Only floors with 'active' status are allowed.`,
        });
      }

      // const maxUnits = parseInt(floor.noUnits, 10);
      const currentUnitsCount = await Unit.count({
        where: { floorId: newFloorId },
      });

      // if (currentUnitsCount >= maxUnits) {
      //   return res.status(400).json({
      //     message: `Floor ${floor.floorNumber} has reached its unit limit (${maxUnits}).`,
      //   });
      // }
    }

    // Parse availableEquipments and problems JSON strings if needed
    if (
      req.body.availableEquipments &&
      typeof req.body.availableEquipments === "string"
    ) {
      try {
        req.body.availableEquipments = JSON.parse(req.body.availableEquipments);
      } catch (err) {
        return res
          .status(400)
          .json({ error: '"availableEquipments" must be a valid JSON array' });
      }
    }

    if (req.body.problems && typeof req.body.problems === "string") {
      try {
        req.body.problems = JSON.parse(req.body.problems);
      } catch (err) {
        return res
          .status(400)
          .json({ error: '"problems" must be a valid JSON array' });
      }
    }

    // Parse existing images JSON string (paths)
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch (err) {
        return res
          .status(400)
          .json({ error: '"existingImages" must be a valid JSON array' });
      }
    }

    // Process new uploaded images (files)
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = req.files.map((file) => file.path.replace(/\\/g, "/")); // normalize slashes if needed
    }

    // Combine existing images and new uploads
    const allImages = [...existingImages, ...uploadedImages];

    // Update data object
    const updateData = {
      ...req.body,
      images: allImages,
    };

    // Remove existingImages from updateData (not a DB field)
    delete updateData.existingImages;

    // Update the unit
    await unit.update(updateData);

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
      return res.status(404).json({ message: "Unit not found" });
    }
    await unit.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFreeUnits = async (req, res) => {
  try {
    const freeUnits = await Unit.findAll({ where: { status: "available" } });

    const freeUnitsWithFullImageUrls = freeUnits.map((unit) => {
      let imageUrls = [];
      console.log("Raw images:", unit.images); // <-- log raw images string

      try {
        const imagePaths = JSON.parse(unit.images || "[]");
        console.log("Parsed images:", imagePaths); // <-- log parsed array

        imageUrls = imagePaths.map(
          (img) => `${BASE_URL}/${img.replace(/\\/g, "/")}`
        );
        console.log("Final image URLs:", imageUrls); // <-- log final URLs
      } catch (err) {
        console.error("Error parsing images:", err);
        imageUrls = [];
      }

      const result = {
        ...unit.toJSON(),
        images: imageUrls,
      };

      console.log("Final unit object:", result);
      return result;
    });

    res.status(200).json(freeUnitsWithFullImageUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getRentedUnits = async (req, res) => {
  try {
    // Find all rented units (occupied units)
    const rentedUnits = await Unit.findAll({
      where: {
        status: "occupied",
      },
    });

    if (!rentedUnits.length) {
      return res.status(404).json({ message: "No rented units found" });
    }

    res.status(200).json(rentedUnits); // Return the list of rented units
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
      availableUnits: units.filter((u) => u.status === "available").length,
      occupiedUnits: units.filter((u) => u.status === "occupied").length,
      underMaintenanceUnits: units.filter(
        (u) => u.status === "under_maintenance"
      ).length,
    };

    res.status(200).json({ unitsReport: statusCounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
