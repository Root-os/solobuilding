const Setting = require("../models/setting");

// Get all settings
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving settings", error });
    }
};

// Get a specific setting by key
exports.getSettingByKey = async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { key: req.params.key } });
        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }
        res.status(200).json(setting);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving setting", error });
    }
};

// Create a new setting
exports.createSetting = async (req, res) => {
    try {
        const { key, value, description,unit } = req.body;
        
        // Check if setting already exists
        const existingSetting = await Setting.findOne({ where: { key } });
        if (existingSetting) {
            return res.status(400).json({ message: "Setting with this key already exists" });
        }

        const setting = await Setting.create({ key, value, description,unit});
        res.status(201).json(setting);
    } catch (error) {
        res.status(500).json({ message: "Error creating setting", error });
    }
};

// Update an existing setting
exports.updateSetting = async (req, res) => {
    try {
        const { value, description,unit,key } = req.body;
        const setting = await Setting.findOne({ where: { key: req.params.key } });

        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }

        setting.value = value || setting.value;
        setting.unit = unit || setting.unit;
        setting.key = key || setting.key;
        setting.description = description || setting.description;
        await setting.save();

        res.status(200).json(setting);
    } catch (error) {
        res.status(500).json({ message: "Error updating setting", error });
    }
};

// Delete a setting
exports.deleteSetting = async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { key: req.params.key } });

        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }

        await setting.destroy();
        res.status(200).json({ message: "Setting deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting setting", error });
    }
};
