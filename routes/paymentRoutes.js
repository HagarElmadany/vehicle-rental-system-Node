const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authorizeUser = require('../middleware/authorizeUser');

//save payment and handle callback payment
router.post("/webhook/paymob", express.json(), paymentController.handlePaymobWebhook);
// Authenticated users can check payment status
router.get("/:bookingId/status", authorizeUser, paymentController.getPaymentStatus);

// Authenticated users can view payment result
router.get("/payment/result", authorizeUser, paymentController.redirectPaymentResultPage);

// router.get("/token", paymentController.getToken);
router.post("/refund/:bookingId", authorizeUser, paymentController.refundPayment);

router.get('/resume/:bookingId',authorizeUser, paymentController.resumePayment);

module.exports = router;
