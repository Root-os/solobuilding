const TenantRentCollection = require("../models/tenantRentCollection");
const Tenant = require("../models/tenant");
const Floor = require("../models/floor");
const Unit = require("../models/unit");
const User = require("../models/user");
const Role = require("../models/role");
const PaymentType = require("../models/paymentType");
const PaymentRequest = require("../models/paymentRequests");
const { Op } = require("sequelize");
const { tenantRentCollectionSchema } = require("../helpers/schema");
const cron = require("node-cron");
const sendNotificationHelper = require("../helpers/sendAlert");
const createSingleSMSUtil = require("../utils/sendSingleSMSUtil");
const Setting = require("../models/setting");
const Punishment = require("../models/punishment")

//schedule a task to run every day at midnight (0 0 * * *)
cron.schedule("0 8 * * *", async () => {
  try {
    const today = new Date();
    console.log(`Current Date: ${today.toISOString()}`);

    // Calculate the dates 10 and 2 days from now
    const tenDaysBefore = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    const twoDaysBefore = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    console.log(`10 Days From Now: ${tenDaysBefore.toISOString()}`);
    console.log(`2 Days From Now: ${twoDaysBefore.toISOString()}`);

    // Find tenants whose nextDueDate is within 10 or 2 days
    const rentCollections = await TenantRentCollection.findAll({
      where: {
        nextDueDate: {
          [Op.in]: [tenDaysBefore, twoDaysBefore],
        },
      },
      include: {
        model: Tenant,
        attributes: ["fullName", "email", "phoneNumber"],
      },
    });

    // Log if no rent collections were found
    if (rentCollections.length === 0) {
      console.log("No rent collections found for the next 10 or 2 days.");
    }

    for (const rentCollection of rentCollections) {
      const tenant = rentCollection.Tenant; // Access the tenant information
      const remainingDays = Math.floor(
        (rentCollection.nextDueDate - today) / (1000 * 60 * 60 * 24)
      ); // Calculate remaining days

      console.log(`Checking Tenant: ${tenant.fullName}`);
      console.log(`Remaining Days for Rent Payment: ${remainingDays}`);

      if (remainingDays === 10 || remainingDays === 2) {
        console.log(
          `Notifying admins and tenant about rent due in ${remainingDays} days.`
        );

        // Send notifications to admins
        const admins = await User.findAll({ where: { role: "admin" } });
        if (admins.length === 0) {
          console.log("No admins found to send notifications.");
        }

        await Promise.all(
          admins.map((admin) => {
            const message = `Tenant ${tenant.fullName} has ${remainingDays} days left for the next rent payment.`;
            console.log(`Sending notification to admin: ${admin.id}`);
            return sendNotificationHelper({
              receiverId: admin.id,
              title: `Tenant Rent Due in ${remainingDays} Days`,
              body: message,
              type: "Rent Due Notification",
              receiver_type: "staff",
            });
          })
        );

        // Send notification to tenant
        console.log(
          `Sending rent payment due notification to tenant: ${tenant.fullName}`
        );
        await sendNotificationHelper({
          receiverId: tenant.id,
          title: `Your Rent Payment is Due in ${remainingDays} Days`,
          body: `Your next rent payment is due in ${remainingDays} days. Please ensure timely payment.`,
          type: "Rent Payment Due",
          receiver_type: "tenant",
        });
      }
    }

    console.log("Rent payment due notifications sent successfully.");
  } catch (error) {
    console.error(
      "Error while sending rent payment due notifications:",
      error.message
    );
  }
});

// Initialize SMS sender util
const { sendSingleSMS } = createSingleSMSUtil({
  token: process.env.GEEZSMS_TOKEN,
});


// Days to notify before lease ends
const NOTIFY_DAYS = [10, 5, 4, 3, 2, 1, 0];

