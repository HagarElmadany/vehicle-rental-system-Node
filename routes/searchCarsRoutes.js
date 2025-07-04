const router = require("express").Router();
const searchCarsController = require("../controllers/searchCarsController");

router.get("/", searchCarsController.searchCars);

module.exports = router;
