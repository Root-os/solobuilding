const ElectricCarCharging = require('../models/charging');
const Tenant = require('../models/tenant');
const Setting = require('../models/setting');
const { Op } = require('sequelize');
const moment = require('moment'); 

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
exports.updateChargingSession = async (req, res) => {
    try {
        const chargingSessionId = req.params.id;
        const { carPlate, carName, isTenant, tenantId, chargingEndTime, status } = req.body;

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
        const chargingCost = durationInMinutes * (setting.chargingCost || 10); 

        // Prepare the updated data
        const updatedData = {
            carPlate: carPlate || chargingSession.carPlate,
            carName: carName || chargingSession.carName,
            chargingEndTime,
            chargingCost: chargingCost.toFixed(2),  
            status, 
            tenantId: isTenant ? tenantId : null,  
            isTenant, 
            driverName: isTenant ? chargingSession.driverName : req.body.driverName || chargingSession.driverName, 
        };

        // Update the charging session with the new details
        const updatedChargingSession = await chargingSession.update(updatedData);

        // If isTenant is true, include tenant's fullName in the response
        if (updatedChargingSession.isTenant && updatedChargingSession.tenantId) {
            const tenant = await Tenant.findByPk(updatedChargingSession.tenantId, { attributes: ['fullName'] });
            updatedChargingSession.dataValues.tenant = tenant ? tenant.fullName : 'N/A';
        } else {
            updatedChargingSession.dataValues.tenant = 'N/A';
        }

        return res.status(200).json(updatedChargingSession);
    } catch (error) {
        console.error('Error updating charging session:', error);

        // Detailed error logging to catch the Sequelize validation issues
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(err => err.message);
            return res.status(400).json({
                message: 'Validation error',
                errors: validationErrors,
            });
        }

        return res.status(500).json({ message: 'Error updating charging session.', error: error.message });
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

        res.status(200).json(chargingSessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving charging sessions.', error });
    }
};

// 6. Generate a report of all charging sessions (with optional filters)
exports.generateReport = async (req, res) => {
  try {
    const { carPlate, carName, driverName, status, dateRange, tenantId } = req.body;

    let filter = {};
    let tenantWhere = {};

    if (carPlate) {
      filter.carPlate = { [Op.like]: `%${carPlate}%` };
    }

    if (carName) {
      filter.carName = { [Op.like]: `%${carName}%` };
    }

    if (driverName) {
      filter.driverName = { [Op.like]: `%${driverName}%` };
    }

    if (status) {
      filter.status = status;
    }

    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.chargingStartTime = {
        [Op.between]: [start, end],
      };
    }

    // 🔑 Resolve phoneNumber from tenantId
    if (tenantId) {
      const tenant = await Tenant.findByPk(tenantId, {
        attributes: ["phoneNumber"],
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      tenantWhere.phoneNumber = tenant.phoneNumber;
    }

    const chargingSessions = await ElectricCarCharging.findAll({
      where: filter,
      include: [
        {
          model: Tenant,
          attributes: ["id", "fullName", "phoneNumber"],
          where: tenantWhere, // 🔥 grouped by phoneNumber
        },
      ],
    });

    return res.status(200).json({ data: chargingSessions });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error generating charging sessions report.",
      error: error.message,
    });
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
