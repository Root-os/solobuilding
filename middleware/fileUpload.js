const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/service',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
// Check file type
function checkFileType(file, cb) {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Files of type PDF, DOC, and DOCX only!');
  }
}
// Initialize upload
const Fileupload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, 
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single('contractTerms');

module.exports = Fileupload;