cron.schedule("0 8 * * *", async () => {
  console.log("Running lease expiry & punishment notifier...");

  try {
    const today = new Date();

    // Get maximum days to look ahead
    const maxNotifyDay = Math.max(...NOTIFY_DAYS);
    const futureDate = new Date(today.getTime() + maxNotifyDay * 24 * 60 * 60 * 1000);

    // Get punishment percentage from settings (default to 20%)
    const settings = await Setting.findOne();
    const punishmentPercentage = settings ? parseFloat(settings.punishmentPercentage) : 0.5;

    // Find tenants whose lease ends between today and futureDate OR already expired
    const tenants = await Tenant.findAll({
      where: {
        leaseEndDate: {
          [Op.lte]: futureDate, 
        },
      },
    });

    if (tenants.length === 0) {
      console.log("No tenants with lease ending soon or overdue.");
      return;
    }

    // Fetch all admin users by roleId (assuming admin roleId is 1)
    const admins = await User.findAll({
      include: {
        model: Role,
        where: { name: "admin" },
      },
    });

    if (admins.length === 0) {
      console.log("No admins found to send notifications.");
      return;
    }

    for (const tenant of tenants) {
      function toDateOnly(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      const leaseEndDateOnly = toDateOnly(new Date(tenant.leaseEndDate));
      const todayDateOnly = toDateOnly(new Date());

      const diffDays = Math.floor(
        (leaseEndDateOnly - todayDateOnly) / (1000 * 60 * 60 * 24)
      );

      console.log(`diffDays for ${tenant.fullName}: ${diffDays}`);

      // --------------------------
      // 1) Lease expiry notifications
      // --------------------------
      if (NOTIFY_DAYS.includes(diffDays)) {
        const tenantMsg = `Dear ${tenant.fullName}, your lease ends in ${diffDays} day(s). your rent amount is ${tenant.amount}. pay before it ends or Contact management for renewal or move-out process.`;
        const adminMsg = `Lease for tenant ${tenant.fullName} ends in ${diffDays} day(s).`;

        if (tenant.phoneNumber) {
          try {
            await sendSingleSMS({ phone: tenant.phoneNumber, msg: tenantMsg });
            console.log(`SMS sent to tenant: ${tenant.fullName}`);
          } catch (err) {
            console.error(`Failed to send SMS to tenant ${tenant.fullName}:`, err.message);
          }
        }

        for (const admin of admins) {
          if (admin.phone) {
            try {
              await sendSingleSMS({ phone: admin.phone, msg: adminMsg });
              console.log(`SMS sent to admin: ${admin.id}`);
            } catch (err) {
              console.error(`Failed to send SMS to admin ${admin.id}:`, err.message);
            }
          }
        }
      }

      // --------------------------
      // 2) Payment request logic 
      // --------------------------
      if (diffDays === 10) {
        try {
          const paymentType = await PaymentType.findOne({
            where: { name: "Rent" },
          });
          if (!paymentType) {
            console.error("Payment type 'Rent' not found.");
            continue;
          }

          const monthly = "monthly"; // Assuming monthly payment type
          const leaseEnd = new Date(tenant.leaseEndDate);
          const level = "medium";

          await PaymentRequest.create({
            tenantId: tenant.id,
            message: "Final rent payment before lease expiry.",
            paymentTypeId: paymentType.id,
            level: level,
            amount: tenant.amount,
            dueDate: leaseEnd,
            repeatedFor: monthly,
          });

          const floor = await Floor.findByPk(tenant.floorId);
          const unit = await Unit.findByPk(tenant.unitId);

          const loginUrl = process.env.TENANT_PORTAL_URL;
          const paymentMsg = `Hi ${tenant.fullName}, your ${
            paymentType.name
          } is due by ${leaseEnd.toDateString()} for your room ( ${
            floor?.floorNumber
          }, Unit ${unit?.unitNumber}). Check your dashboard for details.`;

          await sendSingleSMS({
            phone: tenant.phoneNumber,
            msg: paymentMsg + `\nLogin here: ${loginUrl}`,
            callback: process.env.GEEZSMS_WEBHOOK_URL,
          });

          console.log(`Payment request created and SMS sent for tenant: ${tenant.fullName}`);
        } catch (err) {
          console.error(`Failed to create/send payment request for ${tenant.fullName}:`, err.message);
        }
      }

      // --------------------------
      // 3) Punishment notifications for overdue tenants
      // --------------------------

      if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);

        let punishmentAmount = 0;

        if (overdueDays >= 11 && overdueDays <= 15) {
          punishmentAmount = tenant.amount * 0.05; 
        } else if (overdueDays >= 16 && overdueDays <= 30) {
          punishmentAmount = tenant.amount * 0.10; 
        } else if (overdueDays > 30) {
          punishmentAmount = tenant.amount * 0.15; 
        }

        punishmentAmount = parseFloat(punishmentAmount.toFixed(2));

        if (punishmentAmount > 0) {
          const tenantMsg = `Dear ${tenant.fullName}, your lease expired ${overdueDays} day(s) ago. Today's punishment amount is ${punishmentAmount} ETB.`;
          const adminMsg = `Tenant ${tenant.fullName} is ${overdueDays} day(s) overdue. Today's punishment amount: ${punishmentAmount} ETB.`;

          // Store or update punishment record
          let punishment = await Punishment.findOne({
            where: { tenantId: tenant.id, status: "unpaid" },
          });

          if (punishment) {
            punishment.amount = punishmentAmount;
            punishment.description = `Overdue by ${overdueDays} day(s)`;
            await punishment.save();
            console.log(`Updated punishment for tenant ${tenant.fullName}`);
          } else {
            await Punishment.create({
              tenantId: tenant.id,
              amount: punishmentAmount,
              description: `Overdue by ${overdueDays} day(s)`,
              status: "unpaid",
            });
            console.log(`Created punishment for tenant ${tenant.fullName}`);
          }

          // Send SMS to tenant
          if (tenant.phoneNumber) {
            try {
              await sendSingleSMS({ phone: tenant.phoneNumber, msg: tenantMsg });
              console.log(`Punishment SMS sent to tenant: ${tenant.fullName}`);
            } catch (err) {
              console.error(`Failed to send punishment SMS to tenant ${tenant.fullName}:`, err.message);
            }
          }

          // Send SMS to admins
          for (const admin of admins) {
            if (admin.phone) {
              try {
                await sendSingleSMS({ phone: admin.phone, msg: adminMsg });
                console.log(`Punishment SMS sent to admin: ${admin.id}`);
              } catch (err) {
                console.error(`Failed to send punishment SMS to admin ${admin.id}:`, err.message);
              }
            }
          }
        }
      }

    }
    console.log("Lease expiry & punishment notifications complete.");
  } catch (error) {
    console.error("Lease expiry & punishment cron job error:", error.message);
  }
});

