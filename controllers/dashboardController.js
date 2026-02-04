const Notification = require("../models/notification");
const PaymentRequest = require("../models/paymentRequests");
const Complaint = require("../models/complaint");
const Unit = require("../models/unit");
const Tenant = require("../models/tenant");
const Floor = require("../models/floor");
const TenantRentCollection = require("../models/tenantRentCollection");
const TenantInventory = require("../models/tenantInventory");
const TenantVehicle = require("../models/tenantVehicle");
const TenantItem = require("../models/tenanItem");
const Parking= require("../models/parking");
const Expense= require("../models/expense");
const Inventory= require("../models/item");
const WithdrawalRequest= require("../models/withdrawal");
const Email= require("../models/email");
const Employee= require("../models/user");
const Salary= require("../models/SalaryPayment");
const Stockout= require("../models/stockout");
const TenantPayment= require("../models/tenantPayments");
const BillPayment= require("../models/billPayment");
const Letter = require("../models/letter");
const { Op,Sequelize } = require('sequelize');
const {Role} = require('../models');



exports.getDashboardStats = async (req, res) => {
  try {

    let dateWhere = {};
    let stockoutDateWhere = {};

    if (req.query.startDate && req.query.endDate) {
      dateWhere.createdAt = {
        [Op.between]: [
          new Date(req.query.startDate),
          new Date(req.query.endDate),
        ],
      };

      stockoutDateWhere.approvedAt = {
        [Op.between]: [
          new Date(req.query.startDate),
          new Date(req.query.endDate),
        ],
      };
    } else if (req.query.startDate) {
      dateWhere.createdAt = { [Op.gte]: new Date(req.query.startDate) };
      stockoutDateWhere.approvedAt = { [Op.gte]: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      dateWhere.createdAt = { [Op.lte]: new Date(req.query.endDate) };
      stockoutDateWhere.approvedAt = { [Op.lte]: new Date(req.query.endDate) };
    }

    // =========================
    // PARALLEL COUNTS
    // =========================
    const [
      // Notifications
      totalNotifications,
      unreadNotifications,
      readNotifications,

      // Payments Request
      totalPaymentsRequest,
      pendingPaymentsRequest,
      approvedPaymentsRequest,

      // Complaints
      totalComplaints,
      inProgressComplaints,
      resolvedComplaints,
      pendingComplaints,

      // Units (STATE)
      totalUnits,
      availableUnits,
      occupiedUnits,
      underMaintenanceUnits,

      // Floors (STATE)
      totalFloors,
      activeFloors,
      inactiveFloors,
      underMaintenanceFloors,

      // Tenants (STATE)
      totalTenants,
      activeTenants,
      inactiveTenants,

      // Vehicles
      totalVehicles,

      // Inventories
      totalInventory,
      moveInInventories,
      moveOutInventories,

      // Expenses
      totalExpenses,

      // Inventory Items
      totalItems,
      purchasedItems,
      existingItems,
      alertItems,

      // Withdrawals
      totalWithdrawals,
      pendingWithdrawals,
      approvedWithdrawals,
      rejectedWithdrawals,
      

      // Emails
      totalEmails,
      sentEmails,

      // Employees
      totalEmployees,

      // Salaries
      totalSalaries,
      pendingSalaries,
      paidSalaries,

      // Stockouts
      totalStockouts,
      pendingStockouts,
      approvedStockouts,
      rejectedStockouts,

      // Tenant Payments
      totalTenantPayments,
      dueTenantPayments,
      paidTenantPayments,
      overdueTenantPayments,

      // Bill Payments
      totalBillPayments,
      pendingBillPayments,
      paidBillPayments,
      overdueBillPayments,

      // Rent Collections
      totalRentCollections,
      paidRentCollections,
      pendingRentCollections,
      overdueRentCollections,

        // Parking
      // totalParking,
      // onParking,
      // readyToOut,
      // completedParking,
    ] = await Promise.all([
      // Notifications
      Notification.count({ where: dateWhere }),
      Notification.count({ where: { isRead: false, ...dateWhere } }),
      Notification.count({ where: { isRead: true, ...dateWhere } }),

      // Payments Request
      PaymentRequest.count({ where: dateWhere }),
      PaymentRequest.count({ where: { status: "pending", ...dateWhere } }),
      PaymentRequest.count({ where: { status: "approved", ...dateWhere } }),

      // Complaints
      Complaint.count({ where: dateWhere }),
      Complaint.count({ where: { status: "in_progress", ...dateWhere } }),
      Complaint.count({ where: { status: "resolved", ...dateWhere } }),
      Complaint.count({ where: { status: "pending", ...dateWhere } }),

      // Units (NO DATE FILTER)
      Unit.count(),
      Unit.count({ where: { status: "available" } }),
      Unit.count({ where: { status: "occupied" } }),
      Unit.count({ where: { status: "under_maintenance" } }),

      // Floors (NO DATE FILTER)
      Floor.count(),
      Floor.count({ where: { status: "active" } }),
      Floor.count({ where: { status: "inactive" } }),
      Floor.count({ where: { status: "under_maintenance" } }),

      // Tenants (NO DATE FILTER)
      Tenant.count(),
      Tenant.count({ where: { status: "active" } }),
      Tenant.count({ where: { status: "inactive" } }),

      // Vehicles
      TenantVehicle.count(),

      // Inventories
      TenantInventory.count(),
      TenantInventory.count({ where: { type: "move-in" } }),
      TenantInventory.count({ where: { type: "move-out" } }),


      // Expenses
      Expense.count({ where: dateWhere }),

      // Inventory
      Inventory.count(),
      Inventory.count({ where: { itemType: "Purchase" } }),
      Inventory.count({ where: { itemType: "Existing" } }),
      Inventory.count({
        where: {
          itemAmount: {
            [Op.lte]: Sequelize.col("min_amount"),
          },
        },
      }),

      // Withdrawals
      WithdrawalRequest.count({ where: dateWhere }),
      WithdrawalRequest.count({ where: { status: "pending", ...dateWhere } }),
      WithdrawalRequest.count({ where: { status: "approved", ...dateWhere } }),
      WithdrawalRequest.count({ where: { status: "rejected", ...dateWhere } }),
    

      // Emails
      Email.count({ where: dateWhere }),
      Email.count({ where: { status: "sent", ...dateWhere } }),

      // Employees
      Employee.count({
        include: [{ model: Role, where: { name: "employee" } }],
      }),

      // Salaries
      Salary.count({ where: dateWhere }),
      Salary.count({ where: { status: "pending", ...dateWhere } }),
      Salary.count({ where: { status: "paid", ...dateWhere } }),

      // Stockouts
      Stockout.count({ where: stockoutDateWhere }),
      Stockout.count({ where: { status: "pending", ...stockoutDateWhere } }),
      Stockout.count({ where: { status: "approved", ...stockoutDateWhere } }),
      Stockout.count({ where: { status: "rejected", ...stockoutDateWhere } }),

      // Tenant Payments
      TenantPayment.count({ where: dateWhere }),
      TenantPayment.count({ where: { status: "due", ...dateWhere } }),
      TenantPayment.count({ where: { status: "paid", ...dateWhere } }),
      TenantPayment.count({ where: { status: "overdue", ...dateWhere } }),

      // Bill Payments
      BillPayment.count({ where: dateWhere }),
      BillPayment.count({ where: { status: "pending", ...dateWhere } }),
      BillPayment.count({ where: { status: "paid", ...dateWhere } }),
      BillPayment.count({ where: { status: "overdue", ...dateWhere } }),

      // Rent Collections
      TenantRentCollection.count({ where: dateWhere }),
      TenantRentCollection.count({ where: { status: "Paid", ...dateWhere } }),
      TenantRentCollection.count({ where: { status: "Pending", ...dateWhere } }),
      TenantRentCollection.count({ where: { status: "Overdue", ...dateWhere } }),

            // Parking
      // Parking.count({ where: dateWhere }),
      // Parking.count({ where: { status: "onparking", ...dateWhere } }),
      // Parking.count({ where: { status: "ready to out", ...dateWhere } }),
      // Parking.count({ where: { status: "completed", ...dateWhere } }),
    ]);

    // =========================
    // RESPONSE
    // =========================
    res.json({
      notifications: { totalNotifications, unreadNotifications, readNotifications },
      paymentsRequest: { totalPaymentsRequest, pendingPaymentsRequest, approvedPaymentsRequest },
      complaints: { totalComplaints, inProgressComplaints, resolvedComplaints, pendingComplaints },
      units: { totalUnits, availableUnits, occupiedUnits, underMaintenanceUnits },
      floors: { totalFloors, activeFloors, inactiveFloors, underMaintenanceFloors },
      tenants: { totalTenants, activeTenants, inactiveTenants },
      tenantVehicles: { totalVehicles },
      tenantInventories: { totalInventory, moveInInventories, moveOutInventories },
      expenses: { totalExpenses },
      items: { totalItems, purchasedItems, existingItems, alertItems },
      withdrawals: { totalWithdrawals, pendingWithdrawals, approvedWithdrawals, rejectedWithdrawals },
      emails: { totalEmails, sentEmails },
      employees: { totalEmployees },
      salaries: { totalSalaries, pendingSalaries, paidSalaries },
      stockouts: { totalStockouts, pendingStockouts, approvedStockouts, rejectedStockouts },
      tenantPayments: { totalTenantPayments, dueTenantPayments, paidTenantPayments, overdueTenantPayments },
      billPayments: { totalBillPayments, pendingBillPayments, paidBillPayments, overdueBillPayments },
      rentCollections: { totalRentCollections, paidRentCollections, pendingRentCollections, overdueRentCollections },
        // parking: { totalParking, onParking, readyToOut, completedParking },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getTenantDashboardStats = async (req, res) => {
  try {
    const tenantPhone = req.user.phone; // from JWT

    if (!tenantPhone) {
      return res.status(400).json({ error: 'Tenant phone number is missing' });
    }

    // Optional date filter
    const dateWhere = {};
    if (req.query.startDate && req.query.endDate) {
      dateWhere.createdAt = {
        [Op.between]: [
          new Date(req.query.startDate),
          new Date(req.query.endDate),
        ],
      };
    } else if (req.query.startDate) {
      dateWhere.createdAt = { [Op.gte]: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      dateWhere.createdAt = { [Op.lte]: new Date(req.query.endDate) };
    }

    // 1️⃣ Get all tenant rows for this phone number
    const tenants = await Tenant.findAll({
      where: { phoneNumber: tenantPhone },
      include: [
        {
          model: Unit,
          attributes: ['id', 'unitNumber'],
          include: [
            {
              model: Floor,
              attributes: ['floorNumber'],
            },
          ],
        },
      ],
    });

    if (!tenants.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantIds = tenants.map(t => t.id);

    // 2️⃣ Lite list of units occupied
    const unitsOccupied = tenants.map(t => ({
      tenantId: t.id,
      unitId: t.Unit?.id || null,
      unitNumber: t.Unit?.unitNumber || null,
      floorNumber: t.Unit?.Floor?.floorNumber || null,
    }));

    // 3️⃣ Tenant Inventory summary by type (move-in / move-out)
    const [moveInItems, moveOutItems] = await Promise.all([
      TenantItem.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('TenantItem.id')), 'totalItems'],
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        ],
        include: [
          {
            model: TenantInventory,
            attributes: [],
            where: { tenantId: tenantIds, type: 'move-in' },
          },
        ],
        raw: true,
      }),
      TenantItem.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('TenantItem.id')), 'totalItems'],
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
        ],
        include: [
          {
            model: TenantInventory,
            attributes: [],
            where: { tenantId: tenantIds, type: 'move-out' },
          },
        ],
        raw: true,
      }),
    ]);

    // 4️⃣ Dashboard counts (other tables)
    const [
      totalNotifications,
      unreadNotifications,

      totalPaymentsRequest,
      pendingPaymentsRequest,
      completedPaymentsRequest,

      totalComplaints,
      inProgressComplaints,
      resolvedComplaints,

      totalLetters,
      sentLetters,
      receivedLetters,
      rejectedLetters,

      totalTenantPayments,
      pendingTenantPayments,
      paidTenantPayments,
      overdueTenantPayments,

      totalTenantRentCollection,
      pendingTenantRentCollection,
      paidTenantRentCollection,
      overdueTenantRentCollection,
    ] = await Promise.all([
      Notification.count({ where: { receiver_id: tenantIds, receiver_type: 'tenant', ...dateWhere } }),
      Notification.count({ where: { receiver_id: tenantIds, receiver_type: 'tenant', isRead: false, ...dateWhere } }),

      PaymentRequest.count({ where: { tenantId: tenantIds, ...dateWhere } }),
      PaymentRequest.count({ where: { tenantId: tenantIds, status: 'pending', ...dateWhere } }),
      PaymentRequest.count({ where: { tenantId: tenantIds, status: 'approved', ...dateWhere } }),

      Complaint.count({ where: { tenantId: tenantIds, ...dateWhere } }),
      Complaint.count({ where: { tenantId: tenantIds, status: 'in_progress', ...dateWhere } }),
      Complaint.count({ where: { tenantId: tenantIds, status: 'resolved', ...dateWhere } }),

      Letter.count({ where: { tenantId: tenantIds, ...dateWhere } }),
      Letter.count({ where: { tenantId: tenantIds, status: 'Sent', ...dateWhere } }),
      Letter.count({ where: { tenantId: tenantIds, status: 'Recived', ...dateWhere } }),
      Letter.count({ where: { tenantId: tenantIds, status: 'Rejected', ...dateWhere } }),

      TenantPayment.count({ where: { tenantId: tenantIds, ...dateWhere } }),
      TenantPayment.count({ where: { tenantId: tenantIds, status: 'due', ...dateWhere } }),
      TenantPayment.count({ where: { tenantId: tenantIds, status: 'paid', ...dateWhere } }),
      TenantPayment.count({ where: { tenantId: tenantIds, status: 'overdue', ...dateWhere } }),

      TenantRentCollection.count({ where: { tenantId: { [Op.in]: tenantIds }, ...dateWhere } }),
      TenantRentCollection.count({ where: { tenantId: { [Op.in]: tenantIds }, status: 'Pending', ...dateWhere } }),
      TenantRentCollection.count({ where: { tenantId: { [Op.in]: tenantIds }, status: 'Paid', ...dateWhere } }),
      TenantRentCollection.count({ where: { tenantId: { [Op.in]: tenantIds }, status: 'Overdue', ...dateWhere } }),
    ]);

    // 5️⃣ Final response
    res.json({
      unitsOccupied,

      notifications: {
        totalNotifications,
        unreadNotifications,
      },

      letters: {
        totalLetters,
        sentLetters,
        receivedLetters,
        rejectedLetters,
      },

      paymentsRequest: {
        totalPaymentsRequest,
        pendingPaymentsRequest,
        completedPaymentsRequest,
      },

      complaints: {
        totalComplaints,
        inProgressComplaints,
        resolvedComplaints,
      },

      tenantInventories: {
        moveIn: moveInItems[0] || { totalItems: 0, totalQuantity: 0 },
        moveOut: moveOutItems[0] || { totalItems: 0, totalQuantity: 0 },
      },

      tenantPayments: {
        totalTenantPayments,
        pendingTenantPayments,
        paidTenantPayments,
        overdueTenantPayments,
      },

      tenantRentCollection: {
        totalTenantRentCollection,
        pendingTenantRentCollection,
        paidTenantRentCollection,
        overdueTenantRentCollection,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getEmployeeDashboardStats = async (req, res) => {
  try {
    console.log("Authenticated User:", req.user);

    const userId = req.user.id;

    // Verify employee role
    const employee = await Employee.findOne({
      where: { id: userId },
      include: [
        {
          model: Role,
          where: { name: { [Op.notIn]: ['admin', 'tenant'] } }
        }
      ]
    });

    if (!employee) {
      return res.status(403).json({ message: "Access denied. Not an employee." });
    }

    // Gather dashboard data (notifications, stockouts, salaries)
    const [
      totalNotifications,
      unreadNotifications,

      totalStockouts,
      pendingStockouts,
      approvedStockouts,

      totalSalaries,
      pendingSalaries,
      paidSalaries
    ] = await Promise.all([
      Notification.count({ where: { receiver_id: userId, receiver_type: "staff" } }),
      Notification.count({ where: { receiver_id: userId, isRead: false, receiver_type: "staff" } }),

      Stockout.count({ where: { requestedBy: userId } }),
      Stockout.count({ where: { requestedBy: userId, status: "pending" } }),
      Stockout.count({ where: { requestedBy: userId, status: "approved" } }),

      Salary.count({ where: { employeeId: userId } }),
      Salary.count({ where: { employeeId: userId, status: "pending" } }),
      Salary.count({ where: { employeeId: userId, status: "paid" } })
    ]);

    // Return response
    res.json({
      notifications: { totalNotifications, unreadNotifications },
      stockouts: { totalStockouts, pendingStockouts, approvedStockouts },
      salaries: { totalSalaries, pendingSalaries, paidSalaries }
    });

  } catch (error) {
    console.error("Error in getEmployeeDashboardStats:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

