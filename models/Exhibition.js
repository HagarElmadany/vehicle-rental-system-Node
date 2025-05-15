const mongoose = require('mongoose');

const exhibitionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    contactPhone: String,
    openingHours: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exhibition', exhibitionSchema);