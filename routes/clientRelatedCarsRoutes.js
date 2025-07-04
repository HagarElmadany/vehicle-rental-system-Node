const router = require("express").Router();
const clientRelatedCarsController = require("../controllers/clientRelatedCarsController");
const authorizeUser = require("../middleware/authorizeUser");

router.get(
  "/history",
  authorizeUser,
  clientRelatedCarsController.getBookingHistory
);
router.get(
  "/wishlist",
  authorizeUser,
  clientRelatedCarsController.getClientWishlist
);
router.post(
  "/wishlist/:carId",
  authorizeUser,
  clientRelatedCarsController.addCarToWishlist
);

module.exports = router;
