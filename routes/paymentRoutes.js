const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

//save payment and handle callback payment
router.post("/webhook/paymob", express.json(), paymentController.handlePaymobWebhook);
router.get("/payments/:bookingId/status", paymentController.getPaymentStatus);
router.get("/payment/result", paymentController.paymentResultPage);


module.exports = router;
