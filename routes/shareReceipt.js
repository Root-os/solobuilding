const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/receipts'));
  },
  filename: function (req, file, cb) {
    // Use a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/upload-receipt', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }
  // Construct public URL
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/receipts/${req.file.filename}`;
  res.json({ success: true, url: publicUrl });
});

module.exports = router;