const BillPayment = require("./billPayment");
const BillType = require("./billType");
const ElectricCarCharging = require("./charging");
const Complaint = require("./complaint");
const Email = require("./email");
const Expense = require("./expense");
const ExpenseType = require("./expenseType");
const Floor = require("./floor");
const Item = require("./item");
const Purchase = require("./purchase");
const ItemCategory = require("./itemCategory");
const Notification = require("./notification");
const NotificationType = require("./notificationType");
const Parking = require("./parking");
const PaymentRequest = require("./paymentRequests");
const PaymentType = require("./paymentType");
const Tenant = require("./tenant");
const TenantPayment = require("./tenantPayments");
const TenantRentCollection = require("./tenantRentCollection");
const TenantVehicle = require("./tenantVehicle");
const Unit = require("./unit");
const User = require("./user");
const purchaseRequest = require("./purchaseRequest");
const WithdrawalRequest = require("./withdrawal");
const itemAssignments = require("./itemAssignment");
const Maintenance = require("./maintenance");
const Vendor = require("./Vendor");
const ServiceType = require("./ServiceType");
const Return = require("./return");
const payment = require("./payment");
const LetterType = require("./letterType");
const Letter = require("./letter");
const Role = require('./role');
const Permission = require('./permission');
const Task = require('./task');
const sequelize = require('../config/database');

module.exports = {
  sequelize,
  Role,
  Permission,
  Task,
  BillPayment,
  BillType,
  ElectricCarCharging,
  Complaint,
  Email,
  Expense,
  ExpenseType,
  Floor,
  Item,
  ItemCategory,
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
  Vendor,
  ServiceType,
  Return,
  payment,
  LetterType,
  Letter,
};
