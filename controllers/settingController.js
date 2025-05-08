const Setting = require("../models/setting");

// Create Setting
require('dotenv').config(); // Make sure you load environment variables

// Create Setting
exports.createSetting = async (req, res) => {
    try {
        const { 
            buildingName, 
            buildingAddress, 
            email, 
            phoneNumber, 
            postOfficeAddress,
            chargingCost,   // Add this
            parkingCost     // Add this
        } = req.body;

        let logoPath = null;
        let sealPath = null;

        if (req.files) {
            if (req.files.logos) {
                logoPath = `${process.env.BASE_URL}/uploads/setting/${req.files.logos[0].filename}`;
            }
            if (req.files.seal) {
                sealPath = `${process.env.BASE_URL}/uploads/setting/${req.files.seal[0].filename}`;
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
            chargingCost,   // Save this
            parkingCost     // Save this
        });

        const fullSetting = await Setting.findOne({ 
            where: { id: setting.id },
            attributes: ['id', 'buildingName', 'buildingAddress', 'email', 'phoneNumber', 
                        'postOfficeAddress', 'logos', 'seal', 'chargingCost', 'parkingCost', 
                        'createdAt', 'updatedAt']
        });
        console.log("BASE_URL:", process.env.BASE_URL);  // Log the value of BASE_URL

        res.status(201).json(fullSetting);
    } catch (error) {
        res.status(500).json({ message: "Error creating setting", error: error.message });
    }
};


// Update Setting
exports.updateSetting = async (req, res) => {
    try {
        const { 
            buildingName, 
            buildingAddress, 
            email, 
            phoneNumber, 
            postOfficeAddress,
            chargingCost,  // Add this
            parkingCost    // Add this
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
        }

        // Update fields
        setting.buildingName = buildingName || setting.buildingName;
        setting.buildingAddress = buildingAddress || setting.buildingAddress;
        setting.email = email || setting.email;
        setting.phoneNumber = phoneNumber || setting.phoneNumber;
        setting.postOfficeAddress = postOfficeAddress || setting.postOfficeAddress;
        setting.chargingCost = chargingCost || setting.chargingCost;  // Update this
        setting.parkingCost = parkingCost || setting.parkingCost;    // Update this

        await setting.save();

        const updatedSetting = await Setting.findOne({ 
            where: { id: setting.id },
            attributes: ['id', 'buildingName', 'buildingAddress', 'email', 'phoneNumber', 
                        'postOfficeAddress', 'logos', 'seal', 'chargingCost', 'parkingCost', 
                        'createdAt', 'updatedAt']
        });

        res.status(200).json(updatedSetting);
    } catch (error) {
        res.status(500).json({ message: "Error updating setting", error: error.message });
    }
};
// Get All Settings
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll({
            attributes: ['id', 'buildingName', 'buildingAddress', 'email', 'phoneNumber', 
                        'postOfficeAddress', 'logos', 'seal', 'chargingCost', 'parkingCost', 
                        'createdAt', 'updatedAt']
        });
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving settings", error: error.message });
    }
};

// Get Setting by ID
exports.getSettingById = async (req, res) => {
    try {
        const setting = await Setting.findOne({ 
            where: { id: req.params.id },
            attributes: ['id', 'buildingName', 'buildingAddress', 'email', 'phoneNumber', 
                        'postOfficeAddress', 'logos', 'seal', 'createdAt', 'updatedAt']
        });
        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }
        res.status(200).json(setting);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving setting", error: error.message });
    }
};

// Delete Setting
exports.deleteSetting = async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { id: req.params.id } });

        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }

        await setting.destroy();
        res.status(200).json({ message: "Setting deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting setting", error: error.message });
    }
};
