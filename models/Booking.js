const mongoose = require("mongoose");
const Car = require("./Car");
const Client=require("./Client");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const egyptianPhoneRegex = /^(\+201|01)[0-2,5]{1}[0-9]{8}$/;

const bookingSchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Client", 
    required: [true, "Client ID is required"],
    validate: [
    {
        validator: async function (v) {
          const client = await Client.findById(v);
          return !!client;
        },
        message: "Client not found with the provided ID"
      }]
  },
  carId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Car", 
    required: [true, "Car ID is required"],
    validate: [
      {
        validator: async function (v) {
          const car = await Car.findById(v);
          return !!car;
        },
        message: "Car not found with the provided ID"
      }
    ]
  },
  agent: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Agent"
},

  startDate: { 
    type: Date, 
    required: [true, "Start date is required"] 
  },
  endDate: { 
    type: Date, 
    required: [true, "End date is required"],
    validate: {
      validator: function (value) {
        return this.startDate <= value;
      },
      message: "End date must be after start date"
    }
  },

  totalCost: { 
    type: Number, 
    required: [true, "Total cost is required"],
    min: [1, "Total cost must be greater than 0"]
  },

  billingName: { 
    type: String, 
    required: [true, "Billing name is required"],
    minlength: [3, "Billing name must be at least 3 characters"]
  },
  billingPhone: { 
    type: String, 
    required: [true, "Phone number is required"],
    validate: {
      validator: v => egyptianPhoneRegex.test(v),
      message: "Invalid Egyptian phone number format"
    }
  },
  clientEmail: { 
    type: String, 
    required: [true, "Email is required"],
    validate: {
      validator: v => emailRegex.test(v),
      message: "Invalid email format"
    }
  },

  pickupLocation: { 
    type: String, 
    required: [true, "Pickup location is required"] 
  },
  dropoffLocation: { 
    type: String, 
    required: [true, "Drop-off location is required"] 
  },

  status: { 
    type: String, 
    enum: ["pending", "paid", "cancelled","completed"], 
    default: "pending" 
  },
  with_driver: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update 'updatedAt' on save
bookingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
