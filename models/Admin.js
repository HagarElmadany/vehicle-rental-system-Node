const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
  },
  permissions: {
    type: [String],
    default: ['manage_users', 'approve_vehicles', 'view_bookings']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);
