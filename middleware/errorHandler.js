const multer = require("multer");
const { ValidationError } = require("sequelize");

// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle Multer File Upload Errors
  if (err instanceof multer.MulterError) {
    const errorMessages = {
      LIMIT_FILE_SIZE: "File size exceeds limit!",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field!",
    };
    statusCode = 400;
    message = errorMessages[err.code] || err.message;
  }

  // Handle Sequelize Validation Errors
  else if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(", ");
  }

  // Handle Authentication & Authorization Errors
  else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized access!";
  } else if (err.name === "ForbiddenError") {
    statusCode = 403;
    message = "You do not have permission to perform this action!";
  }

  // Handle Not Found Errors
  else if (err.name === "NotFoundError") {
    statusCode = 404;
    message = "Requested resource not found!";
  }

  // Handle Invalid JSON Syntax
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON payload!";
  }

  // Handle Unexpected Type Errors & Other Internal Errors
  else if (err instanceof TypeError) {
    statusCode = 500;
    message = "An unexpected error occurred!";
  }

  // Hide internal errors in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal Server Error";
  }

  // Log detailed errors in development mode
  if (process.env.NODE_ENV !== "production") {
    console.error("🔥 Error:", err);
  }

  return res.status(statusCode).json({ error: message });
};

// Catch Unhandled Promise Rejections & Global Errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err);
  process.exit(1); // Exit to prevent further damage
});

module.exports = errorHandler;
