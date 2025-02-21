const TenantRentCollection = require('../models/tenantRentCollection');
const Tenant = require('../models/tenant');
const Floor = require('../models/floor');
const Unit = require('../models/unit');
const { Op } = require('sequelize');

// Create a new rent payment
exports.createRentPayment = async (req, res) => {
    try {
        const { tenantId, amountPaid, paymentDate, paymentMethod, paymentFrequency, nextDueDate, status } = req.body;

        // Convert paymentDate and nextDueDate to Date objects
        const paymentDateObj = new Date(paymentDate);
        const nextDueDateObj = new Date(nextDueDate);

        // Calculate the difference in total days
        const differenceInTime = paymentDateObj - nextDueDateObj;
        let totalDays = Math.abs(Math.ceil(differenceInTime / (1000 * 60 * 60 * 24))); // Convert milliseconds to days

        // Convert total days into months and remaining days
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;

        // Create a readable format: "1 month 3 days"
        let paidDays = "";
        if (months > 0) {
            paidDays += `${months} month${months > 1 ? 's' : ''} `;
        }
        if (days > 0) {
            paidDays += `${days} day${days > 1 ? 's' : ''}`;
        }
        paidDays = paidDays.trim(); // Remove extra spaces

        // Create rent payment record
        const rentPayment = await TenantRentCollection.create({
            tenantId,
            amountPaid,
            paymentDate,
            paymentMethod,
            paymentFrequency,
            nextDueDate,
            paidDays, // Insert readable format
            status
        });

        // Find the tenant and update their status and leaseEndDate
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        tenant.paymentStatus = "paid";
        tenant.leaseEndDate = nextDueDate;

        // Save the tenant with updated data
        await tenant.save();

        return res.status(201).json({
            message: 'Rent payment recorded successfully',
            rentPayment
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get all rent payments
exports.getAllRentPayments = async (req, res) => {
    try {
        const rentPayments = await TenantRentCollection.findAll({
            include: [
                {
                    model: Tenant,
                    attributes: ['fullName', 'email', 'phoneNumber'],
                    include: [
                        {
                            model: Unit,
                            attributes: ['unitNumber']
                        },
                        {
                            model: Floor,
                            attributes: ['floorNumber']
                        }
                    ]
                }
            ],
            order: [['paymentDate', 'DESC']]
        });

        res.status(200).json(rentPayments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching rent payments', error: error.message });
    }
};

// Get a single rent payment by ID
exports.getRentPaymentHistoryByTenantId = async (req, res) => {
    try {
        const { tenantId } = req.params; // Get tenantId from request params

        // Fetch tenant details (including unit and floor info)
        const tenant = await Tenant.findByPk(tenantId, {
            attributes: ['fullName', 'email'],
            include: [
                {
                    model: Unit,
                    attributes: ['unitNumber']
                },
                {
                    model: Floor,
                    attributes: ['floorNumber']
                }
            ]
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // Fetch all rent payments for the given tenantId, sorted by paymentDate (recent first)
        const rentPayments = await TenantRentCollection.findAll({
            where: { tenantId }, // Filter by tenantId
            order: [['paymentDate', 'DESC']] // Sort by paymentDate (recent first)
        });

        return res.status(200).json({
            tenant: {
                fullName: tenant.fullName,
                email: tenant.email,
                unitNumber: tenant.Unit?.unitNumber || null,
                floorNumber: tenant.Floor?.floorNumber || null
            },
            rentPayments
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching rent payment history', error: error.message });
    }
};



// Update a rent payment
exports.updateRentPayment = async (req, res) => {
    try {
        const { amountPaid,tenantId, paymentDate, paymentMethod, paymentFrequency, nextDueDate, status } = req.body;

        const rentPayment = await TenantRentCollection.findByPk(req.params.id);
        if (!rentPayment) {
            return res.status(404).json({ message: 'Rent payment not found' });
        }

        await rentPayment.update({ amountPaid,tenantId, paymentDate, paymentMethod, paymentFrequency, nextDueDate, status });

        res.status(200).json({ message: 'Rent payment updated successfully', rentPayment });
    } catch (error) {
        res.status(500).json({ message: 'Error updating rent payment', error });
    }
};

// Delete a rent payment
exports.deleteRentPayment = async (req, res) => {
    try {
        const rentPayment = await TenantRentCollection.findByPk(req.params.id);
        if (!rentPayment) {
            return res.status(404).json({ message: 'Rent payment not found' });
        }

        await rentPayment.destroy();
        res.status(200).json({ message: 'Rent payment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting rent payment', error });
    }
};

// Get rent payments for a specific tenant

// Get all due payments
exports.getDuePayments = async (req, res) => {
    try {
        const today = new Date();

        const duePayments = await TenantRentCollection.findAll({
            where: {  status: 'Pending' }
        });

        res.status(200).json(duePayments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching due payments', error });
    }
};

// Get all overdue payments
exports.getPaymentsByStatus = async (req, res) => {
    try {
        const { status } = req.params; // Extract status from params

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const payments = await TenantRentCollection.findAll({
            where: { status }
        });

        return res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments by status', error: error.message });
    }
};


exports.filterRentCollections = async (req, res) => {
    try {
      const { paymentDateFrom, paymentDateTo, nextDueDateFrom, nextDueDateTo, paymentFrequency, status } = req.body;
  
      let whereConditions = {};
  
      if (paymentDateFrom && paymentDateTo) {
        whereConditions.paymentDate = {
          [Op.between]: [paymentDateFrom, paymentDateTo],
        };
      }
  
      if (nextDueDateFrom && nextDueDateTo) {
        whereConditions.nextDueDate = {
          [Op.between]: [nextDueDateFrom, nextDueDateTo],
        };
      }
  
      if (paymentFrequency) {
        whereConditions.paymentFrequency = paymentFrequency;
      }
  
      if (status) {
        whereConditions.status = status;
      }
  
      const rentCollections = await TenantRentCollection.findAll({
        where: whereConditions,
        include: [{ model: Tenant, attributes: ['fullName'] }],
      });
  
      if (!rentCollections.length) {
        return res.status(404).json({ message: 'No rent collections found matching the filters' });
      }
  
      res.status(200).json(rentCollections);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rent collections', error: error.message });
    }
  };
