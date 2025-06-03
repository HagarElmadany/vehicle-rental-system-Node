const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_name: { type: String, required: true, maxlength: 100 },
  phone_number: { type: String, required: true, maxlength: 15 },
  location: { type: String, required: true, maxlength: 100 },
  ID_document: { type: String, maxlength: 100 },
  verification_status: {
    type: String,
    enum: ['approved', 'pending', 'banned','rejected','suspended'],
    default: 'pending'
  },
  lat: { type: Number},
  lng: { type: Number},
  opening_hours: { type: String, maxlength: 100 }, //not a number because it will be like "Mon-Fri 9:00-18:00"

  permissions: {
    type: [String],
    default: ['manage_vehicles', 'view_bookings']
  }
});

module.exports = mongoose.model('Agent', agentSchema);