const Car = require('../models/Car');
const Exhibition = require('../models/Exhibition');
const fs = require('fs');
const path = require('path');

exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.find().populate('exhibition');
        res.status(200).json(cars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single car by ID
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate('exhibition');
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.status(200).json(car);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCar = async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const carPhotos = req.files?.map(file => `${baseUrl}/uploads/cars/${file.filename}`) || [];
        const carData = { ...req.body, carPhotos };
        const car = new Car(carData);
        await car.save();
        res.status(201).json(car);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        // Delete old images if new ones are uploaded
        if (req.files?.length > 0 && car.carPhotos?.length > 0) {
            car.carPhotos.forEach(photoUrl => {
                const filename = photoUrl.split('/uploads/cars/')[1];
                if (!filename) {
                    console.error('Filename extraction failed:', photoUrl);
                } else {
                    const filePath = path.join(__dirname, '..', 'uploads', 'cars', filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlink(filePath, err => {
                            if (err) console.error('Failed to delete old image:', filePath);
                        });
                    } else {
                        console.error('File does not exist:', filePath);
                    }
                }
            });
        }

        // Continue as usual
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const carPhotos = req.files?.map(file => `${baseUrl}/uploads/cars/${file.filename}`);
        const updatedData = { ...req.body };
        if (carPhotos?.length > 0) updatedData.carPhotos = carPhotos;

        const updatedCar = await Car.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json(updatedCar);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    if (car.availabilityStatus === 'Rented') {
      return res.status(400).json({ message: 'Cannot delete a car that is currently rented.' });
    }

    await car.deleteOne(); // or Car.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Car deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

