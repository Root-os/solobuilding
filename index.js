require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");
const hpp = require("hpp");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const config = require("./config/config");
const sequelize = require("./config/database");
const defineAssociation = require("./models/association");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/uploads", express.static(path.join(__dirname, "uploads/")));
// Security & Performance Middlewares
app.use(helmet());

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(xss());
app.use(hpp());
app.use(morgan("combined"));
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

defineAssociation();

sequelize
  .sync({ force: false, alter: false })
  .then(async () => {
    console.log("Database & tables are up to date!");
    // Ensure `nationalId` column allows NULL to match the model definition.
    try {
      // MySQL: modify column to allow NULL (keeps VARCHAR(255) as default mapping)
      await sequelize.query(
        "ALTER TABLE `tenants` MODIFY COLUMN `nationalId` VARCHAR(255) NULL;"
      );
      console.log("Ensured tenants.nationalId allows NULL in DB.");
    } catch (alterErr) {
      // Log but don't crash the server; alteration may not be necessary or permitted
      console.error(
        "Could not alter tenants.nationalId column (may already match):",
        alterErr.message || alterErr
      );
    }
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

// Routes
app.use("/api", routes);
app.get("/", (req, res) => res.send("Server is running happy coding!"));

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

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
