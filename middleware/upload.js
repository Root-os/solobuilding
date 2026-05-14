const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imageFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/service'); 
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// Initialize upload variable
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  },
});


const uploadDir = './uploads/receipts';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Configure Multer storage
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const receiptUpload = multer({ storage: receiptStorage });

const responseUploadDir = './uploads/responses';
if (!fs.existsSync(responseUploadDir)) {
  fs.mkdirSync(responseUploadDir, { recursive: true });
}

const responseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, responseUploadDir);  
  },
  filename: (req, file, cb) => {
    cb(null, `response-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const responseUpload = multer({
  storage: responseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

// Withdrawal upload directory
const withdrawalUploadDir = './uploads/withdrawals';
if (!fs.existsSync(withdrawalUploadDir)) {
  fs.mkdirSync(withdrawalUploadDir, { recursive: true });
}

// Storage config
const withdrawalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, withdrawalUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `withdrawal-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Optional: basic filter (you can improve later)
const withdrawalFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb('Only images, PDF, DOC, DOCX allowed');
  }
};

// Multer instance
const withdrawalUpload = multer({
  storage: withdrawalStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: withdrawalFileFilter,
});

const rentAttachmentUploadDir = './uploads/rent-attachments';

if (!fs.existsSync(rentAttachmentUploadDir)) {
  fs.mkdirSync(rentAttachmentUploadDir, { recursive: true });
}

// Storage config
const rentAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, rentAttachmentUploadDir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `rent-attachment-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File filter
const rentAttachmentFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;

  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimetype =
    /image\/jpeg|image\/jpg|image\/png|image\/gif|application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document/.test(
      file.mimetype
    );

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb('Only images, PDF, DOC, DOCX allowed');
  }
};

// Multer instance
const rentAttachmentUpload = multer({
  storage: rentAttachmentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: rentAttachmentFileFilter,
});



module.exports = {upload,receiptUpload,responseUpload, withdrawalUpload,rentAttachmentUpload,};