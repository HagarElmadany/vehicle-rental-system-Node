const Car = require('../models/Car');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get all cars owned by agent
exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find({ agent: req.user.id }).populate('agent');
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single car by ID only if owned by agent
exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, agent: req.user.id }).populate('agent');
    if (!car) return res.status(404).json({ message: 'Car not found or access denied' });
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a car for the logged-in agent
exports.createCar = async (req, res) => {
  try {
    // Prevent agent from setting approval_status
    delete req.body.approval_status;

    // const baseUrl = `${req.protocol}://${req.get('host')}`;
    const carPhotos = [];
    const documents = [];

    if (req.files) {
      if (req.files.carPhotos) {
        req.files.carPhotos.forEach(file => {
          carPhotos.push(`${process.env.BASE_URL}/uploads/cars/${file.filename}`);
        });
      }

      if (req.files.documents) {
        req.files.documents.forEach(file => {
          documents.push(`${process.env.BASE_URL}/uploads/documents/${file.filename}`);
        });
      }
    }

    const carData = {
      ...req.body,
      agent: req.user.id,
      carPhotos,
      documents,
      with_driver: req.body.with_driver ?? false
    };

    const car = new Car(carData);
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a car owned by the agent
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, agent: req.user.id });
    if (!car) return res.status(404).json({ message: 'Car not found or access denied' });

    // Prevent agent from modifying approval_status
    delete req.body.approval_status;

    // const baseUrl = `${req.protocol}://${req.get('host')}`;
    const carPhotos = [];
    const documents = [];

    if (req.files) {
      if (req.files.carPhotos && car.carPhotos?.length > 0) {
        car.carPhotos.forEach(photoUrl => {
          const filename = photoUrl.split('/uploads/cars/')[1];
          const filePath = path.join(__dirname, '..', 'uploads', 'cars', filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }

      if (req.files.documents && car.documents?.length > 0) {
        car.documents.forEach(docUrl => {
          const filename = docUrl.split('/uploads/documents/')[1];
          const filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }

      if (req.files.carPhotos) {
        req.files.carPhotos.forEach(file => {
          carPhotos.push(`${process.env.BASE_URL}/uploads/cars/${file.filename}`);
        });
      }

      if (req.files.documents) {
        req.files.documents.forEach(file => {
          documents.push(`${process.env.BASE_URL}/uploads/documents/${file.filename}`);
        });
      }
    }

    const updatedData = {
      ...req.body,
      ...(carPhotos.length > 0 && { carPhotos }),
      ...(documents.length > 0 && { documents }),
    };

    // Validate and compare availabilityStatus
    const oldStatus = car.availabilityStatus;
    const newStatus = req.body.availabilityStatus;

    if (newStatus && !['Available', 'Rented'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid availability status. Only "Available" or "Rented" are allowed.' });
    }

    const updatedCar = await Car.findByIdAndUpdate(car._id, updatedData, {
      new: true,
      runValidators: true
    });

    // If availability status changed, update related booking(s)
    if (newStatus && oldStatus !== newStatus) {
      const today = new Date();

      today.setHours(today.getHours() + 3); // Adjust to local time zone
      if (newStatus === "Available") {
        const lastBooking = await Booking.findOne({
          carId: car._id,
          status: { $ne: "completed" },
          endDate: { $lte: today }
        }).sort({ endDate: -1 });

        if (lastBooking) {
          lastBooking.status = "completed";
          await lastBooking.save();
          console.log("Booking marked as completed");
        }
      }
    }

    res.status(200).json(updatedCar);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a car owned by agent
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, agent: req.user.id });
    if (!car) return res.status(404).json({ message: 'Car not found or access denied' });

    // Check if the car is currently rented
    if (car.availabilityStatus === 'Rented') {
      return res.status(400).json({ message: 'Cannot delete a rented car' });
    }

     // Check if the car has upcoming bookings
    const now = new Date();
    const hasFutureBooking = await Booking.exists({
      carId: car._id,
      startDate: { $gte: now },
      status: { $ne: 'cancelled' }  // exclude cancelled bookings
    });

    if (hasFutureBooking) {
      return res.status(400).json({ message: 'Cannot delete a car with upcoming reservations' });
    }

    const allFiles = [...(car.carPhotos || []), ...(car.documents || [])];

    allFiles.forEach((url) => {
      let folder = '';
      let filename = '';

      if (url.includes('/uploads/cars/')) {
        folder = 'cars';
        filename = url.split('/uploads/cars/')[1];
      } else if (url.includes('/uploads/documents/')) {
        folder = 'documents';
        filename = url.split('/uploads/documents/')[1];
      }

      if (filename) {
        const filePath = path.join(__dirname, '..', 'uploads', folder, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Deleted file:', filePath);
        }
      }
    });

    await car.deleteOne();
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Bookings for agent's cars only
exports.getBookingsForAgentCars = async (req, res) => {
  try {
    // Step 1: Get IDs of all cars owned by the agent
    const agentCarIds = await Car.find({ agent: req.user.id }).distinct('_id');

    // Step 2: Find bookings that belong to those cars
    const bookings = await Booking.find({ carId: { $in: agentCarIds } })
      .populate({
        path: 'carId',
        select: 'brand model year licensePlate carPhotos availabilityStatus',
      })
      .populate({
        path: 'clientId',
        select: 'first_name last_name phone_number',
        populate: {
          path: 'user_id',
          model: 'User',
          select: 'email'
        }
      });

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch bookings for agent cars',
      error: err.message
    });
  }
};