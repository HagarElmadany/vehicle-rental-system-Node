const cron = require('node-cron');
const Booking = require('../models/Booking');

// Run every Sunday at 1:00 AM
cron.schedule('0 1 * * 0', async () => {
  try {
    const result = await Booking.deleteMany({ status: 'pending' });
    console.log(`Pending bookings deleted: ${result.deletedCount}`);
  } catch (err) {
    console.error('Error deleting pending bookings:', err.message);
  }
});