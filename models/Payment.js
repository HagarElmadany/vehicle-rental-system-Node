const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: { type: String, required: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String },
  currency: { type: String },
  payment_status: { type: String ,enum: ["pending", "paid", "cancelled", "failed"]},
  transaction_id: { type: String },
  paid_at: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
