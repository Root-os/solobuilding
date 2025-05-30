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
  let whereCondition = {};
  let stockoutWhereCondition = {};

  if(req.query.startDate && req.query.endDate) {
    whereCondition = {
      createdAt: {
        [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
      }
    };
  }
  if(req.query.startDate && !req.query.endDate) {
    whereCondition = {
      createdAt: {
        [Op.gte]: new Date(req.query.startDate)
      }
    };
  }

  if(!req.query.startDate && req.query.endDate) {
    whereCondition = {
      createdAt: {
        [Op.lte]: new Date(req.query.endDate)
      }
    };
  }
  if(req.query.startDate && req.query.endDate) {
    stockoutWhereCondition = {
      approvedAt: {
        [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
      }
    };
  }
  if(req.query.startDate && !req.query.endDate) {
    stockoutWhereCondition = {
      approvedAt: {
        [Op.gte]: new Date(req.query.startDate)
      }
    };
  }

  if(!req.query.startDate && req.query.endDate) {
    stockoutWhereCondition = {
      approvedAt: {
        [Op.lte]: new Date(req.query.endDate)
      }
    };
  }
  try {
    const [
      // Notifications
      totalNotifications,
      sentNotifications,
      readNotifications,

      // Payments
      totalPaymentsRequest,
      pendingPaymentsRequest,
      completedPaymentsRequest,

      // Complaints
      totalComplaints,
      inProgressComplaints,
      resolvedComplaints,
      notResolvedComplaints,

      // Units
      totalUnits,
      availableUnits,
      occupiedUnits,
      underMaintenanceUnits,

      // Floors
      totalFloors,
      availableFloors,
      underMaintenanceFloors,

      // Tenants
      totalTenants,
      activeTenants,
      inactiveTenants,
      

      // Tenant Vehicles
      totalVehicles,

      // Tenant Inventories
      totalInventory,
      moveInInventories,
      moveOutInventories,

      // Parking
      totalParking,
      onParking,
      readyToOut,
      completed,

      // Expenses
      totalExpenses,

      // Inventory
      totalItems,
      totalPurchasedItems,
      totalExistedItems,
      alertNumberOfItems,

      // Withdrawal Requests
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
      completedStockouts,
      rejectedStockouts,

      // Tenant Payments
      totalTenantPayments,
      pendingTenantPayments,
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
    
      Notification.count({where:whereCondition}),
      Notification.count({ where: { isRead: false,...whereCondition } }),
      Notification.count({ where: { isRead: true,...whereCondition } }),

      // Payments
      PaymentRequest.count({where:whereCondition}),
      PaymentRequest.count({ where: { status: "pending", ...whereCondition  } }),
      PaymentRequest.count({ where: { status: "approved", ...whereCondition } }),

      // Complaints
      Complaint.count({where:whereCondition}),
      Complaint.count({ where: { status: "in_progress", ...whereCondition } }),
      Complaint.count({ where: { status: "resolved", ...whereCondition } }),
      Complaint.count({ where: { status: "pending", ...whereCondition } }),

      // Units
      Unit.count(),
      Unit.count({ where: { status: "available" } }),
      Unit.count({ where: { status: "occupied" } }),
      Unit.count({ where: { status: "under_maintenance" } }),

      // Floors
      Floor.count(),
      Floor.count({ where: { status: "available" } }),
      Floor.count({ where: { status: "under_maintenance" } }),

      // Tenants
      Tenant.count({where:whereCondition}),
      Tenant.count({ where: { status: "active", ...whereCondition } }),
      Tenant.count({ where: { status: "inactive", ...whereCondition } }),
      // Tenant.count({ where: { status: "terminated" } }),

      // Tenant Vehicles
      TenantVehicle.count(),

      // Tenant Inventories
      TenantInventory.count(),
      TenantInventory.count({ where: { type: "move-in" } }),
      TenantInventory.count({ where: { type: "move-out" } }),

      // Parking
      Parking.count({where:whereCondition}),
      Parking.count({ where: { status: "onparking", ...whereCondition } }),
      Parking.count({ where: { status: "ready to out", ...whereCondition } }),
      Parking.count({ where: { status: "completed", ...whereCondition } }),

      // Expenses
      Expense.count({where:whereCondition}),

      // Inventory
      Inventory.count(),
      Inventory.count({ where: { itemType: "Purchase" } }),
      Inventory.count({ where: { itemType: "Existing" } }),
      Inventory.count({where:{itemAmount: {
        [Op.lte]: Sequelize.col('min_amount')  // Op.lte stands for "less than or equal to"
      }}}),

      // Withdrawal Requests
      WithdrawalRequest.count({where:whereCondition}),
      WithdrawalRequest.count({ where: { status: "pending", ...whereCondition } }),
      WithdrawalRequest.count({ where: { status: "approved", ...whereCondition } }),
      WithdrawalRequest.count({ where: { status: "rejected", ...whereCondition } }),
      WithdrawalRequest.count({ where: { status: "in_progress", ...whereCondition } }),

      // Emails
      Email.count({where:whereCondition}),
      Email.count({ where: { status: "sent", ...whereCondition } }),
      // Email.count({ where: { status: "read" } }),

      // Employees
      await Employee.count({
        include: [
          {
            model: Role,
            where: { name: 'employee' } 
          }
        ]
      })
      ,
      // Employee.count({ where: { role: "admin" } }),

      // Salaries
      Salary.count({where:whereCondition}),
      Salary.count({ where: { status: "pending", ...whereCondition } }),
      Salary.count({ where: { status: "paid", ...whereCondition } }),

      // Stockouts
      Stockout.count({where:stockoutWhereCondition}),
      Stockout.count({ where: { status: "pending",...stockoutWhereCondition} }),
      Stockout.count({ where: { status: "approved",...stockoutWhereCondition} }),
      Stockout.count({ where: { status: "rejected", ...stockoutWhereCondition} }),

      // Tenant Payments
      TenantPayment.count({where:whereCondition}),
      TenantPayment.count({ where: { status: "due", ...whereCondition } }),
      TenantPayment.count({ where: { status: "paid", ...whereCondition } }),
      TenantPayment.count({ where: { status: "overdue", ...whereCondition } }),

      // Bill Payments
      BillPayment.count({where: whereCondition}),
      BillPayment.count({ where: { status: "pending",...whereCondition } }),
      BillPayment.count({ where: { status: "paid",...whereCondition } }),
      BillPayment.count({ where: { status: "overdue",...whereCondition } }),

      // Rent Collections
      TenantRentCollection.count({where:whereCondition}),
      TenantRentCollection.count({ where: { status: "Paid", ...whereCondition } }),
      TenantRentCollection.count({ where: { status: "Pending", ...whereCondition } }),
      TenantRentCollection.count({ where: { status: "Overdue", ...whereCondition } }),
    ]);

    // Send response
    res.json({
      notifications: { totalNotifications, sentNotifications, readNotifications },
      paymentsRequest: { totalPaymentsRequest, pendingPaymentsRequest, completedPaymentsRequest },
      complaints: { totalComplaints, inProgressComplaints, resolvedComplaints, notResolvedComplaints },
      units: { totalUnits, availableUnits, occupiedUnits, underMaintenanceUnits },
      floors: { totalFloors, availableFloors, underMaintenanceFloors },
      tenants: { totalTenants, activeTenants, inactiveTenants },
      tenantVehicles: { totalVehicles },
      TenantInventories: { totalInventory, moveInInventories, moveOutInventories },
      parking: { totalParking, onParking, readyToOut, completed },
      expenses: { totalExpenses },
      items: { totalItems, totalPurchasedItems, totalExistedItems,alertNumberOfItems },
      ExistingRequests: { totalWithdrawals, pendingWithdrawals, approvedWithdrawals, rejectedWithdrawals, processedWithdrawals },
      emails: { totalEmails, sentEmails },
      employees: { totalEmployees },
      EmployeeSalaries: { totalSalaries, pendingSalaries, paidSalaries },
      stockouts: { totalStockouts, pendingStockouts, completedStockouts, rejectedStockouts },
      tenantPayments: { totalTenantPayments, pendingTenantPayments, paidTenantPayments, overdueTenantPayments },
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

