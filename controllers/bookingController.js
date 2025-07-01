const mongoose = require("mongoose");
const axios = require("axios");
const Booking = require("../models/Booking");
const Car = require("../models/Car");
const Client=require("../models/Client");
exports.bookAndPay = async (req, res) => {
  try {
    const {
      carId,
      startDate,
      endDate,
      totalCost,
      pickupLocation,
      dropoffLocation,
    } = req.body;
    
    const clientId = req.user.id; // from token

    if (!mongoose.Types.ObjectId.isValid(clientId))
      return res.status(400).json({ error: "Invalid client ID format" });

    // Fetch client and populate user info (email)
    const client = await Client.findOne({ user_id: clientId }).populate('user_id');
    if (!client) return res.status(404).json({ error: "Client not found" });

    const user = client.user_id;
    const billingName = `${client.first_name} ${client.last_name}`;
    const billingPhone = client.phone_number || "01234567890";
    const clientEmail = user?.email || "noemail@example.com";

    if (!mongoose.Types.ObjectId.isValid(carId))
      return res.status(400).json({ error: "Invalid car ID format" });

    const car = await Car.findById(carId).select("agent");
    if (!car) return res.status(404).json({ error: "Car not found" });


    const booking = new Booking({
      clientId: client._id,
      carId,
      agent: car.agent,
      startDate,
      endDate,
      totalCost,
      billingName,
      billingPhone,
      clientEmail,
      pickupLocation,
      dropoffLocation,
    });

    await booking.save();

    const paymobRes = await axios.post(
      "https://accept.paymob.com/v1/intention/",
      {
        amount: totalCost * 100,
        currency: "EGP",
        payment_methods: [5091332],
        items: [{ name: "Car Booking", amount: totalCost * 100, quantity: 1 }],
        billing_data: {
          first_name: billingName.split(" ")[0],
          last_name: billingName.split(" ")[1] || "Client",
          phone_number: billingPhone,
        },
        customer: {
          first_name: billingName.split(" ")[0],
          last_name: billingName.split(" ")[1] || "Client",
          email: clientEmail,
          extras: { bookingId: booking._id.toString() },
        },
        extras: { bookingId: booking._id.toString() },
        return_url: process.env.FRONTEND_RETURN_URL,
      },
      {
        headers: {
          Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentKey = paymobRes.data.payment_keys[0].key;
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    // Redirect user to payment iframe page
    // res.redirect(iframeUrl);

    res.json({ booking, iframeUrl });
  } catch (err) {
    if (err.name === "ValidationError") {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res
        .status(400)
        .json({ error: "Validation failed", details: errors });
    }

    if (err.response) {
      return res.status(500).json({
        error: "Paymob API error",
        details: err.response.data,
      });
    }

    res
      .status(500)
      .json({ error: "Unexpected server error", message: err.message });
  }
};

// Get a single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get all bookings for a specific client
exports.getBookingsByClient = async (req, res) => {
  try {
    const bookings = await Booking.find({ clientId: req.params.clientId });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Get all bookings (admin)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Cancel a booking (if status is pending)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "pending")
      return res
        .status(400)
        .json({ error: "Only pending bookings can be cancelled" });

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Delete a booking (if not paid)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status === "paid")
      return res.status(400).json({ error: "Cannot delete a paid booking" });

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Find bookings where agent matches the given agentId

exports.getBookingsByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Invalid agent ID format" });
    }

    const bookings = await Booking.find({ agent: agentId })
      .populate("carId") 
      .populate("clientId") 
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
