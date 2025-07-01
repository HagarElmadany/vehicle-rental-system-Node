
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingById);
//get booking for specific client
router.get("/client/:clientId", bookingController.getBookingsByClient);
//get booking for specific agent
router.get('/agent/:agentId', bookingController.getBookingsByAgent);
//cancel booking that is pending
router.put("/:id/cancel", bookingController.cancelBooking);
//delete booking if a non paid booking 
router.delete("/:id", bookingController.deleteBooking);
//save booking and initiate payment 
router.post("/book-and-pay", bookingController.bookAndPay);
module.exports = router;
