const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// const authorizeUser = require('../middleware/authorizeUser');

//save payment and handle callback payment
router.post("/webhook/paymob", express.json(), paymentController.handlePaymobWebhook);
router.get("/payments/:bookingId/status", paymentController.getPaymentStatus);
router.get("/payment/result", paymentController.paymentResultPage);

// // Authenticated users can check payment status
// router.get("/payments/:bookingId/status", authorizeUser, paymentController.getPaymentStatus);

// // Authenticated users can view payment result
// router.get("/payment/result", authorizeUser, paymentController.paymentResultPage);


module.exports = router;
