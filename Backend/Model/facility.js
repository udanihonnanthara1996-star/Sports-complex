const mongoose = require('mongoose');
// Define the schema for a facility that can be booked
const facilitySchema = new mongoose.Schema({
   // Name of the facility, required and trimmed to remove extra spaces
  name: { type: String, required: true, trim: true },
  // Type of facility, limited to predefined values
  type: {
    type: String,
    required: true,
    enum: ['gym', 'cricket', 'tennis', 'swimming_pool', 'football']
  },
  // Optional description of the facility
  description: { type: String, default: '' },
  // Hourly booking price for the facility
  pricePerHour: { type: Number, required: true },
  // List of available booking slots for each day of the week
  availableSlots: [{
    // Day name for the slot, limited to valid days of the week
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    // Slot start time in HH:MM format
    startTime: String,
    // Slot end time in HH:MM format
    endTime: String
  }],
  // Maximum number of people allowed at once
  maxCapacity: { type: Number, default: 1 },
  // Whether the facility is active and available for booking
  isActive: { type: Boolean, default: true },
  // Timestamp for when the facility record was created
  createdAt: { type: Date, default: Date.now }
});
// Export the Facility model for use in other parts of the app
module.exports = mongoose.model('Facility', facilitySchema);
