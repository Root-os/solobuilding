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
exports.getDashboardStats = async (req, res) => {
  try {
    // Notifications
    const totalNotifications = await Notification.count();
    const sentNotifications = await Notification.count({ where: { isRead: false } });
    const readNotifications = await Notification.count({ where: { isRead: true } });

    // Payments
    const totalPaymentsRequest = await PaymentRequest.count();
    const pendingPaymentsRequest = await PaymentRequest.count({ where: { status: "pending" } });
    const completedPaymentsRequest = await PaymentRequest.count({ where: { status: "approved" } });

    // Complaints
    const totalComplaints = await Complaint.count();
    const inProgressComplaints = await Complaint.count({ where: { status: "in_progress" } });
    const resolvedComplaints = await Complaint.count({ where: { status: "resolved" } });
    const notResolvedComplaints = await Complaint.count({ where: { status: "pending" } });

    // units
    const totalUnits = await Unit.count();
    const availableUnits = await Unit.count({ where: { status: "available" } });
    const occupiedUnits = await Unit.count({ where: { status: "occupied" } });
    const underMaintenanceUnits = await Unit.count({ where: { status: "under_maintenance" } });

    //floors
    const totalFloors = await Floor.count();
    const availableFloors = await Floor.count({ where: { status: "available" } });
    const underMaintenanceFloors = await Floor.count({ where: { status: "under_maintenance" } });

    //tenants
    const totalTenants = await Tenant.count();
    const activeTenants = await Tenant.count({ where: { status: "active" } });
    const inactiveTenants = await Tenant.count({ where: { status: "inactive" } });
    const terminatedTenants = await Tenant.count({ where: { status: "terminated" } });

    //tenant vehicles
    const totalVehicles = await TenantVehicle.count();
    //tenant inventories
    const totalInventory = await TenantInventory.count();
    const moveInInventories = await TenantInventory.count({ where: { type: "move-in" } });
    const moveOutInventories = await TenantInventory.count({ where: { type: "move-out" } });

    //parking
    const totalParking = await Parking.count();
    const onParking= await Parking.count({ where: { status: "onparking" } });
    const readyToOut= await Parking.count({ where: { status: "ready to out" } });
    const completed= await Parking.count({ where: { status: "completed" } });

    //expenses
    const totalExpenses = await Expense.count();

    //inventory
    const totalItems = await Inventory.count();
    const totalPurchasedItems = await Inventory.count({ where: { itemType: "Purchase" } });
    const totalExistedItems = await Inventory.count({ where: { itemType: "Existing" } });

    //withdrawal requests
    const totalWithdrawals = await WithdrawalRequest.count();
    const pendingWithdrawals = await WithdrawalRequest.count({ where: { status: "pending" } });
    const approvedWithdrawals = await WithdrawalRequest.count({ where: { status: "approved" } });
const rejectedWithdrawals = await WithdrawalRequest.count({ where: { status: "rejected" } });
const processedWithdrawals = await WithdrawalRequest.count({ where: { status: "in_progress" } });

    //emails
    const totalEmails = await Email.count();
    const sentEmails = await Email.count({ where: { status: "sent", } });
    const readEmails = await Email.count({ where: { status: "read", } });


    //employees
    const totalEmployees = await Employee.count({ where: { role: "employee" } });
    const adminEmployees = await Employee.count({ where: { role: "admin" } });

    //salaries
    const totalSalaries = await Salary.count();
    const pendingSalaries = await Salary.count({ where: { status: "pending" } });
    const paidSalaries = await Salary.count({ where: { status: "paid" } });


    //stockouts
    const totalStockouts = await Stockout.count();
    const pendingStockouts = await Stockout.count({ where: { status: "pending" } });
    const completedStockouts = await Stockout.count({ where: { status: "approved" } });
    const rejectedStockouts = await Stockout.count({ where: { status: "rejected" } });


    //payments
    const totalTenantPayments = await TenantPayment.count();
    const pendingTenantPayments = await TenantPayment.count({ where: { status: "due" } });
    const paidTenantPayments = await TenantPayment.count({ where: { status: "paid" } });
    const overdueTenantPayments = await TenantPayment.count({ where: { status: "overdue" } });

    //bills
    const totalBillPayments = await BillPayment.count();
    const pendingBillPayments = await BillPayment.count({ where: { status: "pending" } });
    const paidBillPayments = await BillPayment.count({ where: { status: "paid" } });
    const overdueBillPayments = await BillPayment.count({ where: { status: "overdue" } });


    //rent collections
    const totalRentCollections = await TenantRentCollection.count();
    const paidRentCollections = await TenantRentCollection.count({ where: { status: "Paid" } });
    const pendingRentCollections = await TenantRentCollection.count({ where: { status: "Pending" } });
    const overdueRentCollections = await TenantRentCollection.count({ where: { status: "Overdue" } });

    // Send response
    res.json({
      notifications: { totalNotifications, sentNotifications, readNotifications },
      paymentsRequest: { totalPaymentsRequest, pendingPaymentsRequest, completedPaymentsRequest },
      complaints: { totalComplaints, inProgressComplaints, resolvedComplaints, notResolvedComplaints }
      , units: { totalUnits, availableUnits, occupiedUnits, underMaintenanceUnits }
      , floors: { totalFloors, availableFloors, underMaintenanceFloors }
      , tenants: { totalTenants, activeTenants, inactiveTenants, terminatedTenants }
      , tenantVehicles: { totalVehicles }
      , TenantInventories: { totalInventory, moveInInventories, moveOutInventories }
      , parking: { totalParking, onParking, readyToOut, completed }
      , expenses: { totalExpenses }
      , items: { totalItems, totalPurchasedItems, totalExistedItems }
      , TenantWithdrawalRequests: { totalWithdrawals, pendingWithdrawals, approvedWithdrawals, rejectedWithdrawals, processedWithdrawals }
      , emails: { totalEmails, sentEmails, readEmails }
      , employees: { totalEmployees, adminEmployees }
      , EmployeeSalaries: { totalSalaries, pendingSalaries, paidSalaries }
      , stockouts: { totalStockouts, pendingStockouts, completedStockouts, rejectedStockouts }
      , tenantPayments: { totalTenantPayments, pendingTenantPayments, paidTenantPayments, overdueTenantPayments }
      , billPayments: { totalBillPayments, pendingBillPayments, paidBillPayments, overdueBillPayments }
      , rentCollections: { totalRentCollections, paidRentCollections, pendingRentCollections, overdueRentCollections }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
