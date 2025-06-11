const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const upload = require('../middleware/upload');


// Public route: get only approved cars (for the website itself)
router.get('/approved', carController.getApprovedCars);



//---------------------------------------------------------------------
// Public routes // all cars with no access only for test till now
router.get('/', carController.getAllCars);
router.get('/:id', carController.getCarById);
router.post('/', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), carController.createCar); // max 5 images
router.put('/:id', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), carController.updateCar);
router.delete('/:id', carController.deleteCar);

module.exports = router;