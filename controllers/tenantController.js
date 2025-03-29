const Floor = require('../models/floor');
const Unit = require('../models/unit');
const Tenant = require('../models/tenant');
const TenantVehicle = require('../models/tenantVehicle');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const fs = require('fs');
const sendEmail = require('../middleware/sendEmail');
const bcrypt = require('bcryptjs');
const {tenatSchema}=require('../helpers/schema')

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

exports.createTenant = async (req, res) => {
  try {
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      const filePath = req.file ? `/uploads/${req.file.filename}` : null;
      const { error } = tenatSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { 
        unitId, 
        leaseStartDate, 
        email, 
        fullName, 
        nationalId, 
        phoneNumber, 
        tin, 
        floorId, 
        advance, 
        carPlate = null, // Optional
        carName = null,  // Optional
        color = null     // Optional
      } = req.body;

      // Check if the unit exists and is available
      const unit = await Unit.findByPk(unitId);
      if (!unit) return res.status(404).json({ error: "Unit not found" });
      if (unit.status !== "available") {
        return res.status(400).json({ error: "Unit is already occupied or under maintenance" });
      }

      const floor = await Floor.findByPk(floorId);
      if (!floor) return res.status(404).json({ error: "Floor not found" });

      // Check for existing tenant with the same email, nationalId, phoneNumber, or tin
      const existingTenant = await Tenant.findOne({
        where: {
          [Op.or]: [
            { email },
            { nationalId },
            { phoneNumber },
            { tin }
          ],
        },
      });

      if (existingTenant) {
        let errorMessage = '';
        if (existingTenant.email === email) {
          errorMessage = "A tenant with the same email already exists";
        } else if (existingTenant.nationalId === nationalId) {
          errorMessage = "A tenant with the same national ID already exists";
        } else if (existingTenant.phoneNumber === phoneNumber) {
          errorMessage = "A tenant with the same phone number already exists";
        } else if (existingTenant.tin === tin) {
          errorMessage = "A tenant with the same tin already exists";
        }
        return res.status(400).json({ error: errorMessage });
      }

      // Generate a random password
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Prepare tenant data
      const tenantData = {
        unitId,
        leaseStartDate,
        email,
        fullName,
        nationalId,
        phoneNumber,
        tin,
        floorId,
        advance,
        document: filePath,
        password: hashedPassword,
      };

      // Create tenant record
      const tenant = await Tenant.create(tenantData);

      // Register tenant's vehicle if provided (non-null/undefined values)
      if (carPlate || carName || color) {
        await TenantVehicle.create({
          tenantId: tenant.id,
          carPlate,
          carName,
          color,
        });
      }

      // Update unit status to "occupied" and set rented date
      await Unit.update(
        { status: "occupied", rentedDate: leaseStartDate },
        { where: { id: unitId } }
      );

      // Send email with login credentials
      const emailSubject = "Your Tenant Portal Login Credentials";
      const emailBody = `Hello ${fullName},\n\nWelcome! Here are your login credentials:\n\nEmail: ${email}\nPassword: ${generatedPassword}\n\nPlease log in and change your password immediately.\n\nThank you!`;
      const emailResponse = await sendEmail(email, emailSubject, emailBody);
      if (!emailResponse.success) {
        console.error("Email sending failed:", emailResponse.error);
      }

      res.status(201).json({
        success: true,
        message: "Tenant registered successfully",
        password: generatedPassword,
      });
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      let errorMessage = '';
      switch (field) {
        case 'email':
          errorMessage = "A tenant with the same email already exists";
          break;
        case 'nationalId':
          errorMessage = "A tenant with the same national ID already exists";
          break;
        case 'phoneNumber':
          errorMessage = "A tenant with the same phone number already exists";
          break;
        default:
          errorMessage = "A tenant with the same credentials already exists";
      }
      return res.status(400).json({ error: errorMessage });
    }
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
    const id = Number(req.params.id);
    if(isNaN(id)) {
      return res.status(400).json({ error: 'Invalid tenant ID' });
    }
    const tenant = await Tenant.findOne({ where: { id:id} });

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
    const tenDaysLater = new Date(today);
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