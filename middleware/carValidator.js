const { body } = require('express-validator');
const Car = require('../models/Car');

const allowedTransmissions = ['Automatic', 'Manual'];
const allowedFuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const allowedFuelLevels = ['Empty', 'Quarter', 'Half', 'Three-Quarters', 'Full'];
const allowedStatuses = ['Available', 'Rented'];
const allowedCategories = ['Wedding', 'Day Use', 'Trip', 'Business', 'Airport Pickup', 'Economy', 'Other'];

const carValidationRules = [
    body('brand').isString().notEmpty().withMessage('Brand is required'),
    body('model').isString().notEmpty().withMessage('Model is required'),
    body('type').isString().notEmpty().withMessage('Type is required'),
    // Uniqueness check for license plate
    body('licensePlate')
        .isString()
        .notEmpty().withMessage('License plate is required')
        .custom(async (value, { req }) => {
            const existingCar = await Car.findOne({ licensePlate: value });

            // If we're updating a car, allow same licensePlate if it belongs to the same car
            if (existingCar && (!req.params.id || existingCar._id.toString() !== req.params.id)) {
                throw new Error('License plate must be unique');
            }

            return true;
        }),
    body('transmission').isIn(allowedTransmissions).withMessage('Invalid transmission'),
    body('fuel_type').isIn(allowedFuelTypes).withMessage('Invalid fuel type'),
    body('seats').isInt({ min: 2, max: 8 }).withMessage('Seats must be between 2 and 8'),
    body('year').isInt({ min: 1980, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    body('color').isString().notEmpty().withMessage('Color is required'),
    body('odometerReading').isFloat({ min: 0 }).withMessage('Odometer reading must be >= 0'),
    body('totalPricePerHour').isFloat({ min: 0 }).withMessage('Total hourly price must be >= 0'),
    body('totalPricePerDay').isFloat({ min: 0 }).withMessage('Total daily price must be >= 0'),
    body('rentalRatePerHour').optional().isFloat({ min: 0 }),
    body('rentalRatePerDay').optional().isFloat({ min: 0 }),
    body('availabilityStatus').optional().isIn(allowedStatuses).withMessage('Invalid availability status'),
    body('fuelLevel').optional().isIn(allowedFuelLevels).withMessage('Invalid fuel level'),
    body('category').isIn(allowedCategories).withMessage('Invalid category'),
];


const updateCarValidationRules = [
    body('brand').optional().isString().notEmpty().withMessage('Brand is required'),
    body('model').optional().isString().notEmpty().withMessage('Model is required'),
    body('type').optional().isString().notEmpty().withMessage('Type is required'),
    body('licensePlate').optional().isString().notEmpty().withMessage('License plate is required'),
    body('transmission').optional().isIn(['Automatic', 'Manual']).withMessage('Invalid transmission'),
    body('fuelType').optional().isIn(['Petrol', 'Diesel', 'Electric']).withMessage('Invalid fuel type'),
    body('seats').optional().isInt({ min: 2, max: 8 }).withMessage('Seats must be between 2 and 8'),
    body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    body('color').optional().isString().notEmpty().withMessage('Color is required'),
    body('odometer').optional().isFloat({ min: 0 }).withMessage('Odometer reading must be >= 0'),
    body('pricePerHour').optional().isFloat({ min: 0 }).withMessage('Total hourly price must be >= 0'),
    body('pricePerDay').optional().isFloat({ min: 0 }).withMessage('Total daily price must be >= 0'),
    body('category').optional().isIn(allowedCategories).withMessage('Invalid category'),
];

module.exports = {
    carValidationRules,
    updateCarValidationRules
};