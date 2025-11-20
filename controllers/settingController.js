const Setting = require("../models/setting");
require("dotenv").config();

// Helper to produce a fully-qualified URL for stored file paths
const formatUrl = (val, req) => {
  if (!val) return val;
  try {
    if (typeof val !== "string") return val;
    if (val.startsWith("http://") || val.startsWith("https://")) return val;
    // Remove accidental 'undefined' prefix
    const cleaned = val.replace(/^undefined\/?/, "");
    const base = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    if (cleaned.startsWith("/")) return `${base}${cleaned}`;
    return `${base}/${cleaned}`;
  } catch (err) {
    return val;
  }
};

exports.createSetting = async (req, res) => {
  try {
    const {
      buildingName,
      buildingAddress,
      email,
      phoneNumber,
      postOfficeAddress,
      chargingCost,
      parkingCost,
      punishmentPercentage,
      isGregorian,
    } = req.body;

    let logoPath = null;
    let sealPath = null;
    let qrImagePath = null;

    if (req.files) {
      if (req.files.logos) {
        logoPath = `${process.env.BASE_URL}/uploads/setting/${req.files.logos[0].filename}`;
      }
      if (req.files.seal) {
        sealPath = `${process.env.BASE_URL}/uploads/setting/${req.files.seal[0].filename}`;
      }
      if (req.files.qrImage) {
        qrImagePath = `${process.env.BASE_URL}/uploads/setting/${req.files.qrImage[0].filename}`;
      }
    }

    const existing = await Setting.findOne();
    if (existing) {
      return res.status(400).json({ message: "Setting already exists" });
    }

    const setting = await Setting.create({
      buildingName,
      buildingAddress,
      email,
      phoneNumber,
      postOfficeAddress,
      logos: logoPath,
      seal: sealPath,
      qrImage: qrImagePath,
      chargingCost,
      parkingCost,
      punishmentPercentage,
      isGregorian: isGregorian ?? true,
    });

    const fullSetting = await Setting.findOne({
      where: { id: setting.id },
      attributes: [
        "id",
        "buildingName",
        "buildingAddress",
        "email",
        "phoneNumber",
        "postOfficeAddress",
        "logos",
        "seal",
        "qrImage",
        "chargingCost",
        "parkingCost",
        "createdAt",
        "updatedAt",
        "punishmentPercentage",
        "isGregorian",
      ],
    });

    // Ensure returned file fields are full URLs
    const fullObj = fullSetting ? fullSetting.toJSON() : null;
    if (fullObj) {
      fullObj.logos = formatUrl(fullObj.logos, req);
      fullObj.seal = formatUrl(fullObj.seal, req);
      fullObj.qrImage = formatUrl(fullObj.qrImage, req);
    }

    res.status(201).json(fullObj);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating setting", error: error.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const {
      buildingName,
      buildingAddress,
      email,
      phoneNumber,
      postOfficeAddress,
      chargingCost,
      parkingCost,
      punishmentPercentage,
    } = req.body;

    const setting = await Setting.findOne({ where: { id: req.params.id } });

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    if (req.files) {
      if (req.files.logos) {
        setting.logos = `${process.env.BASE_URL}/uploads/setting/${req.files.logos[0].filename}`;
      }
      if (req.files.seal) {
        setting.seal = `${process.env.BASE_URL}/uploads/setting/${req.files.seal[0].filename}`;
      }
      if (req.files.qrImage) {
        setting.qrImage = `${process.env.BASE_URL}/uploads/setting/${req.files.qrImage[0].filename}`;
      }
    }

    setting.buildingName = buildingName || setting.buildingName;
    setting.buildingAddress = buildingAddress || setting.buildingAddress;
    setting.email = email || setting.email;
    setting.phoneNumber = phoneNumber || setting.phoneNumber;
    setting.postOfficeAddress = postOfficeAddress || setting.postOfficeAddress;
    setting.chargingCost = chargingCost || setting.chargingCost;
    setting.parkingCost = parkingCost || setting.parkingCost;
    setting.punishmentPercentage =
      punishmentPercentage || setting.punishmentPercentage;

    await setting.save();

    const updatedSetting = await Setting.findOne({
      where: { id: setting.id },
      attributes: [
        "id",
        "buildingName",
        "buildingAddress",
        "email",
        "phoneNumber",
        "postOfficeAddress",
        "logos",
        "seal",
        "qrImage",
        "chargingCost",
        "parkingCost",
        "punishmentPercentage",
        "createdAt",
        "updatedAt",
      ],
    });

    const updatedObj = updatedSetting ? updatedSetting.toJSON() : null;
    if (updatedObj) {
      updatedObj.logos = formatUrl(updatedObj.logos, req);
      updatedObj.seal = formatUrl(updatedObj.seal, req);
      updatedObj.qrImage = formatUrl(updatedObj.qrImage, req);
    }

    res.status(200).json(updatedObj);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating setting", error: error.message });
  }
};

exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const mapped = settings.map((s) => {
      const o = s.toJSON();
      o.logos = formatUrl(o.logos, req);
      o.seal = formatUrl(o.seal, req);
      o.qrImage = formatUrl(o.qrImage, req);
      return o;
    });
    res.status(200).json(mapped);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving settings", error: error.message });
  }
};

exports.getSettingById = async (req, res) => {
  try {
    const setting = await Setting.findOne({
      where: { id: req.params.id },
      attributes: [
        "id",
        "buildingName",
        "buildingAddress",
        "email",
        "phoneNumber",
        "postOfficeAddress",
        "logos",
        "seal",
        "qrImage",
        "chargingCost",
        "parkingCost",
        "createdAt",
        "updatedAt",
      ],
    });
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    const obj = setting.toJSON();
    obj.logos = formatUrl(obj.logos, req);
    obj.seal = formatUrl(obj.seal, req);
    obj.qrImage = formatUrl(obj.qrImage, req);
    res.status(200).json(obj);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving setting", error: error.message });
  }
};

exports.deleteSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { id: req.params.id } });

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    await setting.destroy();
    res.status(200).json({ message: "Setting deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting setting", error: error.message });
  }
};

exports.getCalendarSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne();
    if (!setting) return res.status(404).json({ message: "Setting not found" });
    res.json({ isGregorian: setting.isGregorian });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCalendarSetting = async (req, res) => {
  try {
    const { isGregorian } = req.body;
    let setting = await Setting.findOne();
    if (!setting) return res.status(404).json({ message: "Setting not found" });

    setting.isGregorian = isGregorian;
    await setting.save();

    res.json({ message: "Calendar updated successfully", isGregorian });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
