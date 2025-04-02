const ServiceType = require("../models/ServiceType");
const { serviceTypeValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");

// Create ServiceType
exports.createServiceType = async (req, res) => {
  try {
    const { error } = serviceTypeValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { name, description } = req.body;

    const serviceType = await ServiceType.create({
      name,
      description,
    });

    res.status(201).json(serviceType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All ServiceTypes
exports.getAllServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.findAll();
    res.status(200).json(serviceTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get ServiceType by ID
exports.getServiceTypeById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const serviceType = await ServiceType.findByPk(req.params.id);

    if (!serviceType) {
      return res.status(404).json({ message: "ServiceType not found" });
    }

    res.status(200).json(serviceType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update ServiceType
exports.updateServiceType = async (req, res) => {
  try {
    const { error } = serviceTypeValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, description } = req.body;

    const { errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const serviceType = await ServiceType.findByPk(req.params.id);

    if (!serviceType) {
      return res.status(404).json({ message: "ServiceType not found" });
    }

    serviceType.name = name;
    serviceType.description = description;

    await serviceType.save();

    res.status(200).json(serviceType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete ServiceType
exports.deleteServiceType = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const serviceType = await ServiceType.findByPk(req.params.id);

    if (!serviceType) {
      return res.status(404).json({ message: "ServiceType not found" });
    }

    await serviceType.destroy();

    res.status(200).json({ message: "ServiceType deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
