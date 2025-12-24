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
const Setting = require("../models/setting");
const { toEthiopian } = require("ethiopian-date");
const { collectFirstRent } = require("../services/rentService");



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
      if (err) return res.status(400).json({ error: err.message });

      const filePath = req.file ? `/uploads/${req.file.filename}` : null;

      ["leaseStartDate", "leaseEndDate", "contractEndDate"].forEach((key) => {
        if (req.body[key] && Array.isArray(req.body[key])) req.body[key] = req.body[key][0];
        if (typeof req.body[key] === "string") {
          req.body[key] = req.body[key].trim();
          if (req.body[key] === "") req.body[key] = undefined;
        }
      });

      const { error } = tenatSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
    
      let {
        unitId,
        leaseStartDate,
        leaseEndDate,
        contractEndDate,
        email,
        fullName,
        nationalId,
        phoneNumber,
        tin,
        floorId,
        amount,
        advance,
         additionalNotes = null,
        carPlate = null,
        carName = null,
        color = null,
      } = req.body;

      if (Array.isArray(phoneNumber)) phoneNumber = phoneNumber[0];
      phoneNumber = phoneNumber?.trim();
      if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

      const existingTenant = await Tenant.findOne({ where: { phoneNumber } });
      const isExisting = Boolean(existingTenant);

      let hashedPassword;
      let generatedPassword = null;
      let shouldNotify = true;

      if (isExisting) {
        hashedPassword = existingTenant.password;
        shouldNotify = false;
      } else {
        generatedPassword = Math.floor(1000 + Math.random() * 9000).toString();
        hashedPassword = await bcrypt.hash(generatedPassword, 10);
      }

      const unit = await Unit.findByPk(unitId);
      if (!unit) return res.status(404).json({ error: "Unit not found" });
      if (unit.status !== "available")
        return res.status(400).json({ error: "Unit is already occupied or under maintenance" });

      const floor = await Floor.findByPk(floorId);
      if (!floor) return res.status(404).json({ error: "Floor not found" });

      const finalNationalId = nationalId?.trim() === "" ? null : nationalId;
      const finalTin = tin?.trim() === "" ? null : tin;
      const finalAdditionalNotes = additionalNotes?.trim() === "" ? null : additionalNotes;


      const tenantData = {
        unitId,
        leaseStartDate,
        leaseEndDate,
        contractEndDate,
        email,
        fullName,
        nationalId: finalNationalId,
        additionalNotes: finalAdditionalNotes,
        phoneNumber,
        tin: finalTin,
        floorId,
        amount,
        advance,
        document: filePath,
        password: hashedPassword,
        isExisting,
      };

      const tenant = await Tenant.create(tenantData);

      //  Auto collect first rent if leaseEndDate is provided
        if (leaseStartDate && leaseEndDate) {
          try {
            await collectFirstRent({
              tenantId: tenant.id,
              leaseStartDate,
              leaseEndDate,
              paymentMethod: "system", 
            });
          } catch (err) {
            console.error("Auto rent collection failed:", err.message);
          }
        }

      if (carPlate || carName || color) {
        await TenantVehicle.create({ tenantId: tenant.id, carPlate, carName, color });
      }

      await Unit.update({ status: "occupied", rentedDate: leaseStartDate }, { where: { id: unitId } });

      const setting = await Setting.findOne();
      let displayLeaseStartDate = leaseStartDate;
      let displayLeaseEndDate = leaseEndDate;

      if (setting && setting.isGregorian === false) {
        if (leaseStartDate) {
          const d = new Date(leaseStartDate);
          const [y, m, day] = toEthiopian(d.getFullYear(), d.getMonth() + 1, d.getDate());
          displayLeaseStartDate = `${day}-${m}-${y}`;
        }
        if (leaseEndDate) {
          const d = new Date(leaseEndDate);
          const [y, m, day] = toEthiopian(d.getFullYear(), d.getMonth() + 1, d.getDate());
          displayLeaseEndDate = `${day}-${m}-${y}`;
        }
      }

      if (shouldNotify && email) {
        try {
          const emailResponse = await sendTenantWelcomeEmail({
            email,
            fullName,
            generatedPassword,
            phoneNumber,
            floorNumber: floor.floorNumber,
            unitNumber: unit.unitNumber,
            leaseStartDate: displayLeaseStartDate,
            leaseEndDate: displayLeaseEndDate,
            loginUrl: process.env.TENANT_PORTAL_URL,
            downloadApk: process.env.DOWNLOAD_APK_URL,
          });

          if (!emailResponse.success) console.error("Email failed:", emailResponse.error);
        } catch (err) {
          console.error("Unexpected email error:", err.message);
        }
      }

      if (shouldNotify) {
        try {
          const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
          const username = email || phoneNumber;
          const smsMessage =
            `Welcome ${fullName}!\n` +
            `Your tenant account has been created successfully.\n` +
            `Floor: ${floor.floorNumber}, Unit: ${unit.unitNumber}\n` +
            `Phone: ${phoneNumber}\n` +
            `Rented from: ${displayLeaseStartDate} To ${displayLeaseEndDate || "not specified yet"}\n` +
            `Username: ${username}\nPassword: ${generatedPassword}\n` +
            `Please log in: ${process.env.TENANT_PORTAL_URL}\n` +
            `Download app: ${process.env.DOWNLOAD_APK_URL}\n` +
            `You can change your password anytime.`;

          await smsUtil.sendSingleSMS({
            phone: phoneNumber,
            msg: smsMessage,
            callback: process.env.GEEZSMS_WEBHOOK_URL,
          });
        } catch (err) {
          console.error("SMS failed:", err.message);
        }
      }

      res.status(201).json({
        success: true,
        isExisting,
        message: isExisting ? "Existing tenant linked successfully" : "Tenant registered successfully",
        password: generatedPassword, // will be null if existing tenant
      });
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0].path;
      const errorMessage =
        field === "phoneNumber"
          ? "A tenant with the same phone number already exists"
          : "A tenant with the same credentials already exists";
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
          attributes: ["unitNumber", "status"],
        },
        {
          model: Floor,
          attributes: ["floorNumber"],
        },
        {
          model: TenantVehicle,
          attributes: ["carPlate", "carName", "color"],
        },
      ],
    });

    const baseUploadPath = path.join(__dirname, "../uploads"); // Path to 'uploads' directory

    // Map through tenants to add the full document path and date calculations
    const tenantsWithDetails = tenants.map((tenant) => {
      const documentFullPath = tenant.document
        ? `${BASE_URL}${tenant.document}`
        : null;
      // Convert lease dates to moment objects
      const leaseStartDate = moment(tenant.leaseStartDate).startOf("day");
      const leaseEndDate = moment(tenant.leaseEndDate).startOf("day");
      const currentDate = moment().startOf("day");

      // Months paid calculation: full months between leaseStartDate and leaseEndDate
      const monthsPaid = leaseEndDate.diff(leaseStartDate, "months");
      // Remaining days for rent payment (between currentDate and leaseEndDate)
      const remainingDays = leaseEndDate.diff(currentDate, "days");

      return {
        ...tenant.toJSON(),
        documentFullPath,
        monthsPaid,
        remainingDays: remainingDays > 0 ? remainingDays : 0, // Return 0 if the lease has already expired or inserted null
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
      upload.single("document")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      // console.log(" req.body:", req.body);
      const tenant = await Tenant.findByPk(req.params.id, {
        include: [
          { model: Unit, attributes: ["id", "status", "vacatedDate", "rentedDate"] },
          { model: Floor, attributes: ["id", "floorNumber"] }
        ]
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // ----------------------
      // Preserve previous state
      // ----------------------
      const previousStatus = tenant.status;
      const previousUnitId = tenant.unitId;

      // ----------------------
      // Normalize incoming values
      // ----------------------
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] === "") req.body[key] = null;
      });

      const newStatus = req.body.status ?? tenant.status;
      const newUnitId = req.body.unitId ?? tenant.unitId;

      // ----------------------
      //  Reactivation validation (core business rule)
      // ----------------------
      if (previousStatus === "inactive" && newStatus === "active") {
        if (!newUnitId) {
          return res.status(400).json({
            message: "You must select an available unit to reactivate this tenant"
          });
        }

        const unit = await Unit.findByPk(newUnitId);

        if (!unit) {
          return res.status(404).json({ message: "Selected unit not found" });
        }

        if (unit.status === "occupied") {
          return res.status(400).json({
            message: "Selected unit is already occupied. Choose another available unit."
          });
        }
      }

      // ----------------------
      // Handle file upload
      // ----------------------
      const filePath = req.file ? `/uploads/${req.file.filename}` : tenant.document;

      //reset password

      let generatedPassword = null;
      let hashedPassword = tenant.password;

      if (req.body.resetPassword === "true") {
        generatedPassword = Math.floor(1000 + Math.random() * 9000).toString();
        hashedPassword = await bcrypt.hash(generatedPassword, 10);
        // console.log(`🔐 Password reset requested for tenant ${tenant.id}. Generated password: ${generatedPassword}`);
      } else {
        // console.log(`🔐 No password reset for tenant ${tenant.id}`);
      }


      // ----------------------
      // Update tenant
      // ----------------------
      const updatedData = {
        fullName: req.body.fullName ?? tenant.fullName,
        email: Object.prototype.hasOwnProperty.call(req.body, "email")
          ? req.body.email
          : tenant.email,
        phoneNumber: req.body.phoneNumber ?? tenant.phoneNumber,
        nationalId: Object.prototype.hasOwnProperty.call(req.body, "nationalId")
          ? req.body.nationalId
          : tenant.nationalId,
        tin: Object.prototype.hasOwnProperty.call(req.body, "tin")
          ? req.body.tin
          : tenant.tin,
        leaseStartDate: req.body.leaseStartDate ?? tenant.leaseStartDate,
        leaseEndDate: req.body.leaseEndDate ?? tenant.leaseEndDate,
        contractEndDate: req.body.contractEndDate ?? tenant.contractEndDate,
        additionalNotes: req.body.additionalNotes ?? tenant.additionalNotes,
        amount: req.body.amount ?? tenant.amount,
        advance: req.body.advance ?? tenant.advance,
        document: filePath,
        status: newStatus,
        floorId: req.body.floorId ?? tenant.floorId,
        unitId: newUnitId,
        password: hashedPassword,
      };

      await Tenant.update(
        { password: hashedPassword },
        { where: { phoneNumber: tenant.phoneNumber } }
      );

      // update other fields ONLY for this tenant
      await tenant.update({
        ...updatedData,
        password: tenant.password // keep original here
      });

      // ----------------------
      //  Unit state transitions
      // ----------------------

      // ACTIVE → INACTIVE
      if (previousStatus === "active" && newStatus === "inactive" && previousUnitId) {
        await Unit.update(
          { status: "available", vacatedDate: new Date() },
          { where: { id: previousUnitId } }
        );
      }

      // INACTIVE → ACTIVE
      if (previousStatus === "inactive" && newStatus === "active") {
        await Unit.update(
          {
            status: "occupied",
            rentedDate: updatedData.leaseStartDate || new Date(),
          },
          { where: { id: newUnitId } }
        );
      }

      // ACTIVE → ACTIVE with unit change
      if (
        previousStatus === "active" &&
        newStatus === "active" &&
        previousUnitId !== newUnitId
      ) {
        if (previousUnitId) {
          await Unit.update(
            { status: "available", vacatedDate: new Date() },
            { where: { id: previousUnitId } }
          );
        }

        if (newUnitId) {
          await Unit.update(
            {
              status: "occupied",
              rentedDate: updatedData.leaseStartDate || new Date(),
            },
            { where: { id: newUnitId } }
          );
        }
      }
      

      // send sms after reset
      if (generatedPassword) {
        try {
          const smsUtil = createSingleSMSUtil({ token: process.env.GEEZSMS_TOKEN });
          const username = tenant.email || tenant.phoneNumber;
          const smsMessage =
            `Hello ${tenant.fullName},\n` +
            `Your tenant account password has been reset.\n` +
            `Username: ${username}\n` +
            `Password: ${generatedPassword}\n` +
            `Please log in: ${process.env.TENANT_PORTAL_URL}\n`;

          // Use the exact working format from createTenant
          await smsUtil.sendSingleSMS({
            phone: tenant.phoneNumber,
            msg: smsMessage,
            callback: process.env.GEEZSMS_WEBHOOK_URL,
          });

          // console.log(`📩 SMS sent to ${tenant.phoneNumber} successfully`);
        } catch (err) {
          console.error("SMS failed:", err.message);
        }
      }

      // ----------------------
      // Return updated tenant
      // ----------------------
      const updatedTenant = await Tenant.findByPk(tenant.id, {
        include: [
          { model: Unit, attributes: ["id", "unitNumber", "status", "vacatedDate", "rentedDate"] },
          { model: Floor, attributes: ["id", "floorNumber"] }
        ]
      });

      return res.status(200).json({
      ...updatedTenant.toJSON(),
      ...(generatedPassword && { newPassword: generatedPassword })
    });
    });
  } catch (error) {
    console.error("❌ Error updating tenant:", error);
    return res.status(500).json({ message: "Internal server error" });
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

    // ✅ Inclusive Lease Start Date Filter
    if (leaseStartDateFrom && leaseStartDateTo) {
      whereConditions.leaseStartDate = {
        [Op.gte]: moment(leaseStartDateFrom).startOf("day").toDate(),
        [Op.lte]: moment(leaseStartDateTo).endOf("day").toDate(),
      };
    }

    // ✅ Inclusive Lease End Date Filter
    if (leaseEndDateFrom && leaseEndDateTo) {
      whereConditions.leaseEndDate = {
        [Op.gte]: moment(leaseEndDateFrom).startOf("day").toDate(),
        [Op.lte]: moment(leaseEndDateTo).endOf("day").toDate(),
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
        {
          model: TenantVehicle,
          attributes: ["carPlate", "carName"],
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
        documentUrl: tenant.document
          ? `${BASE_URL}${tenant.document}`
          : null,
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
        {
          model: TenantVehicle,
          attributes: ["carPlate", "carName"],
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

    const leaseStartDate = moment(tenant.leaseStartDate).startOf("day");
    const leaseEndDate = moment(tenant.leaseEndDate).startOf("day");
    const currentDate = moment().startOf("day");

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

exports.getTenantsWithUnitAndFloor = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      attributes: ["id", "fullName"],
      include: [
        {
          model: Unit,
          attributes: ["id", "unitNumber"],
          include: [
            {
              model: Floor,
              attributes: ["id", "floorNumber"],
            },
          ],
        },
      ],
    });

    const response = tenants.map(t => ({
      tenantId: t.id,
      fullName: t.fullName,
      Floor: t.Unit?.Floor
        ? {
            floorId: t.Unit.Floor.id,
            floorNumber: t.Unit.Floor.floorNumber,
          }
        : null,
      Unit: t.Unit
        ? {
            unitId: t.Unit.id,
            unitNumber: t.Unit.unitNumber,
          }
        : null,
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching tenants with unit and floor:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

