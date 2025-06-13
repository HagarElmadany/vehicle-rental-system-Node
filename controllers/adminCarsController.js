const Car = require('../models/Car');

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
