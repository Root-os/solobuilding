const Notification = require("../models/notification");
const PaymentRequest = require("../models/paymentRequests");
const Complaint = require("../models/complaint");
const Unit = require("../models/unit");
const Tenant = require("../models/tenant");
const Floor = require("../models/floor");
const TenantRentCollection = require("../models/tenantRentCollection");
const TenantInventory = require("../models/tenantInventory");
const TenantVehicle = require("../models/tenantVehicle");
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
const { Op,Sequelize } = require('sequelize');
const {Role} = require('../models');



exports.getDashboardStats = async (req, res) => {
  try {
    // =========================
    // DATE FILTER (ONLY FOR EVENTS)
    // =========================
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

      // Parking
      totalParking,
      onParking,
      readyToOut,
      completedParking,

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
      processedWithdrawals,

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

      // Parking
      Parking.count({ where: dateWhere }),
      Parking.count({ where: { status: "onparking", ...dateWhere } }),
      Parking.count({ where: { status: "ready to out", ...dateWhere } }),
      Parking.count({ where: { status: "completed", ...dateWhere } }),

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
      WithdrawalRequest.count({ where: { status: "in_progress", ...dateWhere } }),

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
      parking: { totalParking, onParking, readyToOut, completedParking },
      expenses: { totalExpenses },
      items: { totalItems, purchasedItems, existingItems, alertItems },
      withdrawals: { totalWithdrawals, pendingWithdrawals, approvedWithdrawals, rejectedWithdrawals, processedWithdrawals },
      emails: { totalEmails, sentEmails },
      employees: { totalEmployees },
      salaries: { totalSalaries, pendingSalaries, paidSalaries },
      stockouts: { totalStockouts, pendingStockouts, approvedStockouts, rejectedStockouts },
      tenantPayments: { totalTenantPayments, dueTenantPayments, paidTenantPayments, overdueTenantPayments },
      billPayments: { totalBillPayments, pendingBillPayments, paidBillPayments, overdueBillPayments },
      rentCollections: { totalRentCollections, paidRentCollections, pendingRentCollections, overdueRentCollections },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// receiver_type: { 
//       type: DataTypes.ENUM("tenant", "staff"), 
//       allowNull: false 
//     }, 
//     receiver_id


exports.getTenantDashboardStats = async (req, res) => {
  try {
    const tenantId = req.user.id;

    const [
      // Notifications
      totalNotifications,
      unreadNotifications,

      // Payment Requests
      totalPaymentsRequest,
      pendingPaymentsRequest,
      completedPaymentsRequest,

      // Complaints
      totalComplaints,
      inProgressComplaints,
      resolvedComplaints,

      // Rent Collections
      totalRentCollections,
      paidRentCollections,
      pendingRentCollections,
      overdueRentCollections,
      nextDueDate,

      // Tenant Inventories
      totalInventory,
      moveInInventories,
      moveOutInventories,

      // Tenant Vehicles
      totalVehicles,

      // Parking
      totalParking,
      onParking,

      // Tenant Payments (rent or other payments)
      totalTenantPayments,
      pendingTenantPayments,
      paidTenantPayments,
      overdueTenantPayments,
    ] = await Promise.all([
      // Notifications
      Notification.count({ where: { receiver_id: tenantId, receiver_type: "tenant" } }),
      Notification.count({ where: { receiver_id: tenantId, isRead: false, receiver_type: "tenant" } }),

      // Payment Requests
      PaymentRequest.count({ where: { tenantId } }),
      PaymentRequest.count({ where: { tenantId, status: "pending" } }),
      PaymentRequest.count({ where: { tenantId, status: "approved" } }),

      // Complaints
      Complaint.count({ where: { tenantId } }),
      Complaint.count({ where: { tenantId, status: "in_progress" } }),
      Complaint.count({ where: { tenantId, status: "resolved" } }),

      // Rent Collections
      TenantRentCollection.count({ where: { tenantId } }),
      TenantRentCollection.count({ where: { tenantId, status: "Paid" } }),
      TenantRentCollection.count({ where: { tenantId, status: "Pending" } }),
      TenantRentCollection.count({ where: { tenantId, status: "Overdue" } }),
      TenantRentCollection.findOne({
        where: { tenantId },
        order: [['nextDueDate', 'ASC']], // Get the earliest next due date
        attributes: ['nextDueDate']
      }),

      // Tenant Inventories
      TenantInventory.count({ where: { tenantId } }),
      TenantInventory.count({ where: { tenantId, type: "move-in" } }),
      TenantInventory.count({ where: { tenantId, type: "move-out" } }),

      // Tenant Vehicles
      TenantVehicle.count({ where: { tenantId } }),

      // Parking
      Parking.count({ where: { tenantId } }),
      Parking.count({ where: { tenantId, status: "onparking" } }),

      // Tenant Payments
      TenantPayment.count({ where: { tenantId } }),
      TenantPayment.count({ where: { tenantId, status: "due" } }),
      TenantPayment.count({ where: { tenantId, status: "paid" } }),
      TenantPayment.count({ where: { tenantId, status: "overdue" } }),
    ]);

    // Extract nextDueDate from the result of the findOne query
     const nextDueDateResult = nextDueDate ? nextDueDate.nextDueDate : null;

    // Send response
    res.json({
      notifications: { totalNotifications, unreadNotifications },
      paymentsRequest: { totalPaymentsRequest, pendingPaymentsRequest, completedPaymentsRequest },
      complaints: { totalComplaints, inProgressComplaints, resolvedComplaints },
      rentCollections: { totalRentCollections, paidRentCollections, pendingRentCollections, overdueRentCollections, nextDueDateResult },
      tenantInventories: { totalInventory, moveInInventories, moveOutInventories },
      tenantVehicles: { totalVehicles },
      parking: { totalParking, onParking },
      tenantPayments: { totalTenantPayments, pendingTenantPayments, paidTenantPayments, overdueTenantPayments },
    });

  } catch (error) {
    console.error("Error fetching tenant dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
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
      Notification.count({ where: { receiver_id: userId, receiver_type: "employee" } }),
      Notification.count({ where: { receiver_id: userId, isRead: false, receiver_type: "employee" } }),

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

