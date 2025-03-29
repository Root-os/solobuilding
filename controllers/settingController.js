const Setting = require("../models/setting");

// Create Setting
exports.createSetting = async (req, res) => {
    try {
        const { 
            buildingName, 
            buildingAddress, 
            email, 
            phoneNumber, 
            postOfficeAddress 
        } = req.body;

        // Handle file uploads for logos and seal
        let logoPath = null;
        let sealPath = null;

        if (req.files) {
            if (req.files.logos) {
                logoPath = req.files.logos[0].path;
            }
            if (req.files.seal) {
                sealPath = req.files.seal[0].path;
            }
        }

        const setting = await Setting.create({
            buildingName,
            buildingAddress,
            email,
            phoneNumber,
            postOfficeAddress,
            logos: logoPath,
            seal: sealPath
        });

        const fullSetting = await Setting.findOne({ 
            where: { id: setting.id },
            attributes: ['id', 'buildingName', 'buildingAddress', 'email', 'phoneNumber', 
                        'postOfficeAddress', 'logos', 'seal', 'createdAt', 'updatedAt']
        });

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
            postOfficeAddress 
        } = req.body;

        const setting = await Setting.findOne({ where: { id: req.params.id } });

        if (!setting) {
            return res.status(404).json({ message: "Setting not found" });
        }

        // Handle file uploads for logos and seal
        if (req.files) {
            if (req.files.logos) {
                setting.logos = req.files.logos[0].path;
            }
            if (req.files.seal) {
                setting.seal = req.files.seal[0].path;
            }
        }

        // Update only provided fields, keep existing values for unspecified fields
        setting.buildingName = buildingName !== undefined ? buildingName : setting.buildingName;
        setting.buildingAddress = buildingAddress !== undefined ? buildingAddress : setting.buildingAddress;
        setting.email = email !== undefined ? email : setting.email;
        setting.phoneNumber = phoneNumber !== undefined ? phoneNumber : setting.phoneNumber;
        setting.postOfficeAddress = postOfficeAddress !== undefined ? postOfficeAddress : setting.postOfficeAddress;

        await setting.save();

        const updatedSetting = await Setting.findOne({ 
            where: { id: setting.id },
            attributes: ['id', 'buildingName', 'buildingAddress', 'email', 'phoneNumber', 
                        'postOfficeAddress', 'logos', 'seal', 'createdAt', 'updatedAt']
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
                        'postOfficeAddress', 'logos', 'seal', 'createdAt', 'updatedAt']
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