const { verifyDriverLicense } = require('../services/verifyLicenseService');
const upload = require('../middleware/upload');

const express = require('express');
const router = express.Router();


router.post('/verify-driver-license', upload.single('driver_license'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }

  try {
    const result = await verifyDriverLicense(req.file.path, req.file.mimetype);

    if (!result.is_driver_license) {
      return res.status(400).json({
        success: false,
        message: "Not an Egyptian driver's license.",
        extractedInfo: result,
      });
    }

    res.status(200).json({
      success: true,
      message: "Driver license verified successfully.",
      extractedInfo: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Verification failed.',
    });
  }
});
module.exports = router;
