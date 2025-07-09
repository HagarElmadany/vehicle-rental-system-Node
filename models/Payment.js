const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: { type: String, required: true },
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String },
  currency: { type: String },
  payment_status: { type: String ,enum: ["pending", "paid", "cancelled", "failed","rejected","timeout"]},
  transaction_id: { type: String },
  paid_at: { type: Date },
   refund_status: {
    type: String,
    enum: ["not_requested", "requested", "partial", "refunded", "rejected"],
    default: "not_requested",
  },
  refund_amount: {
    type: Number,
    default: 0
  },
  refunded_at: Date
}, { timestamps: true });


module.exports = mongoose.model("Payment", paymentSchema);
