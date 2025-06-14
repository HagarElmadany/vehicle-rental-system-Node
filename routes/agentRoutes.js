const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const upload = require('../middleware/upload');
const agentAuth = require('../middleware/agentAuth');
const ensureApprovedAgent = require('../middleware/ensureApprovedAgent');

//agent routes
// Ensure the agent is authenticated and approved
router.use(agentAuth);
router.use(ensureApprovedAgent);

router.get('/cars', agentController.getAllCars);
router.get('/cars/:id', agentController.getCarById);
router.post('/cars/', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), agentController.createCar);
router.put('/cars/:id', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), agentController.updateCar);
router.delete('/cars/:id', agentController.deleteCar);

module.exports = router;
