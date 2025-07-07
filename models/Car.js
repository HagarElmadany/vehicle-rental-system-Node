const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  brand: { type: String, required: true }, //-
  model: { type: String, required: true }, //-
  type: { type: String, required: true },  //-
  year: { type: Number, required: true }, //-
  licensePlate: { type: String, required: true, unique: true }, //-
  // vin: { type: String, required: true, unique: true }, 
  transmission: { type: String, enum: ['Automatic', 'Manual'], required: true }, //-
  fuel_type: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'], required: true }, //-
  seats: { type: Number, min: 2, max: 8, required: true },  //-
  color: { type: String, required: true }, //-
  // mileage: { type: Number, required: true },
  rentalRatePerDay: { type: Number, default: 40 },
  rentalRatePerHour: { type: Number, default: 10 },
  availabilityStatus: { type: String, enum: ['Available', 'Rented'], default: 'Available' }, //-
  rating: { type: Number, min: 0, max: 5, default: 4.5 }, //-
  depositRequired: { type: Number, default: 100 }, //-
  insuranceStatus: { type: String, enum: ['Full Coverage', 'Partial Coverage', 'No Coverage'], default: 'Full Coverage' },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDue: { type: Date },
  conditionNotes: { type: String },
  fuelLevel: { type: String, enum: ['Empty', 'Quarter', 'Half', 'Three-Quarters', 'Full'], default: 'Full' }, //-
  odometerReading: { type: Number, required: true }, //-
  lastRentedDate: { type: Date },
  expectedReturnDate: { type: Date },
  totalPricePerHour: { type: Number, required: true }, //-
  totalPricePerDay: { type: Number, required: true }, //-
  documents: [{ type: String }],
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  with_driver: { type: Boolean, default: false },
  carPhotos: [{ type: String }],
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
}, { timestamps: true });

const Car = mongoose.model('Car', carSchema);

module.exports = Car;