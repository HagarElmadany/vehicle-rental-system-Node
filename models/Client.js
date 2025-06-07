const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  first_name: { type: String, required: true, maxlength: 100 },
  last_name: { type: String, required: true,  maxlength: 100 },
  phone_number: { type: String, required: false, maxlength: 15 },
  location: { type: String, required: false, maxlength: 100 },
  lat: { type: Number},
  lng: { type: Number},
  driver_license: { type: String, maxlength: 255 },
  verification_status: {
    type: String,
    enum: ['approved', 'pending', 'banned','rejected','suspended'],
    default: 'pending'
  },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Car' }]
});

module.exports = mongoose.model('Client', clientSchema);


/* explanation of verification status

approved
The client’s verification process is complete and successful. They are fully authorized and allowed to use the platform without restrictions.

pending
The client’s verification is still under review or waiting to be completed. They may have limited access until verification finishes.

banned
The client is prohibited from accessing the platform due to violations, fraud, or other serious issues. This is permenant.

rejected
The client’s verification request was reviewed and denied. They did not meet the necessary criteria to be verified and may need to reapply or fix issues.

suspended
The client’s access is temporarily disabled, often due to suspicious activity or pending investigation. Suspension is usually reversible after conditions are met or time passes.

*/