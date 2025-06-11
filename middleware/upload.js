const multer = require('multer');
const path = require('path');

// Storage config with dynamic destination
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/others'; // default fallback

    if (file.fieldname === 'driver_license') {
      folder = 'uploads/driver_licenses';
    } else if (file.fieldname === 'ID_document') {
      folder = 'uploads/id_documents';
    } else if (file.fieldname === 'carPhotos') {
      folder = 'uploads/cars';
    } else if (file.fieldname === 'documents') { 
      folder = 'uploads/documents';
    }

    cb(null, folder);
  },

  filename: function (req, file, cb) {
    const filename = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
    const uniqueName = `${Date.now()}-${filename}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

module.exports = upload;
