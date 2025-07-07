const router = require("express").Router();
const agreementController = require("../controllers/agreementController");
const authorizeUser = require("../middleware/authorizeUser");

// Generate agreement for a booking
router.post(
  "/generate/:bookingId",
  authorizeUser,
  agreementController.generateAgreement
);

// Sign an existing agreement
router.put(
  "/sign/:agreementId",
  authorizeUser,
  agreementController.signAgreement
);

// Get agreement details
router.get("/:agreementId", authorizeUser, agreementController.getAgreement);

// Download agreement PDF
router.get(
  "/download/:agreementId",
  authorizeUser,
  agreementController.downloadAgreement
);

module.exports = router;
