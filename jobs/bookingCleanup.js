const cron = require('node-cron');
const Booking = require('../models/Booking');
const TempPaymentSession = require('../models/TempPaymentSession');

// Run every Sunday at 1:00 AM
cron.schedule('0 1 * * 0', async () => {
  try {
    // Find all pending bookings
    const pendingBookings = await Booking.find({ status: 'pending' }, '_id');
    const bookingIds = pendingBookings.map(b => b._id);

    // Delete the bookings
    const result = await Booking.deleteMany({ _id: { $in: bookingIds } });

    // Delete related temp sessions
    const sessionResult = await TempPaymentSession.deleteMany({ bookingId: { $in: bookingIds } });

    console.log(`Pending bookings deleted: ${result.deletedCount}`);
    console.log(`Related payment sessions deleted: ${sessionResult.deletedCount}`);
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
},{ timezone: 'Africa/Cairo' });
