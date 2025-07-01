
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

const authorizeUser = require('../middleware/authorizeUser');
const { isAdmin } = require('../middleware/isAdmin');
const ensureApprovedAgent = require('../middleware/ensureApprovedAgent');

// Admin-only
router.get("/", authorizeUser, isAdmin, bookingController.getAllBookings);
// Authenticated users
router.get("/:id", authorizeUser, bookingController.getBookingById);

//get booking for specific client
// Only logged-in client
router.get("/client/:clientId", authorizeUser, bookingController.getBookingsByClient);

//get booking for specific agent
// Only approved agents
router.get('/agent/:agentId', authorizeUser, ensureApprovedAgent, bookingController.getBookingsByAgent);

//cancel booking that is pending
router.put("/:id/cancel", authorizeUser, bookingController.cancelBooking);

//delete booking if a non paid booking 
// Admin-only
router.delete("/:id", authorizeUser, isAdmin, bookingController.deleteBooking);

//save booking and initiate payment 
// Only authenticated user (client or agent)
router.post("/book-and-pay", authorizeUser, bookingController.bookAndPay);

module.exports = router;
