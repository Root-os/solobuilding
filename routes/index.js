const express = require('express');

const router = express.Router();

router.use('/floor', require('./floorRoute'));
router.use('/unit', require('./unitRoute'));
router.use('/tenant', require('./tenantRoutes'));
router.use('/tenant-auth', require('./tenantAuthRoute'));
router.use('/tenant-vehicle', require('./tenantVehicleRoutes'));
router.use('/bill-type', require('./billTypeRoute'));
router.use('/tenant-payments', require('./tenantPaymentRoute'));
router.use('/payment-requests', require('./paymentRequestRoute'));
router.use('/rent-collection', require('./rentCollectionRoutes'));
router.use('/bill-payments', require('./billPaymentsRoute'));
router.use('/parking', require('./parkingRoute'));
router.use('/notification', require('./notificationRoute'));
router.use('/notification-type', require('./notificationTypeRoutes'));
router.use('/expense-type', require('./expenseTypeRoute'));
router.use('/expense', require('./expenseRoute'));
router.use('/complaints', require('./complaintRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/withdrawal-request', require('./withdrawalRequestRoutes'));
router.use('/email', require('./emailRoutes'));
router.use('/auth', require('./authRoutes'));

// Inventory
router.use('/item-types', require('./itemCategory'));
router.use('/items', require('./itemRoutes'));
router.use('/setting', require('./settingRoutes'));
router.use('/charging', require('./chargingRoute'));

//purchases
router.use('/purchases', require('./purchaseRoute'));
router.use('/purchases-request', require('./purcRequestRoute'));
router.use('/item-assignments', require('./itemAssignRoute'));
router.use('/maintenance', require('./maintainanceRoute'));
router.use("/tenant-inventory", require("./tenantInventoryRoutes"));
router.use("/payment-types", require("./paymentTypeRoutes"));
router.use("/service-type", require("./serviceTypeRoutes"));
router.use("/payments", require("./paymentRoute"));
router.use("/vendors", require("./vendorRoute"));
router.use("/returns", require("./returnRoute"));
router.use("/salary-payments", require("./salaryPaymentRoutes"));
router.use("/stockout", require("./stockoutRoutes"));

//letter 
router.use('/letter-type', require('./letterTypeRoute'));
router.use('/letter', require('./letterRoute'));

//asset
router.use('/asset', require('./assetTypeRoute'));
router.use('/asset-audits', require('./assetRoutes'));

//order
router.use('/order-type', require('./orderTypeRoute'));
router.use('/order', require('./orderRoute'));

//report
router.use('/report', require('./reportRoute'));
router.use('/tasks',require('./taskRoutes'));
router.use('/permissions',require('./permissionRoutes'));
router.use('/roles',require('./roleRoutes'));


module.exports = router;
