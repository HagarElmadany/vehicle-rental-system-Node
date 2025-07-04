const Car = require("../models/Car");
const Agent = require("../models/Agent");

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
    }).populate("agent");

    const availableCars = cars.filter((car) => {
      if (car.availabilityStatus === "Available") {
        return true;
      } else if (car.availabilityStatus === "Rented") {
        return car.expectedReturnDate < new Date(pickupDate);
      } else if (car.availabilityStatus === "Under Maintenance") {
        return false;
      }
      return false;
    });

    if (availableCars.length === 0) {
      return res.status(404).json({ message: "No available cars found" });
    }

    res.status(200).json(availableCars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
