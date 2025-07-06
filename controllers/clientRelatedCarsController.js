const Booking = require("../models/Booking");
const Client = require("../models/Client");
const Car = require("../models/Car"); // Import the Car model

const getBookingHistory = async (req, res) => {
  const userId = req.user.id;
  const client = await Client.findOne({ user_id: userId });

  Booking.find({ clientId: client._id })
    .populate("carId")
    .populate("agent")
    .then((bookings) => {
      if (bookings.length === 0) {
        return res.status(404).json({ message: "No booking history found" });
      }
      res.status(200).json(bookings);
    })
    .catch((error) => {
      res.status(500).json({ message: error.message });
    });
};

const getClientWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await Client.findOne({ user_id: userId });

    const wishlistCars = await Promise.all(
      client.wishlist.map((carId) => Car.findById(carId).populate("agent"))
    );

    res.status(200).json(wishlistCars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCarToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await Client.findOne({ user_id: userId });
    const carId = req.params.carId;

    if (!client.wishlist.includes(carId)) {
      client.wishlist.push(carId);
      await client.save();
      res.status(200).json({ message: "Car added to wishlist" });
    } else {
      res.status(400).json({ message: "Car already in wishlist" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCarFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await Client.findOne({ user_id: userId });
    const carId = req.params.carId;

    if (client.wishlist.includes(carId)) {
      client.wishlist = client.wishlist.filter((id) => id.toString() !== carId);
      await client.save();
      res.status(200).json({ message: "Car removed from wishlist" });
    } else {
      res.status(400).json({ message: "Car not found in wishlist" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCarBookings = async (req, res) => {
  try {
    const carId = req.params.carId;
    const bookings = await Booking.find({ carId: carId });
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching car bookings: " + error.message });
  }
};

module.exports = {
  getBookingHistory,
  getClientWishlist,
  addCarToWishlist,
  removeCarFromWishlist,
  getCarBookings,
};
