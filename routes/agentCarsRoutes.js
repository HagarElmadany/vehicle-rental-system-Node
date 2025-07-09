const express = require('express');
const router = express.Router();
const agentCarsController = require('../controllers/agentCarsController');
const upload = require('../middleware/upload');
const authorizeUser = require('../middleware/authorizeUser');
const ensureApprovedAgent = require('../middleware/ensureApprovedAgent');
const { carValidationRules, updateCarValidationRules } = require('../middleware/carValidator');
const validate = require('../middleware/validate');

//agent routes
// Ensure the agent is authenticated and approved
router.use(authorizeUser);
router.use(ensureApprovedAgent);

router.get('/bookings', agentCarsController.getBookingsForAgentCars);

router.get('/', agentCarsController.getAllCars);
router.get('/:id', agentCarsController.getCarById);
router.post('/', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]), carValidationRules,
    validate, agentCarsController.createCar);
router.put('/:id', upload.fields([
    { name: 'carPhotos', maxCount: 5 },
    { name: 'documents', maxCount: 5 }
]),
    updateCarValidationRules,
    validate, agentCarsController.updateCar);


router.delete('/:id', agentCarsController.deleteCar);



module.exports = router;
