const ElectricCarCharging = require('../models/charging');
const Tenant = require('../models/tenant');
const Setting = require('../models/setting');
const { Op } = require('sequelize');

// 1. Create a new electric car charging session
exports.createChargingSession = async (req, res) => {
    try {
        const { carPlate, carName, isTenant, tenantId, driverName, driverPhone, chargingStartTime } = req.body;

        // If isTenant is true, ensure the driver details are from the Tenant record
        let driverInfo = {};
        if (isTenant) {
            // Check if tenant exists
            const tenant = await Tenant.findByPk(tenantId);
            if (!tenant) {
                return res.status(400).json({ message: 'Tenant not found.' });
            }
            driverInfo = {
                driverName: tenant.name,   // Assuming tenant's name is the driver's name
                driverPhone: tenant.phone  // Assuming tenant's phone is the driver's phone
            };
        } else {
            // If not tenant, use the provided driver details
            driverInfo = { driverName, driverPhone };
        }

        // Create a new charging session
        const newChargingSession = await ElectricCarCharging.create({
            carPlate,
            carName,
            isTenant,
            tenantId: isTenant ? tenantId : null,  // Only set tenantId if isTenant is true
            driverName: driverInfo.driverName,
            driverPhone: driverInfo.driverPhone,
            chargingStartTime,
            status: 'charging',  // Status is set to 'charging' when session starts
        });

        // Set price (could be dynamically calculated or set based on some logic, here assumed as a placeholder)
        newChargingSession.chargingCost = null; 
        await newChargingSession.save();

        res.status(201).json(newChargingSession);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating charging session.', error });
    }
};

// 2. Update the charging session (set price, charging end time, etc.)
        const moment = require('moment');  // Importing moment.js for time calculations

// 2. Update the charging session (set price, charging end time, etc.)
exports.updateChargingSession = async (req, res) => {
    try {
        const chargingSessionId = req.params.id;
        const { chargingEndTime, status } = req.body;

        // Find the charging session by its ID
        const chargingSession = await ElectricCarCharging.findByPk(chargingSessionId);
        if (!chargingSession) {
            return res.status(404).json({ message: 'Charging session not found.' });
        }

        // Ensure that chargingEndTime is provided
        if (!chargingEndTime) {
            return res.status(400).json({ message: 'Charging end time is required.' });
        }

        // Ensure that chargingStartTime exists
        if (!chargingSession.chargingStartTime) {
            return res.status(400).json({ message: 'Charging start time is missing.' });
        }

        // Fetch the default charging cost from the Setting model
        const setting = await Setting.findOne(); // Assuming there's only one record in the Settings table
        if (!setting) {
            return res.status(500).json({ message: 'Setting not found.' });
        }

        // Calculate the duration in minutes between chargingStartTime and chargingEndTime
        const startTime = moment(chargingSession.chargingStartTime);
        const endTime = moment(chargingEndTime);
        const durationInMinutes = endTime.diff(startTime, 'minutes');  // Difference in minutes

        // Ensure the duration is valid (end time must be later than start time)
        if (durationInMinutes <= 0) {
            return res.status(400).json({ message: 'End time must be later than start time.' });
        }

        // Check for valid status
        if (!['charging', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        // Calculate the charging cost using the default value from the Settings table
        const chargingCost = durationInMinutes * (setting.chargingCost || 10); // Default to 10 if no chargingCost is set

        // Update the charging session with the end time, calculated cost, and status
        const updatedChargingSession = await chargingSession.update({
            chargingEndTime,
            chargingCost,
            status,  // status can be 'completed' or 'charging'
        });

        res.status(200).json(updatedChargingSession);
    } catch (error) {
        console.error('Error updating charging session:', error);
        res.status(500).json({ message: 'Error updating charging session.', error: error.message });
    }
};

// 3. Get all charging sessions (with optional filters)
exports.getAllChargingSessions = async (req, res) => {
    try {
        const { carPlate, carName, driverName, status } = req.query;

        let filter = {};
        if (carPlate) filter.carPlate = { [Op.like]: `%${carPlate}%` };
        if (carName) filter.carName = { [Op.like]: `%${carName}%` };
        if (driverName) filter.driverName = { [Op.like]: `%${driverName}%` };
        if (status) filter.status = status;

        const chargingSessions = await ElectricCarCharging.findAll({
            where: filter,
        });

        if (chargingSessions.length === 0) {
            return res.status(404).json({ message: 'No charging sessions found matching the criteria.' });
        }

        res.status(200).json(chargingSessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving charging sessions.', error });
    }
};


// 6. Generate a report of all charging sessions (with optional filters)
exports.generateReport = async (req, res) => {
    try {
        const { carPlate, carName, driverName, status, dateRange } = req.body;

        // Initialize filters object
        let filter = {};

        // Apply filter by car plate
        if (carPlate) {
            filter.carPlate = { [Op.like]: `%${carPlate}%` };
        }

        // Apply filter by car name
        if (carName) {
            filter.carName = { [Op.like]: `%${carName}%` };
        }

        // Apply filter by driver name
        if (driverName) {
            filter.driverName = { [Op.like]: `%${driverName}%` };
        }

        // Apply filter by charging status
        if (status) {
            filter.status = status;
        }

        // Apply date range filter (if provided)
        if (dateRange) {
            const [startDate, endDate] = dateRange.split(',');
            filter.chargingStartTime = {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            };
        }

        // Fetch the charging sessions based on the filters
        const chargingSessions = await ElectricCarCharging.findAll({
            where: filter,
            include: [
                { model: Tenant, attributes: ['FullName'] }, // Include tenant details
            ],
        });

        // If no records found
        if (chargingSessions.length === 0) {
            return res.status(404).json({ message: 'No charging sessions found matching the criteria.' });
        }

        // Return the filtered charging sessions as a report
        res.status(200).json({
            message: 'Charging sessions report generated successfully.',
            data: chargingSessions,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating charging sessions report.', error });
    }
};

// 4. Get a specific charging session by ID
exports.getChargingSessionById = async (req, res) => {
    try {
        const chargingSessionId = req.params.id;

        const chargingSession = await ElectricCarCharging.findByPk(chargingSessionId);
        if (!chargingSession) {
            return res.status(404).json({ message: 'Charging session not found.' });
        }

        res.status(200).json(chargingSession);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving charging session.', error });
    }
};

// 5. Delete a charging session
exports.deleteChargingSession = async (req, res) => {
    try {
        const chargingSessionId = req.params.id;

        const chargingSession = await ElectricCarCharging.findByPk(chargingSessionId);
        if (!chargingSession) {
            return res.status(404).json({ message: 'Charging session not found.' });
        }

        // Delete the charging session
        await chargingSession.destroy();

        res.status(200).json({ message: 'Charging session deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting charging session.', error });
    }
};
