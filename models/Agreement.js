const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
    },
    signatureData: {
      type: String, // Base64 encoded signature
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "signed", "expired"],
      default: "pending",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agreement", agreementSchema);
