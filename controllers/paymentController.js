const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const TempPaymentSession = require('../models/TempPaymentSession');
const axios = require("axios");
require("dotenv").config();
const { sendConfirmationEmail } = require("../utils/mailer");
const { sendRefundEmail } = require("../utils/mailer");
const mongoose = require("mongoose");

//using ngrok to 
exports.handlePaymobWebhook = async (req, res) => {
  try {
    const data = req.body.obj;
    const bookingId = data.payment_key_claims?.extra?.bookingId;
    if (!bookingId) return res.status(400).send("Booking ID missing");

    const status = data.success ? "paid" : data.pending ? "pending" : "failed";

    await Booking.findByIdAndUpdate(bookingId, { status });
    const existingPayment = await Payment.findOne({ transaction_id: data.id });
    if (existingPayment) {
    return res.status(200).send("Already processed");
    }
    const payment = new Payment({
      payment_id: data.id,
      booking_id: bookingId,
      amount: data.amount_cents / 100,
      payment_method: "card",
      currency: data.currency || "EGP",
      payment_status: status,
      transaction_id: data.id,
      paid_at: status === "paid" ? new Date() : null
    });

    await payment.save();
      // Delete temporary session if payment is successful
    if (status === "paid") {
      await TempPaymentSession.deleteOne({ bookingId });
    }
    const booking = await Booking.findById(bookingId);
    await sendConfirmationEmail(booking.clientEmail, bookingId, data.amount_cents / 100);

    res.status(200).send("Webhook processed");
  } catch (err) {
    res.status(500).send("Webhook failed");
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId))
      return res.status(400).json({ error: "Invalid booking ID format" });

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    res.json({ status: booking.status });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};


exports.redirectPaymentResultPage = (req, res) => {
   // Reconstruct the query string from Paymob
  const queryString = new URLSearchParams(req.query).toString();
  
  // Redirect to Angular frontend result page
  const frontendUrl = `${process.env.FRONTEND_PAYMENT_RESULT_URL}?${queryString}`;

  return res.redirect(frontendUrl);

};

exports.refundPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({ booking_id: bookingId }).populate("booking_id");

    if (!payment) return res.status(404).json({ error: "Payment not found for this booking" });

    const booking = payment.booking_id;
    const now = new Date();
    const startDate = new Date(booking.startDate);

    if (payment.refund_status === "refunded")
      return res.status(400).json({ error: "Already refunded" });

    let refundAmount = 0;

    const paidAt = payment.paid_at;
    const minutesSincePayment = (now - paidAt) / (1000 * 60);
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

    if (minutesSincePayment <= 30) {
      refundAmount = payment.amount;
    } else if (hoursUntilStart >= 24) {
      refundAmount = payment.amount;
    } else if (hoursUntilStart >= 12) {
      refundAmount = payment.amount * 0.75;
    } else if (hoursUntilStart >= 1) {
      refundAmount = payment.amount * 0.5;
    } else{
      return res.status(400).json({ error: "Refund not allowed within 1 hour of booking start time" });
    }

    const authResponse = await axios.post("https://accept.paymob.com/api/auth/tokens", {
      api_key: process.env.PAYMOB_API_KEY,
    });
    const token = authResponse.data.token;

    const refundResponse = await axios.post("https://accept.paymob.com/api/acceptance/void_refund/refund", {
      auth_token: token,
      transaction_id: payment.transaction_id,
      amount_cents: Math.round(refundAmount * 100),
    });

    // Determine refund status based on refund amount
    if (refundAmount === payment.amount) {
      payment.refund_status = "refunded";
    } else if (refundAmount > 0) {
      payment.refund_status = "partial";
    } else {
      payment.refund_status = "rejected";
    }

    payment.refund_amount = refundAmount;
    payment.refunded_at = new Date();
    payment.payment_status = "cancelled";

    await payment.save();

    booking.status = "cancelled";
    await booking.save();

    // Send refund email to client
    const clientEmail = booking.clientEmail;
    await sendRefundEmail(clientEmail, bookingId, refundAmount);

    res.status(200).json({
      message: "Refund successful",
      refundAmount,
      paymob: refundResponse.data
    });

  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
};


exports.resumePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: "Invalid or missing booking ID" });
    }

    const session = await TempPaymentSession.findOne({ bookingId });

    if (!session) {
      return res.status(404).json({ error: "Payment session not found or expired" });
    }

    return res.status(200).json({ iframeUrl: session.iframeUrl });
  } catch (err) {
    return res.status(500).json({ error: "Server error", message: err.message });
  }
};