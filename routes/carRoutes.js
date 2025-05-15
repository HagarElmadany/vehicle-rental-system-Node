const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const upload = require('../middleware/upload');

// Public routes
router.get('/', carController.getAllCars);
router.get('/:id', carController.getCarById);
router.post('/', upload.array('carPhotos', 5), carController.createCar); // max 5 images
router.put('/:id', upload.array('carPhotos', 5), carController.updateCar);
router.delete('/:id', carController.deleteCar);

module.exports = router;