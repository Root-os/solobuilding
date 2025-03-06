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
const Salary= require("../models/salaryPayment");
const Stockout= require("../models/stockout");
const TenantPayment= require("../models/tenantPayments");
const BillPayment= require("../models/billPayment");
const { Op,Sequelize } = require('sequelize');



exports.getDashboardStats = async (req, res) => {
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
      terminatedTenants,

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
      readEmails,

      // Employees
      totalEmployees,
      adminEmployees,

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
      // Notifications
      Notification.count(),
      Notification.count({ where: { isRead: false } }),
      Notification.count({ where: { isRead: true } }),

      // Payments
      PaymentRequest.count(),
      PaymentRequest.count({ where: { status: "pending" } }),
      PaymentRequest.count({ where: { status: "approved" } }),

      // Complaints
      Complaint.count(),
      Complaint.count({ where: { status: "in_progress" } }),
      Complaint.count({ where: { status: "resolved" } }),
      Complaint.count({ where: { status: "pending" } }),

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
      Tenant.count(),
      Tenant.count({ where: { status: "active" } }),
      Tenant.count({ where: { status: "inactive" } }),
      Tenant.count({ where: { status: "terminated" } }),

      // Tenant Vehicles
      TenantVehicle.count(),

      // Tenant Inventories
      TenantInventory.count(),
      TenantInventory.count({ where: { type: "move-in" } }),
      TenantInventory.count({ where: { type: "move-out" } }),

      // Parking
      Parking.count(),
      Parking.count({ where: { status: "onparking" } }),
      Parking.count({ where: { status: "ready to out" } }),
      Parking.count({ where: { status: "completed" } }),

      // Expenses
      Expense.count(),

      // Inventory
      Inventory.count(),
      Inventory.count({ where: { itemType: "Purchase" } }),
      Inventory.count({ where: { itemType: "Existing" } }),
      Inventory.count({where:{itemAmount: {
        [Op.lte]: Sequelize.col('min_amount')  // Op.lte stands for "less than or equal to"
      }}}),

      // Withdrawal Requests
      WithdrawalRequest.count(),
      WithdrawalRequest.count({ where: { status: "pending" } }),
      WithdrawalRequest.count({ where: { status: "approved" } }),
      WithdrawalRequest.count({ where: { status: "rejected" } }),
      WithdrawalRequest.count({ where: { status: "in_progress" } }),

      // Emails
      Email.count(),
      Email.count({ where: { status: "sent" } }),
      Email.count({ where: { status: "read" } }),

      // Employees
      Employee.count({ where: { role: "employee" } }),
      Employee.count({ where: { role: "admin" } }),

      // Salaries
      Salary.count(),
      Salary.count({ where: { status: "pending" } }),
      Salary.count({ where: { status: "paid" } }),

      // Stockouts
      Stockout.count(),
      Stockout.count({ where: { status: "pending" } }),
      Stockout.count({ where: { status: "approved" } }),
      Stockout.count({ where: { status: "rejected" } }),

      // Tenant Payments
      TenantPayment.count(),
      TenantPayment.count({ where: { status: "due" } }),
      TenantPayment.count({ where: { status: "paid" } }),
      TenantPayment.count({ where: { status: "overdue" } }),

      // Bill Payments
      BillPayment.count(),
      BillPayment.count({ where: { status: "pending" } }),
      BillPayment.count({ where: { status: "paid" } }),
      BillPayment.count({ where: { status: "overdue" } }),

      // Rent Collections
      TenantRentCollection.count(),
      TenantRentCollection.count({ where: { status: "Paid" } }),
      TenantRentCollection.count({ where: { status: "Pending" } }),
      TenantRentCollection.count({ where: { status: "Overdue" } }),
    ]);

    // Send response
    res.json({
      notifications: { totalNotifications, sentNotifications, readNotifications },
      paymentsRequest: { totalPaymentsRequest, pendingPaymentsRequest, completedPaymentsRequest },
      complaints: { totalComplaints, inProgressComplaints, resolvedComplaints, notResolvedComplaints },
      units: { totalUnits, availableUnits, occupiedUnits, underMaintenanceUnits },
      floors: { totalFloors, availableFloors, underMaintenanceFloors },
      tenants: { totalTenants, activeTenants, inactiveTenants, terminatedTenants },
      tenantVehicles: { totalVehicles },
      TenantInventories: { totalInventory, moveInInventories, moveOutInventories },
      parking: { totalParking, onParking, readyToOut, completed },
      expenses: { totalExpenses },
      items: { totalItems, totalPurchasedItems, totalExistedItems,alertNumberOfItems },
      TenantWithdrawalRequests: { totalWithdrawals, pendingWithdrawals, approvedWithdrawals, rejectedWithdrawals, processedWithdrawals },
      emails: { totalEmails, sentEmails, readEmails },
      employees: { totalEmployees, adminEmployees },
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
