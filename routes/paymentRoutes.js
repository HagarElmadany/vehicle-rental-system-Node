const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authorizeUser = require('../middleware/authorizeUser');
const verifyPaymobHmac = require("../middleware/verifyPaymobHmac");

//save payment and handle callback payment
router.post("/webhook/paymob", express.json(),verifyPaymobHmac, paymentController.handlePaymobWebhook);

// Authenticated users can check payment status
router.get("/:bookingId/status", authorizeUser, paymentController.getPaymentStatus);

// Authenticated users can view payment result
router.get("/payment/result", authorizeUser, paymentController.redirectPaymentResultPage);

// router.get("/token", paymentController.getToken);

module.exports = router;
