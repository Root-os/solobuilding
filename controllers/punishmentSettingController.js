const PunishmentSetting = require('../models/punshimentSetting');

exports.createPunishmentSetting = async (req, res) => {
  try {
    const exists = await PunishmentSetting.findOne();
    if (exists) {
      return res.status(400).json({
        message: "Punishment setting already exists",
      });
    }

    const { isEnabled, rules } = req.body;

    // Basic validation
    if (!rules || !Array.isArray(rules.rules)) {
      return res.status(400).json({ message: "Invalid rules format" });
    }

    const setting = await PunishmentSetting.create({
      isEnabled,
      rules,
    });

    res.status(201).json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPunishmentSetting = async (req, res) => {
  try {
    const setting = await PunishmentSetting.findOne();

    // Parse JSON if it came as string
    let rules = { rules: [] };
    if (setting?.rules) {
      rules = typeof setting.rules === "string" ? JSON.parse(setting.rules) : setting.rules;
    }

    const response = {
      exists: Boolean(setting),   // 🔹 NEW FLAG
      isEnabled: setting?.isEnabled ?? false,
      rules,
    };

    return res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updatePunishmentSetting = async (req, res) => {
  try {
    const setting = await PunishmentSetting.findOne();
    if (!setting) {
      return res.status(404).json({ message: "Punishment setting not found" });
    }

    const { isEnabled, rules } = req.body;

    if (rules) {
      if (!Array.isArray(rules.rules)) {
        return res.status(400).json({ message: "Invalid rules format" });
      }
      setting.rules = rules;
    }

    if (typeof isEnabled === "boolean") {
      setting.isEnabled = isEnabled;
    }

    await setting.save();

    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePunishmentSetting = async (req, res) => {
  try {
    const setting = await PunishmentSetting.findOne();
    if (!setting) {
      return res.status(404).json({ message: "Punishment setting not found" });
    }

    await setting.destroy();
    res.json({ message: "Punishment setting deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
