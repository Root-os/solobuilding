const  Tenant  = require("../models/tenant");
const  Parking  = require("../models/parking");
const { Op } = require("sequelize");
const Setting = require("../models/setting");
const moment = require("moment");
const {parkingSchema}=require("../helpers/schema");


// Update parking record - handling partial updates
exports.updateParking = async (req, res) => {
    try {
        const parkingId = req.params.id;
        const { carPlate, carName, driverName, driverPhone, tenantId, timeIn, timeOut, isTenant, status } = req.body;

        // Find the parking record
        const parking = await Parking.findByPk(parkingId);
        if (!parking) {
            return res.status(404).json({ message: "Parking record not found" });
        }

        // Fetch the default parking cost from the Setting model
        const setting = await Setting.findOne(); // Assuming there's only one record in the Settings table
        if (!setting) {
            return res.status(500).json({ message: 'Setting not found.' });
        }

        // Get the price per hour from the setting, default to 10 if not set
        const pricePerHour = setting.parkingCost || 10; // Default to 10 if no parkingCost is set

        let calculatedPrice = parking.price; // Default price remains unchanged
        if (timeOut) {
            const timeInDate = moment(parking.timeIn);
            const timeOutDate = moment(timeOut);

            if (timeOutDate.isAfter(timeInDate)) {
                // Calculate total minutes parked
                const totalMinutes = timeOutDate.diff(timeInDate, 'minutes'); // Duration in minutes
                calculatedPrice = (totalMinutes * (pricePerHour / 60)).toFixed(2); // Price per min = dynamic price / 60
            } else {
                return res.status(400).json({ message: "Invalid timeOut. It must be after timeIn." });
            }
        }

        // Update the parking record with new information
        const updatedParking = await parking.update({
            carPlate: carPlate || parking.carPlate,
            carName: carName || parking.carName,
            driverName: driverName || parking.driverName,
            driverPhone: driverPhone || parking.driverPhone,
            tenantId: tenantId || parking.tenantId,
            timeIn: timeIn || parking.timeIn,
            timeOut: timeOut || parking.timeOut,
            isTenant: isTenant !== undefined ? isTenant : parking.isTenant,
            status: status || parking.status,
            price: calculatedPrice, // Updated price based on duration
        });

        return res.status(200).json(updatedParking);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error updating parking", error });
    }
};

// Get parking records by status
exports.getParkingsByStatus = async (req, res) => {
    try {
        const status = req.params.status;  // Pass status as a parameter

        // Retrieve parkings filtered by status
        const parkings = await Parking.findAll({
            where: {
                status: status
            },
            include: [{
                model: Tenant,
                attributes: ['id', 'fullName', 'email', 'phoneNumber'],
            }]
        });

        return res.status(200).json(parkings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Add parking record (adjusted to handle tenant information)
exports.addParking = async (req, res) => {
    const{error}=parkingSchema.validate(req.body);
    if(error){
        return res.status(400).json({error:error.details[0].message});
    }
    try {
        const { carPlate, carName, driverName, driverPhone, tenantId, timeIn, timeOut, isTenant, status } = req.body;

        // If tenant exists, we don't need to input tenant information
        let tenantInfo = null;
        if (isTenant) {
            const tenant = await Tenant.findByPk(tenantId);
            if (!tenant) {
                return res.status(400).json({ message: "Tenant not found" });
            }
            tenantInfo = tenant;
        }

        // Create new parking record
        const parking = await Parking.create({
            carPlate,
            carName,
            driverName,
            driverPhone,
            tenantId: tenantInfo ? tenantInfo.id : tenantId,
            timeIn,
            timeOut:timeOut || null, // Default timeOut is null
            isTenant,
            status: 'parkingcomplete' || 'onparking' 
        });

        return res.status(201).json(parking);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error });
    }
};
exports.getAllParkings = async (req, res) => {
    try {
        
        const parkings = await Parking.findAll({
            include: [{ model: Tenant }]  // Include Tenant only if istennat is true
        });

        return res.status(200).json(parkings);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching parkings", error: error.message });
    }
};

exports.deleteParking = async (req, res) => {
    try {
        const parking = await Parking.findByPk(req.params.id);
        if (!parking) {
            return res.status(404).json({ message: "Parking record not found" });
        }

        await parking.destroy();
        return res.status(200).json({ message: "Parking record deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting parking record", error: error.message });
    }
};


exports.filterParking = async (req, res) => {
    try {
        const { carPlate, carName, driverName, status, timeIn, timeOut, tenantId, isTenant } = req.query;

        // Construct filter criteria
        let filter = {};

        if (carPlate) filter.carPlate = { [Op.like]: `%${carPlate}%` };
        if (carName) filter.carName = { [Op.like]: `%${carName}%` };
        if (driverName) filter.driverName = { [Op.like]: `%${driverName}%` };
        if (status) filter.status = status;
        if (tenantId) filter.tenantId = tenantId;
        if (isTenant !== undefined) filter.isTenant = isTenant === "true"; // Convert string "true"/"false" to boolean

        // Handling time filters
        if (timeIn) filter.timeIn = { [Op.gte]: new Date(timeIn) }; // Filter by timeIn (greater than or equal to the provided time)
        if (timeOut) filter.timeOut = { [Op.lte]: new Date(timeOut) }; // Filter by timeOut (less than or equal to the provided time)

        // Find parkings with filters
        const parkings = await Parking.findAll({
            where: filter,
            include: [
                {
                    model: Tenant,
                    required: false,  // Optional if you want to join the tenant data
                    attributes: ['id', 'fullName']  // You can adjust the fields you want to return
                }
            ]
        });

        // Check if parkings were found
        if (parkings.length === 0) {
            return res.status(404).json({ message: "No parking records found matching your criteria." });
        }

        res.status(200).json(parkings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving parking records.", error });
    }
};