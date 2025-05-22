const TenantRentCollection = require('../models/tenantRentCollection');
const Tenant = require('../models/tenant');
const Floor = require('../models/floor');
const Unit = require('../models/unit');
const { Op } = require('sequelize');
const {tenantRentCollectionSchema} = require('../helpers/schema');
const cron = require('node-cron');
const sendNotificationHelper=require('../helpers/sendAlert');
//* * * * * to test evey minute
//schedule a task to run every day at midnight (0 0 * * *)
cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();
      console.log(`Current Date: ${today.toISOString()}`);
  
      // Calculate the dates 10 and 2 days from now
      const tenDaysBefore = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);  // 10 days from now
      const twoDaysBefore = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);   // 2 days from now
      console.log(`10 Days From Now: ${tenDaysBefore.toISOString()}`);
      console.log(`2 Days From Now: ${twoDaysBefore.toISOString()}`);
  
      // Find tenants whose nextDueDate is within 10 or 2 days
      const rentCollections = await TenantRentCollection.findAll({
        where: {
          nextDueDate: {
            [Op.in]: [tenDaysBefore, twoDaysBefore], // Match with 10 days or 2 days remaining
          },
        },
        include: {
          model: Tenant,
          attributes: ['fullName', 'email', 'phoneNumber'],
        },
      });
  
      // Log if no rent collections were found
      if (rentCollections.length === 0) {
        console.log('No rent collections found for the next 10 or 2 days.');
      }
  
      for (const rentCollection of rentCollections) {
        const tenant = rentCollection.Tenant;  // Access the tenant information
        const remainingDays = Math.floor((rentCollection.nextDueDate - today) / (1000 * 60 * 60 * 24));  // Calculate remaining days
  
        console.log(`Checking Tenant: ${tenant.fullName}`);
        console.log(`Remaining Days for Rent Payment: ${remainingDays}`);
  
        if (remainingDays === 10 || remainingDays === 2) {
          console.log(`Notifying admins and tenant about rent due in ${remainingDays} days.`);
  
          // Send notifications to admins
          const admins = await User.findAll({ where: { role: 'admin' } });
          if (admins.length === 0) {
            console.log('No admins found to send notifications.');
          }
  
          await Promise.all(
            admins.map((admin) => {
              const message = `Tenant ${tenant.fullName} has ${remainingDays} days left for the next rent payment.`;
              console.log(`Sending notification to admin: ${admin.id}`);
              return sendNotificationHelper({
                receiverId: admin.id,
                title: `Tenant Rent Due in ${remainingDays} Days`,
                body: message,
                type: 'Rent Due Notification',
                receiver_type: 'staff',
              });
            })
          );
  
          // Send notification to tenant
          console.log(`Sending rent payment due notification to tenant: ${tenant.fullName}`);
          await sendNotificationHelper({
            receiverId: tenant.id,
            title: `Your Rent Payment is Due in ${remainingDays} Days`,
            body: `Your next rent payment is due in ${remainingDays} days. Please ensure timely payment.`,
            type: 'Rent Payment Due',
            receiver_type: 'tenant',
          });
        }
      }
  
      console.log('Rent payment due notifications sent successfully.');
    } catch (error) {
      console.error('Error while sending rent payment due notifications:', error.message);
    }
  });
  
// Create a new rent payment
exports.createRentPayment = async (req, res) => {
    try {
const { error } = tenantRentCollectionSchema.validate(req.body);
if (error) {
    return res.status(400).json({ error: error.details[0].message });
}
        const { tenantId, paymentDate, paymentMethod, paymentFrequency, nextDueDate, status } = req.body;

// Find the tenant and update their status and leaseEndDate
const tenant = await Tenant.findByPk(tenantId);
if (!tenant) {
    return res.status(404).json({ message: 'Tenant not found' });
}
        // Convert paymentDate and nextDueDate to Date objects
        const paymentDateObj = new Date(paymentDate);
        const nextDueDateObj = new Date(nextDueDate);
         const rentAmount=tenant.amount;
         const dailyRate = rentAmount / 30; // assume 30-day month
         
        // Calculate the difference in total days
        const differenceInTime = paymentDateObj - nextDueDateObj;
        let totalDays = Math.abs(Math.ceil(differenceInTime / (1000 * 60 * 60 * 24))); // Convert milliseconds to days

        // Convert total days into months and remaining days
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;
        const amountPaid = dailyRate * totalDays;

        // Create a readable format: "1 month 3 days"
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
        const previousPayment = await TenantRentCollection.findOne({
            where: { tenantId, status: "paid" },
            order: [['paymentDate', 'DESC']]
        });
        if (previousPayment) {
            // Check if the payment is for the same nextDueDate or if the payment date is earlier than the previous one
            if (previousPayment.nextDueDate === nextDueDateObj) {
              return res.status(400).json({ message: 'Tenant has already paid rent for this period' });
            }
            if (previousPayment.paymentDate >= paymentDateObj) {
              return res.status(400).json({ message: 'Payment date cannot be earlier or the same as the previous payment date' });
            }
            if (previousPayment.nextDueDate > paymentDateObj) {
              return res.status(400).json({ message: 'Rent payment date cannot be earlier than the last payment date' });
            }
          }
        

        const rentPayment = await TenantRentCollection.create({
            tenantId,
            paymentDate,
            paymentMethod,
            paymentFrequency,
            nextDueDate,
            paidDays, 
            amountPaid,
            
            status
        });

        // Update tenant status and leaseEndDate
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
        include: [{
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
        }],        
      });
      if (!rentCollections.length) {
        return res.status(404).json({ message: 'No rent collections found matching the filters' });
      }
      res.status(200).json(rentCollections);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rent collections', error: error.message });
    }
  };
