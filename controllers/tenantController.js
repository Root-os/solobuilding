const Floor = require('../models/floor');
const Unit = require('../models/unit');
const Tenant = require('../models/tenant');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const fs = require('fs');

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Save file to 'uploads/' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add a timestamp to ensure unique filenames
  }
});

const upload = multer({ storage: storage });

// Create a new tenant with file upload
exports.createTenant = async (req, res) => {
  try {
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Check if a file was uploaded
      const filePath = req.file ? `/uploads/${req.file.filename}` : null;

      // Extract unitId from request body
      const { unitId,leaseStartDate} = req.body;

      // Check if unitId exists
      if (!unitId) {
        return res.status(400).json({ error: "Unit ID is required" });
      }

      // Check if the unit exists and is available
      const unit = await Unit.findByPk(unitId);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }

      if (unit.status !== "available") {
        return res.status(400).json({ error: "Unit is already occupied or under maintenance" });
      }

      // Prepare tenant data
      const tenantData = {
        ...req.body,
        document: filePath,
      };

      // Create tenant record
      const tenant = await Tenant.create(tenantData);

      // Update unit status to "occupied"
      await Unit.update({ status: "occupied" }, { where: { id: unitId } });
      await Unit.update({ rentedDate: leaseStartDate }, { where: { id: unitId } });

      res.status(201).json(tenant);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all tenants
exports.getAllTenants = async (req, res) => {
    try {
      const tenants = await Tenant.findAll({
        include: [
          {
            model: Unit,
            attributes: ['unitNumber'], // Only select the unit number
          },
          {
            model: Floor,
            attributes: ['floorNumber'], // Only select the floor number
          },
        ],
      });
  
      const baseUploadPath = path.join(__dirname, '../uploads'); // Path to your 'uploads' directory
  
      // Map through tenants to add the full document path and date calculations
      const tenantsWithDetails = tenants.map(tenant => {
        const documentFullPath = tenant.document ? path.join(baseUploadPath, tenant.document) : null;
  
        // Convert lease dates to moment objects
        const leaseStartDate = moment(tenant.leaseStartDate);
        const leaseEndDate = moment(tenant.leaseEndDate);
        const currentDate = moment();
  
        // Months paid calculation: full months between leaseStartDate and leaseEndDate
        const monthsPaid = leaseEndDate.diff(leaseStartDate, 'months');  
        // Remaining days for rent payment (between currentDate and leaseEndDate)
        const remainingDays = leaseEndDate.diff(currentDate, 'days');
  
        return {
          ...tenant.toJSON(),
          documentFullPath,
          monthsPaid,
          remainingDays: remainingDays > 0 ? remainingDays : 0, // Return 0 if the lease has already expired
        };
      });
  
      res.status(200).json(tenantsWithDetails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
// Get tenant by ID
exports.getTenantById = async (req, res) => {
  try {
       const tenants = await Tenant.findAll({
      where: { id: req.params.id },
      include: [
        {
          model: Unit,
          attributes: ['unitNumber'],
        },
        {
          model: Floor,
          attributes: ['floorNumber'],
        },
      ],
    });

    if (!tenants.length) {
      return res.status(404).json({ message: 'No tenants found ' });
    }

    res.status(200).json(processTenantDetails(tenants));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update tenant details
exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ where: { id: req.params.id } });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if status is being updated to "inactive"
    if (req.body.status && req.body.status === 'inactive') {
      // Update unit status to "available" and set vacatedDate to current date
      await Unit.update(
        { status: 'available', vacatedDate: new Date() },
        { where: { id: tenant.unitId } }
      );
    }

    // Handle file upload if a new document is provided
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Check if a file was uploaded
      const filePath = req.file ? `/uploads/${req.file.filename}` : tenant.document; // Keep existing document if no new file uploaded

      // Update tenant data, including file path
      const updatedData = {
        ...req.body,
        document: filePath,
      };

      await tenant.update(updatedData);
      res.status(200).json(tenant);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete tenant by ID
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ where: { id: req.params.id } });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    await tenant.destroy();
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get tenants by unitId
exports.getTenantsByUnitId = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      where: { unitId: req.params.unitId },
      include: [Unit, Floor], // Include related data for unit and floor
    });

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'No tenants found for this unit' });
    }

    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get tenants by floorId
exports.getTenantsByFloorId = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      where: { floorId: req.params.floorId },
      include: [Unit, Floor], // Include related data for unit and floor
    });

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'No tenants found for this floor' });
    }
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.filterTenants = async (req, res) => {
  try {
    const { paymentStatus, leaseStartDateFrom, leaseStartDateTo, leaseEndDateFrom, leaseEndDateTo, status, unitId, floorId } = req.body;

    let whereConditions = {};

    if (paymentStatus) {
      whereConditions.paymentStatus = paymentStatus;
    }

    if (status) {
      whereConditions.status = status;
    }

    if (unitId) {
      whereConditions.unitId = unitId;
    }

    if (floorId) {
      whereConditions.floorId = floorId;
    }

    if (leaseStartDateFrom && leaseStartDateTo) {
      whereConditions.leaseStartDate = {
        [Op.between]: [leaseStartDateFrom, leaseStartDateTo],
      };
    }

    if (leaseEndDateFrom && leaseEndDateTo) {
      whereConditions.leaseEndDate = {
        [Op.between]: [leaseEndDateFrom, leaseEndDateTo],
      };
    }
    const tenants = await Tenant.findAll({
      where: whereConditions,
      include: [
        {
          model: Unit,
          attributes: ['unitNumber'],
        },
        {
          model: Floor,
          attributes: ['floorNumber'],
        },
      ],
    });

    if (!tenants.length) {
      return res.status(404).json({ message: 'No tenants found with the given filters' });
    }

    res.status(200).json(processTenantDetails(tenants));


  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTenantsWithExpiringLease = async (req, res) => {
  try {
    const today = new Date();
    const tenDaysLater = new Date();
    tenDaysLater.setDate(today.getDate() + 10);

    
    const tenants = await Tenant.findAll({
      where: {
        leaseEndDate: {
          [Op.between]: [today, tenDaysLater]
        }
      },
      include: [
        {
          model: Unit,
          attributes: ['unitNumber'],
        },
        {
          model: Floor,
          attributes: ['floorNumber'],
        },
      ],
    });

    if (!tenants.length) {
      return res.status(404).json({ message: 'No tenants found with the given filters' });
    }

    res.status(200).json(processTenantDetails(tenants));

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const processTenantDetails = (tenants) => {
  const baseUploadPath = path.join(__dirname, '../uploads'); // Path to your 'uploads' directory

  return tenants.map(tenant => {
    const documentFullPath = tenant.document ? path.join(baseUploadPath, tenant.document) : null;

    const leaseStartDate = moment(tenant.leaseStartDate);
    const leaseEndDate = moment(tenant.leaseEndDate);
    const currentDate = moment();

    const monthsPaid = leaseEndDate.diff(leaseStartDate, 'months');  
    const remainingDays = leaseEndDate.diff(currentDate, 'days');

    return {
      ...tenant.toJSON(),
      documentFullPath,
      monthsPaid,
      remainingDays: remainingDays > 0 ? remainingDays : 0, // Return 0 if lease expired
    };
  });
};