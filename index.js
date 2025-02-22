require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
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


// inventory
const itemTypeRoutes = require('./routes/itemTyperoutes');
const itemsRoutes = require('./routes/itemRoutes');

const settingRoutes = require('./routes/settingRoutes');

const chargingRoutes = require('./routes/chargingRoute');


const app = express();
const PORT = process.env.PORT || 3000;

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

//inventory
app.use('/api/item-types', itemTypeRoutes); 
app.use('/api/items', itemsRoutes); 
app.use('/api/setting', settingRoutes); 
app.use('/api/charging', chargingRoutes); 
// Properly isolate Swagger documentation routes

// Sync database and create tables if they don't exist
sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  
// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
