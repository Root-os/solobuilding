const Vendor = require("../models/Vendor");
const ServiceType = require("../models/ServiceType");
const { vendorUpdateSchema, vendorValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");


exports.createVendor = async (req, res) => {
  try {

    // Validate req.body with Joi
    const { error } = vendorValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
    }

    // Extract values from req.body
    const {
      fname,
      lname,
      phone,
      email,
      address,
      contractTerms,
      serviceTypeId,

    } = req.body;


    // Convert serviceTypeId to an integer
    const parsedServiceTypeId = parseInt(serviceTypeId, 10);
    if (isNaN(parsedServiceTypeId)) {
      return res.status(400).json({ message: "Invalid serviceTypeId" });
    }

    // Check if a vendor with the same phone number already exists
    const existingVendor = await Vendor.findOne({ where: { phone } });
    if (existingVendor) {
      return res.status(400).json({ message: "A vendor with this phone number already exists" });
    }


    // Create Vendor
    const vendor = await Vendor.create({
      fname,
      lname,
      phone,
      email,
      address,
      contractTerms: req.file ? req.file.path : contractTerms,
      serviceTypeId: parsedServiceTypeId,
    });

    res.status(201).json(vendor);
  } catch (error) {
    console.error("Error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: `The phone number ${error.fields.phone} must be unique` });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ message: error.errors.map(err => err.message).join(', ') });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};
// Get All Vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      include: [ServiceType],
    });
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [ServiceType],
    });

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    // Validate request body with Joi using the update schema
    const { error } = vendorUpdateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map(detail => detail.message).join(', ') });
    }

    const {
      fname,
      lname,
      phone,
      email,
      address,
      contractTerms,
      serviceTypeId,
    } = req.body;
    

    // Validate request params with Joi
    const { error: errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res.status(400).json({ message: errorId.details[0].message });
    }

    // Find vendor by ID
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Update only the fields provided in the request
    if (fname !== undefined) vendor.fname = fname;
    if (lname !== undefined) vendor.lname = lname;
    if (phone !== undefined) vendor.phone = phone;
    if (email !== undefined) vendor.email = email;
    if (address !== undefined) vendor.address = address;
    if (req.file) vendor.contractTerms = req.file.path;
    else if (contractTerms !== undefined) vendor.contractTerms = contractTerms;
    if (serviceTypeId !== undefined) vendor.serviceTypeId = serviceTypeId;

    // Save updated vendor
    await vendor.save();

    res.status(200).json(vendor);
  } catch (error) {
    console.error(error); // Log the error for debugging
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: `The phone number ${error.fields.phone} must be unique` });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ message: error.errors.map(err => err.message).join(', ') });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Delete Vendor
exports.deleteVendor = async (req, res) => {
  try {
    const { error } = paramsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    await vendor.destroy();

    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
