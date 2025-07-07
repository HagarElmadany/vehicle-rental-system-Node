const router = require("express").Router();
const agreementController = require("../controllers/agreementController");
const authorizeUser = require("../middleware/authorizeUser");

router.post(
  "/generate/:bookingId",
  authorizeUser,
  agreementController.generateAgreement
);

router.put(
  "/sign/:agreementId",
  authorizeUser,
  agreementController.signAgreement
);

router.get("/:agreementId", authorizeUser, agreementController.getAgreement);

router.get(
  "/download/:agreementId",
  authorizeUser,
  agreementController.downloadAgreement
);

module.exports = router;
