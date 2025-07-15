// all cars with no access
const Car = require('../models/Car');
const fs = require('fs');
const path = require('path');



// Get only approved cars (public)
exports.getApprovedCars = async (req, res) => {
  try {
    const approvedCars = await Car.find({ approval_status: 'approved' }).populate('agent');
    res.status(200).json(approvedCars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//----------------------------------------------------------------------------------------------
// Get all cars
exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.find().populate('agent');
        res.status(200).json(cars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single car by ID
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate('agent');
        if (!car) return res.status(404).json({ message: 'Car not found' });
        res.status(200).json(car);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a car
exports.createCar = async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const carPhotos = [];
        const documents = [];

        if (req.files && Object.keys(req.files).length > 0) {
            if (req.files.carPhotos) {
                req.files.carPhotos.forEach(file => {
                    carPhotos.push(`${baseUrl}/uploads/cars/${file.filename}`);
                });
            }

            if (req.files.documents) {
                req.files.documents.forEach(file => {
                    documents.push(`${baseUrl}/uploads/documents/${file.filename}`);
                });
            }
        }

        const carData = {
            ...req.body,
            carPhotos,
            documents,
            is_approved: req.body.is_approved ?? false,
            with_driver: req.body.with_driver ?? false
        };

        const car = new Car(carData);
        await car.save();
        res.status(201).json(car);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a car
exports.updateCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const carPhotos = [];
        const documents = [];

        // Handle new uploaded files
        if (req.files && Object.keys(req.files).length > 0) {
            if (req.files.carPhotos && car.carPhotos?.length > 0) {
                car.carPhotos.forEach(photoUrl => {
                    const filename = photoUrl.split('/uploads/cars/')[1];
                    if (filename) {
                        const filePath = path.join(__dirname, '..', 'uploads', 'cars', filename);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    }
                });
            }

            if (req.files.documents && car.documents?.length > 0) {
                car.documents.forEach(docUrl => {
                    const filename = docUrl.split('/uploads/documents/')[1];
                    if (filename) {
                        const filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    }
                });
            }

            // Add new files
            if (req.files.carPhotos) {
                req.files.carPhotos.forEach(file => {
                    carPhotos.push(`${baseUrl}/uploads/cars/${file.filename}`);
                });
            }

            if (req.files.documents) {
                req.files.documents.forEach(file => {
                    documents.push(`${baseUrl}/uploads/documents/${file.filename}`);
                });
            }
        }

        const updatedData = {
            ...req.body,
        };

        if (carPhotos.length > 0) updatedData.carPhotos = carPhotos;
        if (documents.length > 0) updatedData.documents = documents;
        if (req.body.is_approved !== undefined) updatedData.is_approved = req.body.is_approved;
        if (req.body.with_driver !== undefined) updatedData.with_driver = req.body.with_driver;

        const updatedCar = await Car.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true
        });

        res.status(200).json(updatedCar);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a car
exports.deleteCar = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: 'Car not found' });

        if (car.availabilityStatus?.toLowerCase() === 'rented') {
            return res.status(400).json({ message: 'Cannot delete a car that is currently rented.' });
        }

        // Delete car photos
        car.carPhotos?.forEach(photoUrl => {
            const filename = photoUrl.split('/uploads/cars/')[1];
            if (filename) {
                const filePath = path.join(__dirname, '..', 'uploads', 'cars', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, err => {
                        if (err) console.error('Failed to delete car photo:', filePath);
                    });
                }
            }
        });

        // Delete document images
        car.documents?.forEach(docUrl => {
            const filename = docUrl.split('/uploads/documents/')[1];
            if (filename) {
                const filePath = path.join(__dirname, '..', 'uploads', 'documents', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, err => {
                        if (err) console.error('Failed to delete document:', filePath);
                    });
                }
            }
        });

        await car.deleteOne();
        res.status(200).json({ message: 'Car deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAvailabilityStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Available', 'Rented'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });

  car.availabilityStatus = status;
  await car.save();

  res.json({ message: `Car marked as ${status}` });
};
