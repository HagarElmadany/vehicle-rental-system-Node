const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { sendConfirmationEmail } = require("../utils/mailer");


//using ngrok to 
exports.handlePaymobWebhook = async (req, res) => {
  const payload = JSON.parse(req.rawBody);
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
    
    const booking = await Booking.findById(bookingId);

     // Update car availability status to "Rented"
    if (status === "paid" && booking.carId) {
      await Car.findByIdAndUpdate(booking.carId, { availabilityStatus: "Rented" });
    }
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
  const frontendUrl = `${process.env.FRONTEND_RETURN_URL}?${queryString}`;

  return res.redirect(frontendUrl);

};

