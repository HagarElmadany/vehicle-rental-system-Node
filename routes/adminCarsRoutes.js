const express = require('express');
const router = express.Router();
const adminCarsController = require('../controllers/adminCarsController');
const upload = require('../middleware/upload');
const authorizeUser = require('../middleware/authorizeUser');
const { isAdmin } = require('../middleware/isAdmin'); 

//admin routes
// Ensure the admin is authenticated
router.use(authorizeUser);
router.use(isAdmin);


// Get all pending cars
router.get('/pending', adminCarsController.getPendingCars);

// Get all approved cars
router.get('/approved', adminCarsController.getApprovedCars);

// Get all rejected cars
router.get('/rejected', adminCarsController.getRejectedCars);


// Approve car
router.put('/:id/approve', adminCarsController.approveCar);

// Reject car
router.put('/:id/reject', adminCarsController.rejectCar);


// Get all car bookings
router.get('/booking', adminCarsController.getCarBookings);

module.exports = router;
