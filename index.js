require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser =require('cookie-parser');


const sequelize = require('./config/database');

const floorRoutes = require('./routes/floorRoute');
const unitRoutes = require('./routes/unitRoute');
const tenantRoutes = require('./routes/tenantRoutes');
const billTypeRoutes = require('./routes/billTypeRoute');
const tenantsPaymentRoutes = require('./routes/tenantPaymentRoute');
const PaymentRequestsRoutes = require('./routes/paymentRequestRoute');
const rentCollectionRoutes = require('./routes/rentCollectionRoutes');
const billPaymentsRoutes = require('./routes/billPaymentsRoute');
const notificationTypeRoutes = require('./routes/notificationTypeRoutes');
const notificationRoutes = require('./routes/notificationRoute');
const parkingRoutes = require('./routes/parkingRoute');
const expenseTypeRoutes = require('./routes/expenseTypeRoute');
const expenseRoutes = require('./routes/expenseRoute');
const  complaintRoutes  =require('./routes/complaintRoutes');
const dashboardRoutes = require("./routes/dashboardRoutes");
const withdrawalRequestRoutes = require("./routes/withdrawalRequestRoutes");
const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const tenantAuthRoutes = require('./routes/tenantAuthRoute');
const tenantVehicleRoutes = require('./routes/tenantVehicleRoutes');
const purchaseRoutes = require('./routes/purchaseRoute');
const purcRequestRoutes = require('./routes/purcRequestRoute');
const itemAssignmentRoutes = require('./routes/itemAssignRoute');
const maintenanceRoutes = require('./routes/maintainanceRoute');
const defineAssociation = require('./models/association');
const paymentTypeRoutes = require("./routes/paymentTypeRoutes");
const paymentRoutes = require("./routes/paymentRoute");
const vendorRoutes = require("./routes/vendorRoute");
const serviceTypeRoutes = require("./routes/serviceTypeRoue");
const returnRoutes = require("./routes/returnRoute");



// inventory
const itemTypeRoutes = require('./routes/itemCategory');
const itemsRoutes = require('./routes/itemRoutes');

const settingRoutes = require('./routes/settingRoutes');

const chargingRoutes = require('./routes/chargingRoute');


const app = express();
const PORT = process.env.PORT || 3000;

// Use cookie-parser middleware
app.use(cookieParser())

// Set security HTTP headers
app.use(helmet());

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Rate limiting to prevent DoS/DDoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
});
app.use(limiter);

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Log HTTP requests
app.use(morgan('combined'));

// Middleware to parse JSON request bodies
app.use(express.json()); // Ensure this comes before the routes

// Define routes
app.use('/api/floor', floorRoutes); 
app.use('/api/unit', unitRoutes); 
app.use('/api/tenant', tenantRoutes); 
app.use('/api/tenant-auth', tenantAuthRoutes);
app.use('/api/tenant-vehicle', tenantVehicleRoutes);

app.use('/api/bill-type', billTypeRoutes); 
app.use('/api/tenant-payments', tenantsPaymentRoutes); 
app.use('/api/payment-requests', PaymentRequestsRoutes); 
app.use('/api/rent-collection', rentCollectionRoutes); 
app.use('/api/bill-payments', billPaymentsRoutes); 
app.use('/api/parking', parkingRoutes); 
app.use('/api/notification', notificationRoutes); 
app.use('/api/notification-type', notificationTypeRoutes); 
app.use('/api/expense-type', expenseTypeRoutes); 
app.use('/api/expense', expenseRoutes); 
app.use('/api/complaints', complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/withdrawal-request", withdrawalRequestRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/auth", authRoutes);
//purchases
app.use('/api/purchases', purchaseRoutes);
app.use('/api/purchases-request', purcRequestRoutes);
app.use('/api/item-assignments', itemAssignmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.use("/api/payment-types", paymentTypeRoutes);

app.use("/api/service-type", serviceTypeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/returns", returnRoutes);



//inventory
app.use('/api/item-types', itemTypeRoutes); 
app.use('/api/items', itemsRoutes); 
app.use('/api/setting', settingRoutes); 
app.use('/api/charging', chargingRoutes); 
// Properly isolate Swagger documentation routes


// Sync database and create tables if they don't exist
sequelize.sync({alter: true})


  .then(() => {
    console.log('Database & tables are up to date!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });


// Define associations
defineAssociation();

  
// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});