// models/TempPaymentSession.js
const mongoose = require('mongoose');

const tempPaymentSessionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  },
  iframeUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('TempPaymentSession', tempPaymentSessionSchema);
