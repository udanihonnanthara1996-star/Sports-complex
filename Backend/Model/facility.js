const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ['gym', 'cricket', 'tennis', 'swimming_pool', 'football']
  },
  description: { type: String, default: '' },
  pricePerHour: { type: Number, required: true },
  availableSlots: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: String,
    endTime: String
  }],
  maxCapacity: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Facility', facilitySchema);
