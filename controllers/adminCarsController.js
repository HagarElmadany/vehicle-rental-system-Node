const Car = require('../models/Car');
const Booking = require('../models/Booking');

// GET: Get all pending cars
exports.getPendingCars = async (req, res) => {
  try {
    const cars = await Car.find({ approval_status: 'pending' }).populate('agent');
    res.status(200).json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get pending cars', error: err.message });
  }
};

// PUT: Approve car
exports.approveCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    car.approval_status = 'approved';
    await car.save();
    res.status(200).json({ message: 'Car approved successfully', car });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve car', error: err.message });
  }
};

// PUT: Reject car
exports.rejectCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    car.approval_status = 'rejected';
    await car.save();
    res.status(200).json({ message: 'Car rejected successfully', car });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject car', error: err.message });
  }
};


// Get all approved cars
exports.getApprovedCars = async (req, res) => {
  try {
    const approvedCars = await Car.find({ approval_status: 'approved' });
    res.status(200).json(approvedCars);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all rejected cars
exports.getRejectedCars = async (req, res) => {
  try {
    const rejectedCars = await Car.find({ approval_status: 'rejected' });
    res.status(200).json(rejectedCars);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};


// Get all car bookings with full nested data
exports.getCarBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'clientId',
        populate: {
          path: 'user_id',
          model: 'User',
          select: 'email role'
        },
        select: 'first_name last_name phone_number location'
      })
      .populate({
        path: 'carId',
        select: 'brand model year licensePlate carPhotos'
      })
      .populate({
        path: 'agent',
        populate: {
          path: 'user_id',
          model: 'User',
          select: 'email role'
        },
        select: 'company_name phone_number location'
      });

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
};