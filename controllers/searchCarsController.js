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
      verification_status: "approved",
    });

    const filteredAgents = agents.filter(
      (agent) =>
        agent.location &&
        agent.location.trim().toLowerCase() ===
          pickupLocation.trim().toLowerCase()
    );

    if (filteredAgents.length === 0) {
      return res
        .status(404)
        .json({ message: "No approved agents found in this location" });
    }

    const agentIds = filteredAgents.map((agent) => agent._id);

    const cars = await Car.find({
      agent: { $in: agentIds },
      approval_status: "approved",
      availabilityStatus: { $in: ["Available", "Rented"] },
    }).populate("agent");

    const availableCars = [];

    const reqStart = new Date(pickupDate);
    const reqEnd = new Date(returnDate);

    for (const car of cars) {
      const bookings = await Booking.find({ carId: car._id });

      const hasOverlap = bookings.some((booking) => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        return bookingStart < reqEnd && bookingEnd > reqStart;
      });

      if (!hasOverlap) {
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
