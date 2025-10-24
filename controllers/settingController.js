const Setting = require("../models/setting");
require("dotenv").config();

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
      ],
    });

    res.status(201).json(fullSetting);
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
    setting.punishmentPercentage = punishmentPercentage || setting.punishmentPercentage;

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

    res.status(200).json(updatedSetting);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating setting", error: error.message });
  }
};

exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    res.status(200).json(settings);
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
    res.status(200).json(setting);
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
