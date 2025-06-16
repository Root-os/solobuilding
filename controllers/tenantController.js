const Floor = require("../models/floor");
const Unit = require("../models/unit");
const Tenant = require("../models/tenant");
const TenantVehicle = require("../models/tenantVehicle");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const sendEmail = require("../middleware/sendEmail");
const bcrypt = require("bcryptjs");
const { tenatSchema } = require("../helpers/schema");
const sendTenantWelcomeEmail = require("../services/sendEmail");
const { BASE_URL } = require("../config/config");
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // Save file to 'uploads/' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add a timestamp to ensure unique filenames
  },
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
        leaseEndDate,
        email,
        fullName,
        nationalId,
        phoneNumber,
        tin,
        floorId,
        advance,

        amount,
        carPlate = null, // Optional
        carName = null, // Optional
        color = null, // Optional
      } = req.body;

      // Check if the unit exists and is available
      const unit = await Unit.findByPk(unitId);
      if (!unit) return res.status(404).json({ error: "Unit not found" });
      if (unit.status !== "available") {
        return res
          .status(400)
          .json({ error: "Unit is already occupied or under maintenance" });
      }

      const floor = await Floor.findByPk(floorId);
      if (!floor) return res.status(404).json({ error: "Floor not found" });

      // Check for existing tenant with the same email, nationalId, phoneNumber, or tin
      const existingTenant = await Tenant.findOne({
        where: {
          [Op.or]: [{ email }, { nationalId }, { phoneNumber }, { tin }],
        },
      });

      if (existingTenant) {
        let errorMessage = "";
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

      // Generate a 4-digit numeric password
      const generatedPassword = Math.floor(
        1000 + Math.random() * 9000
      ).toString();

      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Prepare tenant data
      const tenantData = {
        unitId,
        leaseStartDate,
        leaseEndDate,
        email,
        fullName,
        nationalId,
        phoneNumber,
        tin,
        floorId,
        amount,
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

      const emailResponse = await sendTenantWelcomeEmail({
        email,
        fullName,
        generatedPassword,
      });
      //const emailResponse = await sendEmail(email, emailSubject, emailBody);
      if (!emailResponse.success) {
        console.error("Email sending failed:", emailResponse.error);
      }

      // Send SMS notification
    const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
    const smsResponse = await smsUtil.sendSingleSMS({
      phone: phoneNumber,
      msg: `Welcome ${fullName}! Your tenant account has been created successfully.\nUsername: ${email}\nPassword: ${generatedPassword}\nPlease change your password after your first login.`,
      callback: process.env.GEEZSMS_WEBHOOK_URL,
    });

      res.status(201).json({
        success: true,
        message: "Tenant registered successfully",
        password: generatedPassword,
      });
    });

  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0].path;
      let errorMessage = "";
      switch (field) {
        case "email":
          errorMessage = "A tenant with the same email already exists";
          break;
        case "nationalId":
          errorMessage = "A tenant with the same national ID already exists";
          break;
        case "phoneNumber":
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
          attributes: ["unitNumber"], // Only select the unit number
        },
        {
          model: Floor,
          attributes: ["floorNumber"], // Only select the floor number
        },
        {
          model: TenantVehicle, // Include tenant vehicle information
          attributes: ["carPlate", "carName", "color"], // Select car details
        },
      ],
    });

    const baseUploadPath = path.join(__dirname, "../uploads"); // Path to your 'uploads' directory

    // Map through tenants to add the full document path and date calculations
    const tenantsWithDetails = tenants.map((tenant) => {
      const documentFullPath = tenant.document
        ? `${BASE_URL}${tenant.document}`
        : null;
      // Convert lease dates to moment objects
      const leaseStartDate = moment(tenant.leaseStartDate);
      const leaseEndDate = moment(tenant.leaseEndDate);
      const currentDate = moment();

      // Months paid calculation: full months between leaseStartDate and leaseEndDate
      const monthsPaid = leaseEndDate.diff(leaseStartDate, "months");
      // Remaining days for rent payment (between currentDate and leaseEndDate)
      const remainingDays = leaseEndDate.diff(currentDate, "days");

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

exports.getTenantById = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      where: { id: req.params.id },
      include: [
        {
          model: Unit,
          attributes: ["unitNumber"],
        },
        {
          model: Floor,
          attributes: ["floorNumber"],
        },
      ],
    });

    if (!tenants.length) {
      return res.status(404).json({ message: "No tenants found " });
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
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid tenant ID" });
    }

    // Handle file upload and process body inside middleware
    upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Log req.body after multer processes it
      console.log("Received body:", JSON.stringify(req.body));

      let tenant = await Tenant.findOne({ where: { id }, include: Unit });
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Validate unitId if provided
      const unitId = req.body.unitId ? Number(req.body.unitId) : tenant.unitId;
      if (req.body.unitId && isNaN(unitId)) {
        return res.status(400).json({ error: "Invalid unit ID" });
      }

      // Store the previous unitId for updating its status
      const previousUnitId = tenant.unitId;

      // Handle status update logic for unit
      if (req.body.status === "inactive" && previousUnitId) {
        await Unit.update(
          { status: "available", vacatedDate: new Date(), rentedDate: null },
          { where: { id: previousUnitId } }
        );
      }

      if (req.body.status === "active" && unitId) {
        const unitExists = await Unit.findOne({ where: { id: unitId } });
        if (!unitExists) {
          return res.status(400).json({ error: "Unit not found" });
        }
        // Update the new unit to occupied
        await Unit.update(
          {
            status: "occupied",
            rentedDate: req.body.leaseStartDate || new Date(),
            vacatedDate: null,
          },
          { where: { id: unitId } }
        );
      }

      // If unitId has changed, set the previous unit to available
      if (
        req.body.unitId &&
        Number(req.body.unitId) !== previousUnitId &&
        previousUnitId
      ) {
        await Unit.update(
          { status: "available", vacatedDate: new Date(), rentedDate: null },
          { where: { id: previousUnitId } }
        );
      }

      // Handle file upload
      const filePath = req.file
        ? `/Uploads/${req.file.filename}`
        : tenant.document;

      // Prepare updated data, exclude fields not in Tenant model
      const updatedData = {
        fullName: req.body.fullName || tenant.fullName,
        phoneNumber: req.body.phoneNumber || tenant.phoneNumber,
        email: req.body.email || tenant.email,
        nationalId: req.body.nationalId || tenant.nationalId,
        leaseStartDate: req.body.leaseStartDate || tenant.leaseStartDate,
        leaseEndDate: req.body.leaseEndDate || tenant.leaseEndDate,
        paymentStatus: req.body.paymentStatus || tenant.paymentStatus,
        additionalNotes: req.body.additionalNotes || tenant.additionalNotes,
        unitId: unitId,
        floorId: req.body.floorId ? Number(req.body.floorId) : tenant.floorId,
        advance: req.body.advance || tenant.advance,
        tin: req.body.tin || tenant.tin,
        status: req.body.status || tenant.status,
        description: req.body.description || tenant.description,
        document: filePath,
      };

      // Update tenant record
      await tenant.update(updatedData);

      // Re-fetch updated tenant + Unit info
      const updatedTenant = await Tenant.findOne({
        where: { id: tenant.id },
        include: [
          {
            model: Unit,
            attributes: [
              "id",
              "unitNumber",
              "status",
              "vacatedDate",
              "rentedDate",
            ],
          },
        ],
      });

      return res.status(200).json(updatedTenant);
    });
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete tenant by ID
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ where: { id: req.params.id } });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Mark the associated unit as 'available' if tenant has one
    if (tenant.unitId) {
      await Unit.update(
        {
          status: "available",
          vacatedDate: new Date(), // optional: update vacatedDate as well
        },
        { where: { id: tenant.unitId } }
      );
    }

    // Delete the tenant
    await tenant.destroy();

    res
      .status(200)
      .json({ message: "Tenant deleted and unit marked as available" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
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
      return res
        .status(404)
        .json({ message: "No tenants found for this unit" });
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
      return res
        .status(404)
        .json({ message: "No tenants found for this floor" });
    }
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.filterTenants = async (req, res) => {
  try {
    const {
      leaseStartDateFrom,
      leaseStartDateTo,
      leaseEndDateFrom,
      leaseEndDateTo,
      status,
      unitId,
      floorId,
    } = req.body;

    let whereConditions = {};

    if (status) whereConditions.status = status;
    if (unitId) whereConditions.unitId = unitId;
    if (floorId) whereConditions.floorId = floorId;
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
          attributes: ["unitNumber"],
        },
        {
          model: Floor,
          attributes: ["floorNumber"],
        },
      ],
    });

    if (!tenants.length) {
      return res.status(200).json([]);
    }

    const tenantsWithDetails = tenants.map((tenant) => {
      const leaseStartDate = moment(tenant.leaseStartDate);
      const leaseEndDate = moment(tenant.leaseEndDate);
      const currentDate = moment();

      const monthsPaid = leaseEndDate.diff(leaseStartDate, "months");
      const remainingDays = leaseEndDate.diff(currentDate, "days");

      return {
        ...tenant.toJSON(),
        documentUrl: tenant.document ? `${BASE_URL}${tenant.document}` : null,
        monthsPaid,
        remainingDays: remainingDays > 0 ? remainingDays : 0,
      };
    });

    res.status(200).json(tenantsWithDetails);
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
          [Op.between]: [today, tenDaysLater],
        },
      },
      include: [
        {
          model: Unit,
          attributes: ["unitNumber"],
        },
        {
          model: Floor,
          attributes: ["floorNumber"],
        },
      ],
    });

    if (!tenants.length) {
      return res
        .status(404)
        .json({ message: "No tenants found with the given filters" });
    }

    res.status(200).json(processTenantDetails(tenants));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const processTenantDetails = (tenants) => {
  const baseUploadPath = path.join(__dirname, "../uploads");

  return tenants.map((tenant) => {
    const documentFullPath = tenant.document
      ? path.join(baseUploadPath, tenant.document)
      : null;

    const leaseStartDate = moment(tenant.leaseStartDate);
    const leaseEndDate = moment(tenant.leaseEndDate);
    const currentDate = moment();

    const monthsPaid = leaseEndDate.diff(leaseStartDate, "months");
    const remainingDays = leaseEndDate.diff(currentDate, "days");

    return {
      ...tenant.toJSON(),
      documentFullPath,
      monthsPaid,
      remainingDays: remainingDays > 0 ? remainingDays : 0, // Return 0 if lease expired
    };
  });
};
