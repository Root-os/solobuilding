const Vendor = require("../models/Vendor");
const ServiceType = require("../models/serviceType");
const { vendorValidationSchema } = require("../helpers/schema");
const { paramsSchema } = require("../helpers/schema");

// Create Vendor
exports.createVendor = async (req, res) => {
  try {
    const { error } = vendorValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
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

    const vendor = await Vendor.create({
      fname,
      lname,
      phone,
      email,
      address,
      contractTerms: req.file ? req.file.path : null,
      serviceTypeId,
    });

    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const { error } = vendorValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
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

    // Validate that required fields are provided
    if (!fname || !lname || !phone || !serviceTypeId) {
      return res
        .status(400)
        .json({
          message:
            "Required fields are missing: fname, lname, phone, serviceTypeId",
        });
    }

    // Find vendor by ID
    const { errorId } = paramsSchema.validate(req.params);
    if (errorId) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Update vendor fields, handle optional contractTerms field
    vendor.fname = fname;
    vendor.lname = lname;
    vendor.phone = phone;
    vendor.email = email;
    vendor.address = address;
    vendor.contractTerms = req.file
      ? req.file.path
      : contractTerms || vendor.contractTerms; // Keep existing contractTerms if not provided
    vendor.serviceTypeId = serviceTypeId;

    // Save updated vendor
    await vendor.save();

    res.status(200).json(vendor);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: error.message });
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
