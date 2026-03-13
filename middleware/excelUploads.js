const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/excel");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `tenant-import-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File type validation (Excel only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /xlsx|xls/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (extname && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only Excel files (.xlsx, .xls) are allowed."
      )
    );
  }
};

// Init multer
const excelUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
}).single("file");

module.exports = excelUpload;
