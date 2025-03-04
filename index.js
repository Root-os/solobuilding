const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const sequelize = require('./config/database');
const defineAssociation = require('./models/association');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = config.PORT?? 3000;

// Security & Performance Middlewares
app.use(helmet());
// app.use(rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: "Too many requests from this IP, please try again later.",
// }));
app.use(cors({
  origin:"*", //config.CORS_ORIGIN?? "http://localhost:3000", 
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use(xss());
app.use(hpp());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json());

// Database Connection & Associations
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to the database!");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};
connectDB();

defineAssociation(); // Define associations before syncing models


sequelize.sync({alter: true})
  .then(() => {
    console.log('Database & tables are up to date!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

// Routes
app.use('/api', routes);
app.get('/', (req, res) => res.send('Server is running happy coding!'));

// Handle 404 - Route Not Found
app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.status = 404;
  next(error);
});


// Error Handling Middleware (MUST be last)
app.use(errorHandler);

// Graceful Shutdown Handling (SIGINT & SIGTERM)
const shutdown = async () => {
  console.log("Shutting down server...");
  await sequelize.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

