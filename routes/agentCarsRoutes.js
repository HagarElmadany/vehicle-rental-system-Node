const express = require('express');
const router = express.Router();
const agentCarsController = require('../controllers/agentCarsController');
const upload = require('../middleware/upload');
const authorizeUser = require('../middleware/authorizeUser');
const ensureApprovedAgent = require('../middleware/ensureApprovedAgent');

//agent routes
// Ensure the agent is authenticated and approved
router.use(authorizeUser);
router.use(ensureApprovedAgent);

router.get('/', agentCarsController.getAllCars);
router.get('/:id', agentCarsController.getCarById);
router.post('/', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), agentCarsController.createCar);
router.put('/:id', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), agentCarsController.updateCar);
router.delete('/:id', agentCarsController.deleteCar);

module.exports = router;
