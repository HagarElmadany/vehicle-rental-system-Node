const Car = require("../models/Car");
const Agent = require("../models/Agent");
const Booking = require("../models/Booking");

exports.searchCars = async (req, res) => {
  try {
    const { pickupDate, returnDate, pickupLocation } = req.query;

    if (!pickupDate || !returnDate || !pickupLocation) {
      return res
        .status(400)
        .json({ message: "Missing required query parameters" });
    }

    const agents = await Agent.find({
      location: pickupLocation,
      verification_status: "approved",
    });

    if (agents.length === 0) {
      return res
        .status(404)
        .json({ message: "No approved agents found in this location" });
    }

    const agentIds = agents.map((agent) => agent._id);

    const cars = await Car.find({
      agent: { $in: agentIds },
      approval_status: "approved",
      availabilityStatus: { $in: ["Available", "Rented"] },
    }).populate("agent");

    const availableCars = [];

    for (const car of cars) {
      // Check for overlapping bookings
      const overlappingBookings = await Booking.find({
        car: car._id,
        $or: [
          {
            startDate: { $lt: new Date(returnDate) },
            endDate: { $gt: new Date(pickupDate) },
          },
        ],
      });

      if (overlappingBookings.length === 0) {
        availableCars.push(car);
      }
    }

    if (availableCars.length === 0) {
      return res.status(404).json({ message: "No available cars found" });
    }

    res.status(200).json(availableCars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