// Create a new rent payment
exports.createRentPayment = async (req, res) => {
  try {
    const { error } = tenantRentCollectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { tenantId, paymentDate, paymentMethod, nextDueDate, status, punishment = "0", isPaid = "false"} =
      req.body;

    // Find the tenant and update their status and leaseEndDate
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }
   // Safe parsing: always consistent, timezone-independent
    const toDateUTC = (dateStr) => {
      const [y, m, d] = dateStr.split("-");
      return new Date(Date.UTC(y, m - 1, d));
    };

    const paymentDateObj = toDateUTC(paymentDate);
    const nextDueDateObj = toDateUTC(nextDueDate);

    const rentAmount = tenant.amount;
    const dailyRate = rentAmount / 30; 

    // Calculate the difference in total days
    const differenceInTime = nextDueDateObj - paymentDateObj;

    const totalDays =
      Math.round(differenceInTime / (1000 * 60 * 60 * 24)) + 1;

    // Convert total days into months and remaining days
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    const amountPaid = dailyRate * totalDays;

    // Create a readable format: "1 month 3 days"
    let paidDays = "";
    if (months > 0) {
      paidDays += `${months} month${months > 1 ? "s" : ""} `;
    }
    if (days > 0) {
      paidDays += `${days} day${days > 1 ? "s" : ""}`;
    }
    paidDays = paidDays.trim(); // Remove extra spaces

    // Create rent payment record
    const previousPayment = await TenantRentCollection.findOne({
      where: { tenantId, status: "paid" },
      order: [["paymentDate", "DESC"]],
    });
    if (previousPayment) {
      // Check if the payment is for the same nextDueDate or if the payment date is earlier than the previous one
      if (previousPayment.nextDueDate === nextDueDateObj) {
        return res
          .status(400)
          .json({ message: "Tenant has already paid rent for this period" });
      }
      if (previousPayment.paymentDate >= paymentDateObj) {
        return res.status(400).json({
          message:
            "Payment date cannot be earlier or the same as the previous payment date",
        });
      }
      if (previousPayment.nextDueDate > paymentDateObj) {
        return res.status(400).json({
          message:
            "Rent payment date cannot be earlier than the last payment date",
        });
      }
    }

    const rentPayment = await TenantRentCollection.create({
      tenantId,
      paymentDate,
      paymentMethod,
      nextDueDate,
      paidDays,
      amountPaid,
      status,
      punishment,
      isPaid
    });

    if (status === "Paid") {
      tenant.paymentStatus = "paid";
      tenant.leaseEndDate = nextDueDate;
      await tenant.save();
    }

    if(status === "Paid" && isPaid === true && punishment > 0) {
      const punishmentRecord = await Punishment.findOne({
        where : {tenantId, status : "unpaid",
        }
      });

      if(punishmentRecord) {
        punishmentRecord.status = "paid";
        await punishmentRecord.save();
      }
    }

    return res.status(201).json({
      message: "Rent payment recorded successfully",
      rentPayment,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

// Get all rent payments
exports.getAllRentPayments = async (req, res) => {
  try {
    const rentPayments = await TenantRentCollection.findAll({
      include: [
        {
          model: Tenant,
          attributes: ["fullName", "email", "phoneNumber"],
          include: [
            {
              model: Unit,
              attributes: ["unitNumber"],
            },
            {
              model: Floor,
              attributes: ["floorNumber"],
            },
          ],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    res.status(200).json(rentPayments);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching rent payments", error: error.message });
  }
};

// GET /rentpayments/id/:id
exports.getRentPaymentById = async (req, res) => {
  const { id } = req.params;

  try {
    const rentPayment = await TenantRentCollection.findOne({
      where: { id },
      include: [
        {
          model: Tenant,
          attributes: ["fullName", "email", "phoneNumber"],
          include: [
            { model: Unit, attributes: ["unitNumber"] },
            { model: Floor, attributes: ["floorNumber"] },
          ],
        },
      ],
    });

    if (!rentPayment) {
      return res.status(404).json({ message: "Rent payment not found" });
    }

    // 👇 reshape response
    res.status(200).json({
      tenant: {
        fullName: rentPayment.Tenant.fullName,
        email: rentPayment.Tenant.email,
        phoneNumber: rentPayment.Tenant.phoneNumber,
        unitNumber: rentPayment.Tenant.Unit?.unitNumber,
        floorNumber: rentPayment.Tenant.Floor?.floorNumber,
      },
      rentPayments: [rentPayment], // array for table
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching rent payment" });
  }
};


// Get a single rent payment by ID
exports.getRentPaymentHistoryByTenantId = async (req, res) => {
  try {
    const phoneNumber = req.user.phone;

    const tenants = await Tenant.findAll({
      where: { phoneNumber },
      attributes: ["id"],
    });

    if (!tenants.length) {
      return res.status(404).json({ message: "Tenant not found." });
    }

    const tenantIds = tenants.map(t => t.id);

    const rentPayments = await TenantRentCollection.findAll({
      where: { tenantId: tenantIds }, 
      include: [
        {
          model: Tenant,
          attributes: ["fullName", "email", "phoneNumber"],
          include: [
            { model: Unit, attributes: ["id", "unitNumber"] },
            { model: Floor, attributes: ["floorNumber"] },
          ],
        },
      ],
      order: [["paymentDate", "DESC"]],
    });

    res.status(200).json(rentPayments);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching rent payment history",
      error: error.message,
    });
  }
};

// Update a rent payment
exports.updateRentPayment = async (req, res) => {
  try {
    const {
      tenantId,
      paymentDate,
      nextDueDate,
      paymentMethod,
      status,
      punishment,
      isPaid
    } = req.body;

    const rentPayment = await TenantRentCollection.findByPk(req.params.id);
    if (!rentPayment) {
      return res.status(404).json({ message: "Rent payment not found" });
    }

    // Fetch tenant to get tenantRent
    const tenant = await Tenant.findByPk(tenantId || rentPayment.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    const tenantRent = tenant.amount;

    // Determine actual dates
    const start = new Date(paymentDate || rentPayment.paymentDate);
    const end = new Date(nextDueDate || rentPayment.nextDueDate);

    // Calculate paidDays in days
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Optional: string format "X months Y days"
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    const paidDaysString = `${months} months ${days} days`;

    // Calculate amountPaid based on tenantRent
    const amountToPay = (tenantRent / 30) * diffDays;

    // Update rentPayment
    await rentPayment.update({
      tenantId: tenantId !== undefined ? tenantId : rentPayment.tenantId,
      paymentDate: paymentDate || rentPayment.paymentDate,
      nextDueDate: nextDueDate || rentPayment.nextDueDate,
      paymentMethod: paymentMethod || rentPayment.paymentMethod,
      status: status || rentPayment.status,
      punishment: punishment !== undefined ? punishment : rentPayment.punishment,
      isPaid: isPaid !== undefined ? isPaid : rentPayment.isPaid,
      paidDays: paidDaysString,
      amountPaid: parseFloat(amountToPay.toFixed(2))
    });

    // Three-condition logic for punishment and leaseEndDate
    // if (rentPayment.status === "Paid" && rentPayment.isPaid && rentPayment.punishment > 0) {
    //   const punishmentRecord = await Punishment.findOne({
    //     where: { tenantId: rentPayment.tenantId, status: "unpaid" },
    //   });

    //   if (punishmentRecord) {
    //     punishmentRecord.status = "paid";
    //     await punishmentRecord.save();
    //   }

    //   tenant.leaseEndDate = rentPayment.nextDueDate;
    //   await tenant.save();
    // }

    if (rentPayment.status === "Paid") {
  tenant.leaseEndDate = rentPayment.nextDueDate;
  await tenant.save();
}

    res.status(200).json({
      message: "Rent payment updated successfully",
      rentPayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating rent payment", error: error.message });
  }
};

// Delete a rent payment
exports.deleteRentPayment = async (req, res) => {
  try {
    const rentPayment = await TenantRentCollection.findByPk(req.params.id);
    if (!rentPayment) {
      return res.status(404).json({ message: "Rent payment not found" });
    }

    await rentPayment.destroy();
    res.status(200).json({ message: "Rent payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting rent payment", error });
  }
};


// Get all due payments
exports.getDuePayments = async (req, res) => {
  try {
    const today = new Date();

    const duePayments = await TenantRentCollection.findAll({
      where: { status: "Pending" },
    });

    res.status(200).json(duePayments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching due payments", error });
  }
};

// Get all overdue payments
exports.getPaymentsByStatus = async (req, res) => {
  try {
    const { status } = req.params; // Extract status from params

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const payments = await TenantRentCollection.findAll({
      where: { status },
    });

    return res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching payments by status",
      error: error.message,
    });
  }
};

exports.filterRentCollections = async (req, res) => {
  try {
    const {
      paymentDateFrom,
      paymentDateTo,
      nextDueDateFrom,
      nextDueDateTo,
      status,
    } = req.body;

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

    if (status) {
      whereConditions.status = status;
    }

    const rentCollections = await TenantRentCollection.findAll({
      where: whereConditions,
      include: [
        {
          model: Tenant,
          attributes: ["fullName", "email", "phoneNumber"],
          include: [
            {
              model: Unit,
              attributes: ["unitNumber"],
            },
            {
              model: Floor,
              attributes: ["floorNumber"],
            },
          ],
        },
      ],
    });
    if (!rentCollections.length) {
      return res
        .status(404)
        .json({ message: "No rent collections found matching the filters" });
    }
    res.status(200).json(rentCollections);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching rent collections",
      error: error.message,
    });
  }
};