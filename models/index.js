const BillPayment = require('./billPayment');
const BillType = require('./billType');
const ElectricCarCharging = require('./charging');
const Complaint = require('./complaint');
const Email = require('./email');
const Expense = require('./expense');
const ExpenseType = require('./expenseType');
const Floor = require('./floor');
const Item = require('./item');
const Purchase=require('./Purchase');
const ItemType = require('./itemType');
const Notification = require('./notification');
const NotificationType = require('./notificationType');
const Parking = require('./parking');
const PaymentRequest = require('./paymentRequests');
const PaymentType = require('./paymentType');
const Tenant = require('./tenant');
const TenantPayment = require('./tenantPayments');
const TenantRentCollection = require('./tenantRentCollection');
const TenantVehicle = require('./tenantVehicle');
const Unit = require('./unit');
const User = require('./user');
const purchaseRequest = require('./purchaseRequest');
const WithdrawalRequest = require('./withdrawal');
const itemAssignments = require('./itemAssignment');
const Maintenance = require('./maintenance');

module.exports = {
    BillPayment,
    BillType,
    ElectricCarCharging,
    Complaint,
    Email,
    Expense,
    ExpenseType,
    Floor,
    Item,
    ItemType,
    Notification,
    NotificationType,
    Parking,
    PaymentRequest,
    PaymentType,
    Tenant,
    TenantPayment,
    TenantRentCollection,
    TenantVehicle,
    Unit,
    User,
    WithdrawalRequest,
    Purchase,
    purchaseRequest,
    itemAssignments,
    Maintenance,
};
