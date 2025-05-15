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
    res.send('getCarById');
};

exports.createCar = async (req, res) => {
    res.send('createCar');
};

exports.updateCar = async (req, res) => {
    res.send('updateCar');
};

exports.deleteCar = async (req, res) => {
    res.send('deleteCar');
};
