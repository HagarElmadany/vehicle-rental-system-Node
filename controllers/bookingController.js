const mongoose = require("mongoose");
const axios = require("axios");
const Booking = require("../models/Booking");
const TempPaymentSession = require("../models/TempPaymentSession");
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
    const now = new Date();
    const minStartDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hours ahead
    if (new Date(startDate) <= now || new Date(endDate) <= now) {
      return res.status(400).json({ error: "Start and end dates must be in the future." });
    }
     if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: "End date must be after start date." });
    }
    if (new Date(startDate) < minStartDate) {
      return res.status(400).json({
        error: "Start date must be at least 1 hours from now",
        earliestAllowedStart: minStartDate.toISOString()
      });
    }

    const clientId = req.user.id; // from token

    if (!mongoose.Types.ObjectId.isValid(clientId))
      return res.status(400).json({ error: "Invalid client ID format" });

    // Fetch client and populate user info (email)
    const client = await Client.findOne({ user_id: clientId }).populate('user_id');
    if (!client) return res.status(404).json({ error: "Client not found" });
    if (client.verification_status !== "approved") {
      return res.status(403).json({
        error: `Access denied: your account status is '${client.verification_status}'. Approval is required.`,
      });
    }
    const user = client.user_id;
    const billingName = `${client.first_name} ${client.last_name}`;
    const billingPhone = client.phone_number ;
    const clientEmail = user?.email ;

    if (!mongoose.Types.ObjectId.isValid(carId))
      return res.status(400).json({ error: "Invalid car ID format" });

    const car = await Car.findById(carId).select("agent approval_status availabilityStatus expectedReturnDate");
    if (!car) return res.status(404).json({ error: "Car not found" });
   
    if (car.approval_status !== "approved") {
    return res.status(400).json({ error: "Car is not approved for booking" });
  }
    if (car.availabilityStatus === "Under Maintenance") {
    return res.status(400).json({ error: `This car is currently under maintenance. It is expected to return on ${car.expectedReturnDate.toISOString()}.`, expectedReturnDate:`${car.expectedReturnDate.toISOString()}` });
  }
    const existingBookings = await Booking.find({
  carId,
  status: "paid"
});

const requestedStart = new Date(startDate);
const requestedEnd = new Date(endDate);

const overlappingBooking = existingBookings.find(booking => {
  const bookingStart = new Date(booking.startDate);
  const bookingEnd = new Date(booking.endDate);

  // Check if the date ranges overlap
  return (
    requestedStart <= bookingEnd && requestedEnd >= bookingStart
  );
});

if (overlappingBooking) {
  return res.status(400).json({
    error: "Car is already booked during this time"
  });
}
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
      with_driver: req.body.with_driver ?? false
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
          extras: {
            bookingId: booking._id.toString()
          }
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
    await TempPaymentSession.create({
      bookingId: booking._id,
      iframeUrl,
    });
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

// Delete a booking (if not paid)
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.status === "paid" || booking.status === "completed") {
      return res.status(400).json({ error: "Cannot delete a paid or completed booking" });
    }

    // Delete the booking
    await Booking.findByIdAndDelete(req.params.id);

    // Delete associated payment session
    await TempPaymentSession.deleteOne({ bookingId: booking._id });

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

exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const now = new Date();
    if (new Date(booking.startDate) > now || new Date(booking.endDate) < now) {
      return res.status(400).json({ message: 'Booking is not ongoing and cannot be completed' });
    }

    booking.status = 'completed';
    await booking.save();
    res.status(200).json({ message: 'Booking marked as completed', booking });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete booking', error: err.message });
  }
};

  // PUT /api/bookings/:id/return-car
exports.markAsReturned= async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const car = await Car.findById(booking.carId);
  if (car) {
    car.availabilityStatus = 'Available';
    car.expectedReturnDate = null;
    await car.save();
  }

  res.json({ message: 'Car marked as returned' });
};

// PATCH /api/bookings/:id/return-complete
exports.returnAndComplete = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('carId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const car = booking.carId;
    const now = new Date();

    // Ensure the booking is ongoing
    if (new Date(booking.startDate) > now || new Date(booking.endDate) < now) {
      return res.status(400).json({ message: 'Booking is not ongoing and cannot be completed' });
    }

    // Ensure the car is currently rented
    if (car.availabilityStatus !== 'Rented') {
      return res.status(400).json({ message: 'Car is not marked as rented' });
    }

    // 1. Mark car as returned
    car.availabilityStatus = 'Available';
    car.expectedReturnDate = null;
    await car.save();

    // 2. Mark booking as completed
    booking.status = 'completed';
    await booking.save();

    res.status(200).json({ message: 'Car returned and booking completed', booking });
  } catch (err) {
    res.status(500).json({ message: 'Failed to return and complete booking', error: err.message });
  }
};
exports.markAsRented = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const car = await Car.findById(booking.carId);
  if (!car) return res.status(404).json({ message: 'Car not found' });

  if (car.availabilityStatus !== 'Available') {
    return res.status(400).json({ message: 'Car is not available' });
  }

  car.availabilityStatus = 'Rented';
  await car.save();

  res.json({ message: 'Car marked as rented' });
};

exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  const now = new Date();
  if (new Date(booking.startDate) <= now) {
    return res.status(400).json({ message: 'Cannot cancel after start date' });
  }

  booking.status = 'cancelled';
  await booking.save();

  res.json({ message: 'Booking cancelled' });
};
