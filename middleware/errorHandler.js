const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const errorMessages = {
      "LIMIT_FILE_SIZE": "File size exceeds limit!",
      "LIMIT_UNEXPECTED_FILE": "Unexpected file field!",
    };
    return res.status(400).json({ error: errorMessages[err.code] || err.message });
  }
  console.error("Error:", err);
  return res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
};

module.exports = errorHandler;
